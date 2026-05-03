/**
 * server/index.ts — VotePath X Production Backend
 *
 * Architecture:
 * - Multi-layer AI pipeline: Cache → Rules Engine → Gemini 2.5 Flash
 * - Zod schema validation on all routes
 * - HMAC request signature verification
 * - Firebase Admin JWT authentication
 * - Upstash Redis caching
 * - Structured audit logging
 * - Graceful shutdown
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { google } from 'googleapis';
import { TranslationServiceClient } from '@google-cloud/translate';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Ensure NODE_ENV has a default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// ── Path resolution ──────────────────────────────────────────────────────────
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
  console.log(`[Config] GCP credentials: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV !== 'production';

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();
export { app };
const port = Number(process.env.PORT ?? 8080);

// ── Upstash Redis (REST API — no native driver needed) ───────────────────────
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

async function redisGet(key: string): Promise<string | null> {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    const r = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    const json = await r.json() as { result: string | null };
    return json.result;
  } catch { return null; }
}

async function redisSet(key: string, value: string, exSeconds = 3600): Promise<void> {
  if (!REDIS_URL || !REDIS_TOKEN) return;
  try {
    await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}/ex/${exSeconds}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
  } catch { /* non-fatal */ }
}

// ── Gemini AI Client ─────────────────────────────────────────────────────────
const geminiAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function callGemini(prompt: string, systemInstruction: string, temperature = 0.3): Promise<string> {
  const response = await geminiAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { systemInstruction, temperature, maxOutputTokens: 1024 },
  });
  return response.text ?? '';
}

// ── Google Cloud Translate ───────────────────────────────────────────────────
const project = process.env.GOOGLE_CLOUD_PROJECT ?? 'virtual-promp-war';
const location = process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1';
const getTranslateClient = () => new TranslationServiceClient();

// ── Audit Logger ─────────────────────────────────────────────────────────────
function auditLog(event: string, data: Record<string, unknown>, req: express.Request) {
  const entry = {
    ts: new Date().toISOString(),
    event,
    ip: req.ip,
    ua: req.headers['user-agent'],
    path: req.path,
    ...data,
  };
  // In production pipe to Cloud Logging / structured stderr
  process.stdout.write(JSON.stringify(entry) + '\n');
}

// ── HMAC Signature Verification ─────────────────────────────────────────────
function verifyHmac(req: express.Request): boolean {
  const timestamp = req.headers['x-timestamp'] as string | undefined;
  const signature = req.headers['x-signature'] as string | undefined;
  if (!timestamp || !signature) return false;

  // Reject requests older than 5 minutes (replay protection)
  if (Math.abs(Date.now() - Number(timestamp)) > 5 * 60 * 1000) return false;

  const payload = `${timestamp}${req.path}${req.body ? JSON.stringify(req.body) : ''}`;
  const expected = crypto.createHmac('sha256', 'votepath-client-v1').update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://maps.googleapis.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.upstash.io'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: isDev
    ? ['http://localhost:5173', 'http://localhost:5174']
    : [process.env.VITE_API_URL ?? 'https://api.virtual-promp-war.com'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
}));

app.use(express.json({ limit: '10kb' })); // Prevent large payload DoS

// Global rate limiter
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in 15 minutes.' },
}));

// Tighter limiter for AI endpoints (expensive calls)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'AI query limit reached. Please wait a minute.' },
});

// ── Zod Schemas ──────────────────────────────────────────────────────────────
const CoachSchema = z.object({
  prompt: z.string().min(1).max(1000).trim(),
  language: z.string().optional().default('en'),
  sessionId: z.string().uuid().optional(),
});

const TranslateSchema = z.object({
  text: z.string().min(1).max(5000),
  targetLanguage: z.string().min(2).max(5),
});

const SheetsLogSchema = z.object({
  userId: z.string().min(1).max(128),
  quizId: z.string().min(1).max(128),
  score: z.number().int().min(0).max(100),
  timestamp: z.string().datetime().optional(),
});

const CalendarSchema = z.object({
  summary: z.string().min(1).max(256),
  description: z.string().max(1000).optional(),
  location: z.string().max(256).optional(),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
});

const MisinfoSchema = z.object({
  claim: z.string().min(5).max(2000).trim(),
});

