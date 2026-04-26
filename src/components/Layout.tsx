import { Link, Outlet, useLocation } from 'react-router-dom';
import { Vote, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Eligibility', path: '/eligibility' },
    { name: 'Journey', path: '/journey' },
    { name: 'AI Coach', path: '/coach' },
    { name: 'Booths', path: '/booths' },
    { name: 'Quiz', path: '/quiz' },
    { name: 'Reminders', path: '/reminders' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <Vote className="h-8 w-8 text-primary-600" />
                <span className="font-bold text-xl tracking-tight text-brand-dark">MataData</span>
              </Link>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                    location.pathname === link.path ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-600'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === link.path ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 mt-auto py-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} MataData - India's Election Intelligence Platform.</p>
      </footer>
    </div>
  );
}
