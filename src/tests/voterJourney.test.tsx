import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import VoterJourneyPage from '../pages/VoterJourneyPage';

describe('Voter Journey Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const steps = [
    { title: 'Step 1: Registration', progress: 1 },
    { title: 'Step 2: Verification', progress: 2 },
    { title: 'Step 3: Locate Booth', progress: 3 },
    { title: 'Step 4: Know Your Candidates', progress: 4 },
    { title: 'Step 5: Election Day Prep', progress: 5 },
    { title: 'Step 6: Cast Vote', progress: 6 },
    { title: 'Step 7: The Ink Mark', progress: 7 },
  ];

  it.each(steps)('should allow progressive unlocking up to %s', ({ progress }) => {
    render(
      <BrowserRouter>
        <VoterJourneyPage />
      </BrowserRouter>
    );

    for (let i = 1; i <= progress; i++) {
      const activeBtns = screen.getAllByText('Complete');
      expect(activeBtns.length).toBeGreaterThan(0);
      fireEvent.click(activeBtns[0]);
    }
    
    expect(localStorage.getItem('voterJourneyProgress')).toBe((progress + 1).toString());
  });
});
