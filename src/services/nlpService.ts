import { fetchFromBackend } from './apiClient';

export interface Entity {
  name: string;
  type: 'PERSON' | 'LOCATION' | 'ORGANIZATION' | 'EVENT' | 'WORK_OF_ART' | 'CONSUMER_GOOD' | 'OTHER' | 'PHONE_NUMBER' | 'ADDRESS' | 'DATE' | 'NUMBER' | 'PRICE';
}

export interface NlpResponse {
  sentimentScore: number;
  entities: Entity[];
}

/**
 * Service to interface with Cloud Natural Language API via backend.
 * Used for query analytics to understand user sentiment and extract key entities.
 */
export const nlpService = {
  /**
   * Analyzes a text query to extract sentiment and entities.
   * @param text The user query to analyze.
   * @returns A promise resolving to the NlpResponse.
   */
  async analyzeQuery(text: string): Promise<NlpResponse> {
    if (!text.trim()) {
      return { sentimentScore: 0, entities: [] };
    }

    try {
      const response = await fetchFromBackend<NlpResponse>('/api/nlp/analyze', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      return response;
    } catch (error) {
      console.error("nlpService.analyzeQuery failed:", error);
      // Fail gracefully so it doesn't break the main flow if analytics fail
      return { sentimentScore: 0, entities: [] };
    }
  }
};
