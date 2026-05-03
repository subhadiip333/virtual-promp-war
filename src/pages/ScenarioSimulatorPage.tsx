/**
 * ScenarioSimulatorPage.tsx
 * "What-if" voting scenario simulator powered by ECI legal AI.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Lightbulb, BookOpen, Loader2, Scale } from 'lucide-react';
import { fetchFromBackend } from '../services/apiClient';

interface ScenarioResult {
  situation: string;
  eciRule: string;
  outcome: string;
  advice: string;
  reference: string;
}

const EXAMPLE_SCENARIOS = [
  'I moved to a new city 2 months before the election. Can I still vote at my old address?',
  'My name on the voter ID is slightly misspelled. Will I be allowed to vote?',
  'I am a senior citizen and cannot walk to the polling booth. What are my options?',
  'I accidentally spoiled my ballot paper in the booth. What should I do?',
  'I am a government employee posted to another state. How can I vote?',
  'My EPIC card is damaged and unreadable. Can I still vote?',
];

export default function ScenarioSimulatorPage() {
  const [scenario, setScenario] = useState('');
  const [result, setResult]     = useState<ScenarioResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSimulate = async (text = scenario) => {
    if (!text.trim()) return;
    setScenario(text);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchFromBackend<ScenarioResult>('/api/scenario/simulate', {
        method: 'POST',
        body: JSON.stringify({ scenario: text }),
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Simulation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 rounded-full mb-2">
          <FlaskConical className="w-8 h-8 text-violet-600" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Voting Scenario Simulator</h1>
        <p className="text-gray-600">
          Describe a "what-if" voting situation and get an instant ECI-backed legal ruling.
        </p>
      </motion.div>

      {/* Input */}
      <div className="glass-panel p-6 space-y-4">
        <label htmlFor="scenario-input" className="block text-sm font-semibold text-gray-700">
          Describe your voting scenario
        </label>
        <textarea
          id="scenario-input"
          value={scenario}
          onChange={e => setScenario(e.target.value)}
          rows={4}
          placeholder="e.g. 'I recently got married and my name has changed. My voter ID still has my old name. Can I vote?'"
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm"
          aria-label="Voting scenario to simulate"
          maxLength={1000}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">{scenario.length}/1000</span>
          <button
            onClick={() => handleSimulate()}
            disabled={!scenario.trim() || loading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
            {loading ? 'Simulating…' : 'Simulate Scenario'}
          </button>
        </div>
      </div>

      {/* Example scenarios */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <Lightbulb className="w-3 h-3" /> Try a common scenario
        </p>
        <div className="space-y-2">
          {EXAMPLE_SCENARIOS.map(ex => (
            <button
              key={ex}
              onClick={() => handleSimulate(ex)}
              className="w-full text-left text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg border border-gray-200 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
            role="region"
            aria-label="Scenario simulation result"
          >
            {/* Situation */}
            <div className="glass-panel p-5 border-l-4 border-violet-500">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your Situation</p>
              <p className="text-sm text-gray-800">{result.situation}</p>
            </div>

            {/* ECI Rule */}
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-blue-700">
                <BookOpen className="w-5 h-5" aria-hidden="true" />
                <p className="text-sm font-semibold">Applicable ECI Rule</p>
              </div>
              <p className="text-sm text-blue-800">{result.eciRule}</p>
              {result.reference && (
                <p className="text-xs text-blue-600 font-medium">📌 {result.reference}</p>
              )}
            </div>

            {/* Outcome & Advice */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 bg-green-50 border border-green-200 rounded-2xl">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">What Happens</p>
                <p className="text-sm text-green-800">{result.outcome}</p>
              </div>
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Recommended Action</p>
                <p className="text-sm text-amber-800">{result.advice}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
