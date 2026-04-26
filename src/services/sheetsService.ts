import { fetchFromBackend } from './apiClient';

export interface LogScoreResponse {
  success: boolean;
  rowUpdated?: number;
  error?: string;
}

/**
 * Service to interface with Google Sheets API via backend proxy.
 * Used for logging quiz scores and related analytics.
 */
export const sheetsService = {
  /**
   * Logs a user's quiz score to a secure Google Sheet.
   * @param userId The ID or email of the user taking the quiz.
   * @param quizId The identifier for the specific quiz.
   * @param score The score achieved by the user.
   * @returns A promise resolving to the LogScoreResponse.
   */
  async logQuizScore(userId: string, quizId: string, score: number): Promise<LogScoreResponse> {
    try {
      const response = await fetchFromBackend<LogScoreResponse>('/api/sheets/log', {
        method: 'POST',
        body: JSON.stringify({ userId, quizId, score, timestamp: new Date().toISOString() }),
      });
      return response;
    } catch (error) {
      console.error("sheetsService.logQuizScore failed:", error);
      throw new Error("Failed to log score to the analytics sheet.");
    }
  }
};
