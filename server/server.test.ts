import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from './index';

// Mock Google Cloud Clients
vi.mock('@google-cloud/vertexai', () => ({
  VertexAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          candidates: [{ content: { parts: [{ text: 'Mocked Gemini Response' }] } }],
        },
      }),
    }),
  })),
}));

vi.mock('@google-cloud/translate', () => ({
  TranslationServiceClient: vi.fn().mockImplementation(() => ({
    translateText: vi.fn().mockResolvedValue([{ translations: [{ translatedText: 'Mocked Translation' }] }]),
  })),
}));

vi.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: vi.fn().mockImplementation(() => ({
        getClient: vi.fn(),
      })),
    },
    sheets: vi.fn().mockReturnValue({
      spreadsheets: {
        values: {
          append: vi.fn().mockResolvedValue({ status: 200 }),
        },
      },
    }),
  },
}));

describe('Backend API Endpoints', () => {
  it('POST /api/gemini/coach - should return AI response', async () => {
    const res = await request(app)
      .post('/api/gemini/coach')
      .send({ prompt: 'How to vote?' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Mocked Gemini Response');
  });

  it('POST /api/translate - should return translated text', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: 'Hello', targetLanguage: 'hi' });

    expect(res.status).toBe(200);
    expect(res.body.translatedText).toBe('Mocked Translation');
  });

  it('POST /api/sheets/log - should return success', async () => {
    process.env.GOOGLE_SHEETS_ID = 'test-id';
    const res = await request(app)
      .post('/api/sheets/log')
      .send({ userId: 'user123', quizId: 'quiz1', score: 10 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/gemini/coach - should return 400 for empty prompt', async () => {
    const res = await request(app)
      .post('/api/gemini/coach')
      .send({ prompt: '' });

    expect(res.status).toBe(400);
  });
});