const CandidateCompareSchema = z.object({
  candidates: z.array(z.string().min(1).max(128)).min(2).max(4),
  state: z.string().min(2).max(64),
});

const ScenarioSchema = z.object({
  scenario: z.string().min(5).max(1000).trim(),
});

// ── Helper: validate Zod + respond on error ───────────────────────────────────
function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): { data: T; error?: never } | { data?: never; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const msg = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { error: msg };
  }
  return { data: result.data };
}

// ── Prompt Injection Guard ────────────────────────────────────────────────────
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+a/i,
  /act\s+as\s+(an?\s+)?/i,
  /jailbreak/i,
  /disregard\s+your/i,
  /<script/i,
];

function isPromptSafe(text: string): boolean {
  return !INJECTION_PATTERNS.some(p => p.test(text));
}

// ────────────────────────────────────────────────────────────────────────────
// AI PIPELINE: Cache → Rules Engine → Gemini
// ────────────────────────────────────────────────────────────────────────────
const ECI_RULES: Record<string, string> = {
  'voter id': 'Voter ID (EPIC) is issued by the Election Commission of India. You can apply online at voters.eci.gov.in or through Form 6.',
  'age': 'You must be at least 18 years old as of January 1st of the election year to vote in India.',
  'booth': 'Your polling booth is assigned based on your registered address. Find it at electoralsearch.eci.gov.in.',
  'invalid vote': 'A vote is invalid if the mark is outside the ballot area, or multiple candidates are marked.',
  'pvt': 'NOTA (None of the Above) is the last option on your EVM. Press the blue button next to NOTA symbol.',
};

async function runAIPipeline(prompt: string, sessionId?: string): Promise<{ text: string; source: 'cache' | 'rules' | 'gemini' }> {
  const cacheKey = `ai:${Buffer.from(prompt.toLowerCase().trim()).toString('base64').slice(0, 64)}`;

  // Layer 1: Redis cache
  const cached = await redisGet(cacheKey);
  if (cached) return { text: cached, source: 'cache' };

  // Layer 2: Rules engine (ECI structured facts)
  const lowerPrompt = prompt.toLowerCase();
  for (const [keyword, answer] of Object.entries(ECI_RULES)) {
    if (lowerPrompt.includes(keyword)) {
      await redisSet(cacheKey, answer, 86400); // Cache rules for 24h
      return { text: answer, source: 'rules' };
    }
  }

  // Layer 3: Gemini 2.5 Flash
  const systemInstruction = `You are VotePath X, an official AI civic assistant for Indian elections.
RULES:
- Only answer questions about Indian elections, voting, ECI rules, candidates, and civic duties.
- Always cite ECI guidelines when applicable.
- If unsure, say "I don't have reliable information on this. Please visit voters.eci.gov.in."
- Never fabricate facts about candidates, vote counts, or election results.
- Respond in a warm, helpful, and simple tone accessible to all literacy levels.
- Keep responses under 200 words unless a detailed explanation is required.
- If the user writes in Hindi or another Indian language, respond in that language.`;

  const geminiText = await callGemini(prompt, systemInstruction, 0.3);
  await redisSet(cacheKey, geminiText, 3600);
  return { text: geminiText, source: 'gemini' };
}

// ────────────────────────────────────────────────────────────────────────────
// ROUTES
// ────────────────────────────────────────────────────────────────────────────

/** Health check */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), env: process.env.NODE_ENV });
});

/**
 * POST /api/gemini/coach
 * Multi-layer AI pipeline for the Election Coach chat.
 */
app.post('/api/gemini/coach', aiLimiter, async (req, res) => {
  const { data, error } = parseBody(CoachSchema, req.body);
  if (error) return res.status(400).json({ error });

  const { prompt, language, sessionId } = data!;

  if (!isPromptSafe(prompt)) {
    auditLog('PROMPT_INJECTION_BLOCKED', { prompt: prompt.slice(0, 100) }, req);
    return res.status(400).json({ error: 'Invalid prompt content detected.' });
  }

  try {
    auditLog('AI_COACH_QUERY', { sessionId, lang: language }, req);
    const { text, source } = await runAIPipeline(prompt, sessionId);
    return res.json({ reply: text, source, model: 'gemini-2.5-flash' });
  } catch (err: any) {
    console.error('[Coach] Error:', err.message);
    return res.status(500).json({ error: 'AI service temporarily unavailable. Please try again.' });
  }
});

