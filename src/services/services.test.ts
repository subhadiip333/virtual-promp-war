import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geminiService } from './geminiService';
import { embeddingsService } from './embeddingsService';
import { translationService } from './translationService';
import { mapsService } from './mapsService';
import { calendarService } from './calendarService';
import { nlpService } from './nlpService';
import { sheetsService } from './sheetsService';
import * as apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  fetchFromBackend: vi.fn(),
}));

describe('Services Test Suite', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Parameterized Test for Gemini Service
  describe('geminiService', () => {
    const prompts = Array.from({ length: 30 }, (_, i) => `Test Prompt ${i}`);
    
    it.each(prompts)('should send prompt: %s to the coach', async (prompt) => {
      vi.mocked(apiClient.fetchFromBackend).mockResolvedValue({ reply: `Response to ${prompt}` });
      const result = await geminiService.askElectionCoach(prompt);
      expect(result.reply).toBe(`Response to ${prompt}`);
      expect(apiClient.fetchFromBackend).toHaveBeenCalledWith('/api/gemini/coach', expect.any(Object));
    });

    it('should throw error on empty prompt', async () => {
      await expect(geminiService.askElectionCoach('   ')).rejects.toThrow();
    });
  });

  // Parameterized Test for Embeddings
  describe('embeddingsService', () => {
    const texts = Array.from({ length: 30 }, (_, i) => `Embed this text ${i}`);
    
    it.each(texts)('should return vector for: %s', async (text) => {
      vi.mocked(apiClient.fetchFromBackend).mockResolvedValue({ vector: [0.1, 0.2] });
      const result = await embeddingsService.getEmbeddings(text);
      expect(result).toEqual([0.1, 0.2]);
    });
  });

  // Parameterized Test for Translation
  describe('translationService', () => {
    const langs = ["hi", "bn", "te", "mr", "ta", "ur", "gu", "kn", "or", "ml", "pa", "as", "mai", "sat", "ks", "ne", "sd", "doi", "kok", "mni"];
    
    it.each(langs)('should translate to %s gracefully', async (lang) => {
      vi.mocked(apiClient.fetchFromBackend).mockResolvedValue({ translatedText: `Translated to ${lang}` });
      const result = await translationService.translateText("Hello", lang);
      expect(result).toBe(`Translated to ${lang}`);
    });
  });

  // Maps Service
  describe('mapsService', () => {
    const coords = Array.from({ length: 20 }, (_, i) => ({ lat: 20 + i, lng: 70 + i }));
    
    it.each(coords)('should handle mock fallback for coords: %s', async (coord) => {
      // mapsService returns mock data if init() not called, simulating fallback
      const result = await mapsService.findPollingBooths(coord);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBeDefined();
    });
  });

  // Calendar Service
  describe('calendarService', () => {
    const events = Array.from({ length: 20 }, (_, i) => ({
      summary: `Event ${i}`,
      description: 'Desc',
      location: 'Loc',
      startDateTime: '2026-05-01T10:00:00Z',
      endDateTime: '2026-05-01T11:00:00Z'
    }));

    it.each(events)('should add event: %s', async (evt) => {
      vi.mocked(apiClient.fetchFromBackend).mockResolvedValue({ success: true, eventId: `evt-${evt.summary}` });
      const result = await calendarService.addElectionReminder(evt);
      expect(result.success).toBe(true);
      expect(result.eventId).toBe(`evt-${evt.summary}`);
    });
  });

  // NLP Service
  describe('nlpService', () => {
    const queries = Array.from({ length: 20 }, (_, i) => `Query ${i}`);
    
    it.each(queries)('should analyze query: %s', async (q) => {
      vi.mocked(apiClient.fetchFromBackend).mockResolvedValue({ sentimentScore: 0.9, entities: [] });
      const result = await nlpService.analyzeQuery(q);
      expect(result.sentimentScore).toBe(0.9);
    });

    it('should handle empty query', async () => {
      const result = await nlpService.analyzeQuery('   ');
      expect(result.sentimentScore).toBe(0);
      expect(apiClient.fetchFromBackend).not.toHaveBeenCalled();
    });
  });

  // Sheets Service
  describe('sheetsService', () => {
    const scores = Array.from({ length: 30 }, (_, i) => i);
    
    it.each(scores)('should log score: %s', async (score) => {
      vi.mocked(apiClient.fetchFromBackend).mockResolvedValue({ success: true });
      const result = await sheetsService.logQuizScore('user1', 'quiz1', score);
      expect(result.success).toBe(true);
    });
  });
});
