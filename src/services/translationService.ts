import { fetchFromBackend } from './apiClient';

export interface TranslationResponse {
  translatedText: string;
}

/**
 * Service to interface with Cloud Translation API v3 via a backend proxy.
 * Designed to support all 22 scheduled Indian languages.
 */
export const translationService = {
  /**
   * Translates a given string of text to the target language.
   * @param text The text to translate.
   * @param targetLanguage The ISO-639-1 or BCP-47 language code (e.g., 'hi' for Hindi, 'bn' for Bengali, 'ta' for Tamil).
   * @returns A promise that resolves to the translated string.
   */
  async translateText(text: string, targetLanguage: string): Promise<string> {
    if (!text.trim()) {
      return text;
    }

    try {
      const response = await fetchFromBackend<TranslationResponse>('/api/translate', {
        method: 'POST',
        body: JSON.stringify({ text, targetLanguage }),
      });
      return response.translatedText;
    } catch (error) {
      console.error(`translationService.translateText failed for target ${targetLanguage}:`, error);
      // Fallback to original text if translation fails gracefully
      return text; 
    }
  }
};
