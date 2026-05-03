import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AccessibilityProvider } from './contexts/AccessibilityContext';

// ── Lazy-loaded pages (code splitting) ───────────────────────────────────────
const HomePage             = lazy(() => import('./pages/HomePage'));
const EligibilityPage      = lazy(() => import('./pages/EligibilityPage'));
const VoterJourneyPage     = lazy(() => import('./pages/VoterJourneyPage'));
const AICoachPage          = lazy(() => import('./pages/AICoachPage'));
const BoothLocatorPage     = lazy(() => import('./pages/BoothLocatorPage'));
const QuizPage             = lazy(() => import('./pages/QuizPage'));
const ReminderPage         = lazy(() => import('./pages/ReminderPage'));
// ── NEW pages ────────────────────────────────────────────────────────────────
const MisinformationPage   = lazy(() => import('./pages/MisinformationPage'));
const CandidateComparePage = lazy(() => import('./pages/CandidateComparePage'));
const ScenarioSimulatorPage = lazy(() => import('./pages/ScenarioSimulatorPage'));

// ── Loading skeleton ──────────────────────────────────────────────────────────
const LoadingFallback = () => (
  <div className="flex flex-col justify-center items-center h-[50vh] gap-3" role="status" aria-label="Loading page">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600" />
    <p className="text-sm text-gray-500 animate-pulse">Loading…</p>
  </div>
);

// ── Error boundary fallback ───────────────────────────────────────────────────
function App() {
  return (
    <AccessibilityProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index               element={<HomePage />}             />
              <Route path="eligibility"  element={<EligibilityPage />}      />
              <Route path="journey"      element={<VoterJourneyPage />}     />
              <Route path="coach"        element={<AICoachPage />}          />
              <Route path="booths"       element={<BoothLocatorPage />}     />
              <Route path="quiz"         element={<QuizPage />}             />
              <Route path="reminders"    element={<ReminderPage />}         />
              {/* New enterprise features */}
              <Route path="misinfo"      element={<MisinformationPage />}   />
              <Route path="compare"      element={<CandidateComparePage />} />
              <Route path="simulator"    element={<ScenarioSimulatorPage />}/>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AccessibilityProvider>
  );
}

export default App;
