import { Link, Outlet, useLocation } from 'react-router-dom';
import { Vote, Menu, X, SunMoon, Type } from 'lucide-react';
import { useState } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { highContrast, setHighContrast, fontSize, setFontSize } = useAccessibility();

  const navLinks = [
    { name: 'Home',       path: '/'          },
    { name: 'Eligibility', path: '/eligibility'},
    { name: 'Journey',    path: '/journey'   },
    { name: 'AI Coach',   path: '/coach'     },
    { name: 'Booths',     path: '/booths'    },
    { name: 'Quiz',       path: '/quiz'      },
    { name: 'Reminders',  path: '/reminders' },
    // New enterprise pages
    { name: 'Fact-Check', path: '/misinfo'   },
    { name: 'Compare',    path: '/compare'   },
    { name: 'Simulator',  path: '/simulator' },
  ];

  const toggleFontSize = () => {
    if (fontSize === 'normal') setFontSize('large');
    else if (fontSize === 'large') setFontSize('x-large');
    else setFontSize('normal');
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Skip-to-content for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white p-4 z-[100] rounded-lg shadow-xl font-bold"
      >
        Skip to Content
      </a>

      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Brand */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2" aria-label="VotePath X Home">
                <Vote className="h-8 w-8 text-primary-600" aria-hidden="true" />
                <span className="font-bold text-xl tracking-tight text-brand-dark">VotePath X</span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex space-x-4 items-center" aria-label="Main Navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={location.pathname === link.path ? 'page' : undefined}
                  className={`text-xs font-medium transition-colors hover:text-primary-600 whitespace-nowrap ${
                    location.pathname === link.path
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="h-6 w-px bg-gray-300 mx-1" aria-hidden="true" />

              <button
                onClick={() => setHighContrast(!highContrast)}
                className="p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={highContrast ? 'Disable High Contrast' : 'Enable High Contrast'}
                title="Toggle High Contrast"
              >
                <SunMoon className="w-5 h-5" aria-hidden="true" />
              </button>

              <button
                onClick={toggleFontSize}
                className="p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={`Change Font Size (Current: ${fontSize})`}
                title="Toggle Font Size"
              >
                <Type className="w-5 h-5" aria-hidden="true" />
              </button>
            </nav>

            {/* Mobile controls */}
            <div className="flex items-center lg:hidden gap-2">
              <button
                onClick={() => setHighContrast(!highContrast)}
                className="p-2 text-gray-600"
                aria-label="Toggle High Contrast"
              >
                <SunMoon className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
                aria-expanded={isMenuOpen}
                aria-label="Main menu"
              >
                {isMenuOpen
                  ? <X className="h-6 w-6" aria-hidden="true" />
                  : <Menu className="h-6 w-6" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200">
            <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3" aria-label="Mobile Navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={location.pathname === link.path ? 'page' : undefined}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === link.path
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <button
                onClick={toggleFontSize}
                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md font-medium"
              >
                Font Size: {fontSize}
              </button>
            </nav>
          </div>
        )}
      </header>

      <main
        id="main-content"
        className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full outline-none"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 mt-auto py-6 text-center space-y-1">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} VotePath X — India's Next-Gen AI Civic Intelligence Platform
        </p>
        <p className="text-xs text-gray-400">
          Powered by Gemini 2.5 Flash · Google Cloud · ECI-compliant
        </p>
      </footer>
    </div>
  );
}
