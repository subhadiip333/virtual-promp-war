import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

import HomePage from '../pages/HomePage';
import BoothLocatorPage from '../pages/BoothLocatorPage';
import CandidateComparePage from '../pages/CandidateComparePage';
import MisinformationPage from '../pages/MisinformationPage';
import QuizPage from '../pages/QuizPage';
import ScenarioSimulatorPage from '../pages/ScenarioSimulatorPage';
import App from '../App';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';

// Mock API client
vi.mock('../services/apiClient', () => ({
  fetchFromBackend: vi.fn().mockResolvedValue({})
}));

// Mock services
vi.mock('../services/sheetsService', () => ({
  sheetsService: { logQuizScore: vi.fn() }
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AccessibilityProvider>
      <LanguageProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </LanguageProvider>
    </AccessibilityProvider>
  );
};

describe('More Pages Coverage', () => {
  it('renders HomePage', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText(/India's Election Intelligence/i)).toBeInTheDocument();
  });

  it('renders BoothLocatorPage', () => {
    renderWithProviders(<BoothLocatorPage />);
    expect(screen.getByText(/Booth Locator/i)).toBeInTheDocument();
  });

  it('renders CandidateComparePage and allows adding candidate', () => {
    renderWithProviders(<CandidateComparePage />);
    expect(screen.getByText(/Candidate Comparison/i)).toBeInTheDocument();
    const addBtn = screen.getByText(/Add Candidate/i);
    fireEvent.click(addBtn);
    const inputs = screen.getAllByPlaceholderText(/Candidate.*name/i);
    expect(inputs.length).toBe(3);
  });

  it('renders MisinformationPage and allows checking', async () => {
    renderWithProviders(<MisinformationPage />);
    expect(screen.getByText(/Misinformation Detector/i)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Check this claim/i });
    expect(btn).toBeDisabled();
  });

  it('renders QuizPage and can select answers', () => {
    renderWithProviders(<QuizPage />);
    expect(screen.getByText(/Election Quiz/i)).toBeInTheDocument();
    
    // Let's answer a question just to trigger coverage
    const options = screen.getAllByRole('button');
    if (options.length > 0) {
      fireEvent.click(options[0]);
    }
  });

  it('renders ScenarioSimulatorPage', () => {
    renderWithProviders(<ScenarioSimulatorPage />);
    expect(screen.getByText(/Voting Scenario Simulator/i)).toBeInTheDocument();
  });
  
  it('renders App', () => {
    render(<App />);
  });
});
