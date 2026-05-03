import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock Canvas (Required for Chart.js)
HTMLCanvasElement.prototype.getContext = () => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  closePath: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  setTransform: vi.fn(),
  transform: vi.fn(),
  resetTransform: vi.fn(),
} as any);

// Mock react-confetti
vi.mock('react-confetti', () => ({
  default: () => null,
}));

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

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, initial, animate, exit, transition, ...props }: any) =>
      React.createElement('div', props, children),
    span: ({ children, whileHover, initial, animate, exit, transition, ...props }: any) =>
      React.createElement('span', props, children),
    p: ({ children, whileHover, initial, animate, exit, transition, ...props }: any) =>
      React.createElement('p', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
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
