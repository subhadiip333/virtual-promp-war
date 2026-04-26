import { fetchFromBackend } from './apiClient';

export interface CoachResponse {
  reply: string;
}

/**
 * Service to interact with Gemini 1.5 Flash (via our backend).
 * Acts as an Election Coach AI.
 */
export const geminiService = {
  /**
   * Sends a prompt to the Election Coach and retrieves a response.
   * @param prompt The question or prompt from the user.
   * @returns A promise that resolves to the CoachResponse.
   */
  async askElectionCoach(prompt: string): Promise<CoachResponse> {
    if (!prompt.trim()) {
      throw new Error("Prompt cannot be empty");
    }

    try {
      const response = await fetchFromBackend<CoachResponse>('/api/gemini/coach', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      return response;
    } catch (error) {
      console.error("geminiService.askElectionCoach failed:", error);
      throw new Error("Failed to communicate with the Election Coach. Please try again later.");
    }
  }
};