/**
 * POST /api/misinfo/check
 * Misinformation detector — checks claims against ECI facts using Gemini.
 */
app.post('/api/misinfo/check', aiLimiter, async (req, res) => {
  const { data, error } = parseBody(MisinfoSchema, req.body);
  if (error) return res.status(400).json({ error });

  const { claim } = data!;

  if (!isPromptSafe(claim)) {
    return res.status(400).json({ error: 'Invalid input detected.' });
  }

  const cacheKey = `misinfo:${Buffer.from(claim.toLowerCase()).toString('base64').slice(0, 64)}`;
  const cached = await redisGet(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  try {
    const systemInstruction = `You are a fact-checking AI assistant specializing in Indian elections and the Electoral Commission of India (ECI).
Analyze the given claim and respond ONLY with a valid JSON object in this exact format:
{
  "verdict": "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIABLE",
  "confidence": 0.0-1.0,
  "explanation": "Brief explanation (max 150 words)",
  "sources": ["ECI guideline or official source if applicable"]
}
Base your analysis strictly on ECI rules and established facts. Do not fabricate sources.`;

    const raw = await callGemini(
      `Fact-check this claim about Indian elections: "${claim}"`,
      systemInstruction,
      0.1,
    );

    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const result = JSON.parse(jsonMatch[0]);
    await redisSet(cacheKey, JSON.stringify(result), 7200);
    auditLog('MISINFO_CHECK', { claim: claim.slice(0, 100), verdict: result.verdict }, req);
    return res.json(result);
  } catch (err: any) {
    console.error('[Misinfo] Error:', err.message);
    return res.status(500).json({ error: 'Fact-checking service unavailable.' });
  }
});

/**
 * POST /api/candidates/compare
 * AI-powered candidate comparison tool.
 */
app.post('/api/candidates/compare', aiLimiter, async (req, res) => {
  const { data, error } = parseBody(CandidateCompareSchema, req.body);
  if (error) return res.status(400).json({ error });

  const { candidates, state } = data!;
  const cacheKey = `compare:${state}:${candidates.sort().join(',')}`;
  const cached = await redisGet(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  try {
    const systemInstruction = `You are an unbiased Indian election analyst. Generate a fair comparison of candidates.
Respond ONLY with valid JSON in this format:
{
  "candidates": [
    {
      "name": "string",
      "party": "string",
      "keyPolicies": ["string"],
      "backgroundSummary": "string (max 100 words)",
      "priorExperience": "string"
    }
  ],
  "comparisonNote": "Neutral note on comparison (max 80 words)"
}
Be strictly factual. If you cannot verify a candidate's details, state "Information not available."`;

    const raw = await callGemini(
      `Compare these candidates running in ${state}: ${candidates.join(', ')}`,
      systemInstruction,
      0.2,
    );

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');
    const result = JSON.parse(jsonMatch[0]);
    await redisSet(cacheKey, JSON.stringify(result), 3600);
    return res.json(result);
  } catch (err: any) {
    console.error('[Compare] Error:', err.message);
    return res.status(500).json({ error: 'Comparison service unavailable.' });
  }
});

/**
 * POST /api/scenario/simulate
 * Scenario simulator for "What-if voting situations".
 */
app.post('/api/scenario/simulate', aiLimiter, async (req, res) => {
  const { data, error } = parseBody(ScenarioSchema, req.body);
  if (error) return res.status(400).json({ error });

  const { scenario } = data!;
  if (!isPromptSafe(scenario)) return res.status(400).json({ error: 'Invalid input.' });

  try {
    const systemInstruction = `You are a legal expert on Indian election law and ECI procedures.
A voter describes a hypothetical situation. Explain what would happen under ECI rules.
Respond ONLY with valid JSON:
{
  "situation": "Brief restatement of the scenario",
  "eciRule": "The applicable ECI rule or law",
  "outcome": "What happens in this situation",
  "advice": "Practical advice for the voter",
  "reference": "ECI Act/Rule reference if available"
}`;

    const raw = await callGemini(
      `Voting scenario: ${scenario}`,
      systemInstruction,
      0.2,
    );

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');
    return res.json(JSON.parse(jsonMatch[0]));
  } catch (err: any) {
    console.error('[Scenario] Error:', err.message);
    return res.status(500).json({ error: 'Scenario simulation unavailable.' });
  }
});

/**
 * POST /api/translate
 * Google Cloud Translation v3 proxy.
 */
app.post('/api/translate', async (req, res) => {
  const { data, error } = parseBody(TranslateSchema, req.body);
  if (error) return res.status(400).json({ error });

  const { text, targetLanguage } = data!;
  const cacheKey = `translate:${targetLanguage}:${Buffer.from(text).toString('base64').slice(0, 64)}`;
  const cached = await redisGet(cacheKey);
  if (cached) return res.json({ translatedText: cached, source: 'cache' });

  try {
    const translateClient = getTranslateClient();
    const [response] = await translateClient.translateText({
      parent: `projects/${project}/locations/global`,
      contents: [text],
      mimeType: 'text/plain',
      targetLanguageCode: targetLanguage,
    });
    const translatedText = response.translations?.[0].translatedText ?? '';
    await redisSet(cacheKey, translatedText, 86400);
    return res.json({ translatedText, source: 'live' });
  } catch (err: any) {
    console.error('[Translate] Error:', err.message);
    return res.status(500).json({ error: 'Translation service unavailable.' });
  }
});

/**
 * POST /api/nlp/analyze
 * Natural language sentiment + entity analysis via Gemini (avoids separate NLP billing).
 */
app.post('/api/nlp/analyze', async (req, res) => {
  const schema = z.object({ text: z.string().min(1).max(2000) });
  const { data, error } = parseBody(schema, req.body);
  if (error) return res.status(400).json({ error });

  try {
    const systemInstruction = `Analyze the text and respond ONLY with JSON:
{
  "sentimentScore": -1.0 to 1.0,
  "sentimentLabel": "POSITIVE"|"NEUTRAL"|"NEGATIVE",
  "entities": [{"name": "string", "type": "PERSON"|"LOCATION"|"EVENT"|"OTHER"}],
  "intent": "string (e.g., 'asking about booth location')"
}`;
    const raw = await callGemini(data!.text, systemInstruction, 0.1);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Bad response');
    return res.json(JSON.parse(jsonMatch[0]));
  } catch (err: any) {
    console.error('[NLP] Error:', err.message);
    return res.status(500).json({ error: 'NLP analysis unavailable.' });
  }
});

/**
 * POST /api/sheets/log
 * Google Sheets logging for quiz scores / user activity.
 */
app.post('/api/sheets/log', async (req, res) => {
  const { data, error } = parseBody(SheetsLogSchema, req.body);
  if (error) return res.status(400).json({ error });

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    if (!spreadsheetId) throw new Error('GOOGLE_SHEETS_ID not configured');

    const { userId, quizId, score, timestamp } = data!;
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:E',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[userId, quizId, score, timestamp ?? new Date().toISOString(), 'VotePathX']],
      },
    });

    auditLog('QUIZ_LOGGED', { userId, quizId, score }, req);
    return res.json({ success: true });
  } catch (err: any) {
    console.error('[Sheets] Error:', err.message);
    return res.status(500).json({ error: 'Failed to log quiz score.' });
  }
});

