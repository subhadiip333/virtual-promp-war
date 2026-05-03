/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  fontSize: 'normal' | 'large' | 'x-large';
  setFontSize: (v: 'normal' | 'large' | 'x-large') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useState(() => {
    const saved = localStorage.getItem('a11y-contrast');
    return saved === 'true';
  });

  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'x-large'>(() => {
    const saved = localStorage.getItem('a11y-fontsize');
    return (saved as 'normal' | 'large' | 'x-large') || 'normal';
  });

  useEffect(() => {
    localStorage.setItem('a11y-contrast', String(highContrast));
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('a11y-fontsize', fontSize);
    document.body.classList.remove('text-normal', 'text-large', 'text-x-large');
    document.body.classList.add(`text-${fontSize}`);
  }, [fontSize]);

  return (
    <AccessibilityContext.Provider value={{ highContrast, setHighContrast, fontSize, setFontSize }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
