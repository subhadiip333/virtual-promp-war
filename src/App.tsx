import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import EligibilityPage from './pages/EligibilityPage';
import VoterJourneyPage from './pages/VoterJourneyPage';
import AICoachPage from './pages/AICoachPage';
import BoothLocatorPage from './pages/BoothLocatorPage';
import QuizPage from './pages/QuizPage';
import ReminderPage from './pages/ReminderPage';
import { AccessibilityProvider } from './contexts/AccessibilityContext';

function App() {
  return (
    <AccessibilityProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AccessibilityProvider>
  );
}

export default App;