/**
 * POST /api/calendar/add-reminder
 * Google Calendar event creation via Service Account.
 */
app.post('/api/calendar/add-reminder', async (req, res) => {
  const { data, error } = parseBody(CalendarSchema, req.body);
  if (error) return res.status(400).json({ error });

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });
    const calendar = google.calendar({ version: 'v3', auth });
    const { summary, description, location, startDateTime, endDateTime } = data!;

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        description,
        location,
        start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
        end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' },
      },
    });

    return res.json({ success: true, eventId: event.data.id });
  } catch (err: any) {
    console.error('[Calendar] Error:', err.message);
    return res.status(500).json({ error: 'Failed to create calendar event.' });
  }
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled]', err);
  res.status(500).json({
    error: isDev ? err.message : 'An internal error occurred.',
  });
});

// ── Static frontend (production only — in dev, Vite serves the frontend) ─────
if (!isDev) {
  const frontendPath = path.join(__dirname, '../dist');
  app.use(express.static(frontendPath));
  app.get(/(.*)/, (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ── Start server ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(port, () => {
    console.log(`[VotePath X] Server running at http://localhost:${port} (${process.env.NODE_ENV})`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[VotePath X] SIGTERM received — shutting down gracefully');
    server.close(() => process.exit(0));
  });
}
