import { fetchFromBackend } from './apiClient';

export interface ElectionEvent {
  summary: string;
  description: string;
  location: string;
  startDateTime: string; // ISO 8601 string
  endDateTime: string; // ISO 8601 string
}

export interface CalendarResponse {
  success: boolean;
  eventId?: string;
  error?: string;
}

/**
 * Service to interface with Google Calendar API via our backend.
 * Allows adding election reminders to the user's calendar.
 */
export const calendarService = {
  /**
   * Adds a reminder for the election day to the user's calendar.
   * @param eventDetails Details of the election event.
   * @returns A promise resolving to the CalendarResponse.
   */
  async addElectionReminder(eventDetails: ElectionEvent): Promise<CalendarResponse> {
    try {
      const response = await fetchFromBackend<CalendarResponse>('/api/calendar/add-reminder', {
        method: 'POST',
        body: JSON.stringify(eventDetails),
      });
      return response;
    } catch (error) {
      console.error("calendarService.addElectionReminder failed:", error);
      throw new Error("Failed to add reminder to calendar. Please check your connection.");
    }
  }
};
