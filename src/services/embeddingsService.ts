import { fetchFromBackend } from './apiClient';

export interface EmbeddingResponse {
  vector: number[];
}

/**
 * Service to generate text embeddings using Vertex AI (text-embedding-004)
 * Uses a backend proxy.
 */
export const embeddingsService = {
  /**
   * Generates embeddings for a given string of text.
   * Useful for Semantic FAQ search (RAG).
   * @param text The text to embed.
   * @returns A promise that resolves to the embedding vector.
   */
  async getEmbeddings(text: string): Promise<number[]> {
    if (!text.trim()) {
      throw new Error("Text for embedding cannot be empty");
    }

    try {
      const response = await fetchFromBackend<EmbeddingResponse>('/api/embeddings', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      return response.vector;
    } catch (error) {
      console.error("embeddingsService.getEmbeddings failed:", error);
      throw new Error("Failed to generate text embeddings.");
    }
  }
};
