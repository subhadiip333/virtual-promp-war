import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import AICoachPage from '../pages/AICoachPage';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';

describe('Accessibility & Layout Tests', () => {
  it('should have a skip to content link', () => {
    render(
      <AccessibilityProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </AccessibilityProvider>
    );
    const skipLink = screen.getByText('Skip to Content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  const a11yRoles = [
    { name: 'MataData Home', role: 'link' },
    { name: 'Main Navigation', role: 'navigation' }
  ];

  it.each(a11yRoles)('should have accessible role %s', (item) => {
    render(
      <AccessibilityProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </AccessibilityProvider>
    );
    expect(screen.getByRole(item.role, { name: item.name })).toBeInTheDocument();
  });

  it('should toggle high contrast mode', () => {
    render(
      <AccessibilityProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </AccessibilityProvider>
    );
    const hcBtns = screen.getAllByRole('button', { name: /High Contrast/i });
    const hcBtn = hcBtns[0];
    fireEvent.click(hcBtn);
    expect(document.body.classList.contains('high-contrast')).toBe(true);
  });

  it('AICoachPage should have proper aria-labels', () => {
    render(<AICoachPage />);
    expect(screen.getByLabelText('Select Assistant Language')).toBeInTheDocument();
    expect(screen.getByLabelText('Disable Text to Speech')).toBeInTheDocument();
    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });
});
