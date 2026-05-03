import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import EligibilityPage from '../pages/EligibilityPage';
import ReminderPage from '../pages/ReminderPage';
import VoterJourneyPage from '../pages/VoterJourneyPage';

vi.mock('../services/calendarService', () => ({
  calendarService: {
    addElectionReminder: vi.fn().mockResolvedValue(true)
  }
}));

// Wrapper for router dependencies
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Page Component Tests', () => {

  describe('EligibilityPage', () => {
    it('should render initial state', () => {
      renderWithRouter(<EligibilityPage />);
      expect(screen.getByText('Am I Eligible?')).toBeInTheDocument();
      expect(screen.getByText('1. How old are you?')).toBeInTheDocument();
    });

    const ageInputs = [16, 17, 18, 19, 25, 50, 100];
    it.each(ageInputs)('should handle age input %s and allow next', async (age) => {
      renderWithRouter(<EligibilityPage />);
      const input = screen.getByPlaceholderText('Enter your age');
      const nextBtn = screen.getByText('Next →');

      expect(nextBtn).toBeDisabled();
      fireEvent.change(input, { target: { value: age.toString() } });
      expect(nextBtn).not.toBeDisabled();
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByText('2. Are you an Indian citizen?')).toBeInTheDocument();
      });
    });

    it('should calculate failure if age < 18', async () => {
      renderWithRouter(<EligibilityPage />);

      fireEvent.change(screen.getByPlaceholderText('Enter your age'), { target: { value: '17' } });
      fireEvent.click(screen.getByText('Next →'));

      await waitFor(() => screen.getByText('2. Are you an Indian citizen?'));
      fireEvent.click(screen.getByRole('button', { name: /yes/i }));

      await waitFor(() => screen.getByText('3. Are you an ordinary resident of your polling area?'));
      fireEvent.click(screen.getByRole('button', { name: /yes/i }));

      await waitFor(() => {
        expect(screen.getByText('Not Eligible Yet')).toBeInTheDocument();
      });
    });

    it('should calculate success if all criteria met', async () => {
      renderWithRouter(<EligibilityPage />);

      const ageInput = screen.getByPlaceholderText('Enter your age');
      fireEvent.change(ageInput, { target: { value: '25' } });
      fireEvent.click(screen.getByText('Next →'));

      await waitFor(() => screen.getByText('2. Are you an Indian citizen?'));
      fireEvent.click(screen.getByRole('button', { name: /yes/i }));

      await waitFor(() => screen.getByText('3. Are you an ordinary resident of your polling area?'));
      fireEvent.click(screen.getByRole('button', { name: /yes/i }));

      await waitFor(() => {
        expect(screen.getByText(/You are eligible!/i)).toBeInTheDocument();
      });
    });
  });

  describe('VoterJourneyPage Integration', () => {
    it('should start at step 1 and allow unlocking', () => {
      localStorage.clear();
      renderWithRouter(<VoterJourneyPage />);

      expect(screen.getByText('Step 1: Registration')).toBeInTheDocument();

      const completeBtns = screen.getAllByText('Complete');
      expect(completeBtns.length).toBe(1); // Only one active step

      fireEvent.click(completeBtns[0]);

      expect(localStorage.getItem('voterJourneyProgress')).toBe('2');
    });

    const journeySteps = [1, 2, 3, 4, 5, 6, 7];
    it.each(journeySteps)('should render step %s correctly based on local storage', (step) => {
      localStorage.setItem('voterJourneyProgress', step.toString());
      renderWithRouter(<VoterJourneyPage />);
      expect(screen.getByText(new RegExp(`Step ${step}:`))).toBeInTheDocument();
    });
  });

  describe('ReminderPage Location & Countdown', () => {
    it('should render the countdown', () => {
      renderWithRouter(<ReminderPage />);
      expect(screen.getByText('Election Countdown')).toBeInTheDocument();
      expect(screen.getByText('days')).toBeInTheDocument();
    });

    it('should handle calendar addition', async () => {
      renderWithRouter(<ReminderPage />);
      const btn = screen.getByRole('button', { name: /add reminder/i });
      fireEvent.click(btn);
      // Wait for mock
      await waitFor(() => {
        expect(screen.getByText('Added')).toBeInTheDocument();
      });
    });
  });
});
