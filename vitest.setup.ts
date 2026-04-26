import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Canvas (Required for Chart.js and Confetti)
HTMLCanvasElement.prototype.getContext = () => null as any;

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock framer-motion to avoid act() warnings
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div { ...props } > { children } </div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{ children } </>,
}));

// Mock SpeechRecognition
class MockSpeechRecognition {
  start = vi.fn();
  stop = vi.fn();
}
// @ts-ignore
window.SpeechRecognition = MockSpeechRecognition;
// @ts-ignore
window.webkitSpeechRecognition = MockSpeechRecognition;

// Mock speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: () => [],
  },
});

// Mock SpeechSynthesisUtterance
// @ts-ignore
window.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({ text }));

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn().mockImplementation((success) =>
    Promise.resolve(success({
      coords: {
        latitude: 28.6139,
        longitude: 77.2090
      }
    }))
  ),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;
