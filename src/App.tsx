import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AccessibilityProvider } from './contexts/AccessibilityContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const EligibilityPage = lazy(() => import('./pages/EligibilityPage'));
const VoterJourneyPage = lazy(() => import('./pages/VoterJourneyPage'));
const AICoachPage = lazy(() => import('./pages/AICoachPage'));
const BoothLocatorPage = lazy(() => import('./pages/BoothLocatorPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const ReminderPage = lazy(() => import('./pages/ReminderPage'));

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

function App() {
  return (
    <AccessibilityProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="eligibility" element={<EligibilityPage />} />
              <Route path="journey" element={<VoterJourneyPage />} />
              <Route path="coach" element={<AICoachPage />} />
              <Route path="booths" element={<BoothLocatorPage />} />
              <Route path="quiz" element={<QuizPage />} />
              <Route path="reminders" element={<ReminderPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AccessibilityProvider>
  );
}

export default App;
