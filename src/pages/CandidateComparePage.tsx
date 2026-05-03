/**
 * CandidateComparePage.tsx
 * AI-powered candidate comparison tool using real backend.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Trash2, Search, Loader2, Briefcase, FileText } from 'lucide-react';
import { fetchFromBackend } from '../services/apiClient';

interface CandidateProfile {
  name: string;
  party: string;
  keyPolicies: string[];
  backgroundSummary: string;
  priorExperience: string;
}

interface CompareResult {
  candidates: CandidateProfile[];
  comparisonNote: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

const partyColors: Record<string, string> = {
  'BJP':  'bg-orange-100 text-orange-800',
  'INC':  'bg-blue-100 text-blue-800',
  'AAP':  'bg-sky-100 text-sky-800',
  'SP':   'bg-red-100 text-red-800',
  'TMC':  'bg-green-100 text-green-800',
};

function getPartyColor(party: string) {
  for (const [abbr, cls] of Object.entries(partyColors)) {
    if (party.toUpperCase().includes(abbr)) return cls;
  }
  return 'bg-purple-100 text-purple-800';
}

export default function CandidateComparePage() {
  const [candidates, setCandidates] = useState<string[]>(['', '']);
  const [state, setState]           = useState('');
  const [result, setResult]         = useState<CompareResult | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const addCandidate = () => {
    if (candidates.length < 4) setCandidates(prev => [...prev, '']);
  };

  const removeCandidate = (i: number) => {
    setCandidates(prev => prev.filter((_, idx) => idx !== i));
    setResult(null);
  };

  const updateCandidate = (i: number, val: string) => {
    setCandidates(prev => prev.map((c, idx) => idx === i ? val : c));
  };

  const handleCompare = async () => {
    const valid = candidates.filter(c => c.trim());
    if (valid.length < 2 || !state) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchFromBackend<CompareResult>('/api/candidates/compare', {
        method: 'POST',
        body: JSON.stringify({ candidates: valid, state }),
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Comparison failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canCompare = candidates.filter(c => c.trim()).length >= 2 && !!state;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-2">
          <Users className="w-8 h-8 text-indigo-600" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Candidate Comparison</h1>
        <p className="text-gray-600">Enter up to 4 candidate names and let AI generate an unbiased comparison.</p>
      </motion.div>

      {/* Input Form */}
      <div className="glass-panel p-6 space-y-5">
        {/* State selector */}
        <div>
          <label htmlFor="state-select" className="block text-sm font-semibold text-gray-700 mb-1">
            Select State / UT
          </label>
          <select
            id="state-select"
            value={state}
            onChange={e => setState(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
            aria-label="State or Union Territory"
          >
            <option value="">— Choose a state —</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Candidate inputs */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Candidate Names (2–4)</p>
          {candidates.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={c}
                onChange={e => updateCandidate(i, e.target.value)}
                placeholder={`Candidate ${i + 1} name`}
                className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                aria-label={`Candidate ${i + 1} name`}
                maxLength={128}
              />
              {candidates.length > 2 && (
                <button
                  onClick={() => removeCandidate(i)}
                  className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  aria-label={`Remove candidate ${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {candidates.length < 4 && (
            <button
              onClick={addCandidate}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800 font-medium"
              aria-label="Add another candidate"
            >
              <Plus className="w-4 h-4" /> Add Candidate
            </button>
          )}
          <button
            onClick={handleCompare}
            disabled={!canCompare || loading}
            className="ml-auto flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Comparing…' : 'Compare Candidates'}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {result.candidates.map((cand, i) => (
                <motion.div
                  key={cand.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-panel p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{cand.name}</h2>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getPartyColor(cand.party)}`}>
                        {cand.party}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> Experience
                    </p>
                    <p className="text-sm text-gray-700">{cand.priorExperience}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Key Policies
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                      {cand.keyPolicies.map(p => <li key={p}>{p}</li>)}
                    </ul>
                  </div>

                  <p className="text-sm text-gray-600 italic border-t pt-2">{cand.backgroundSummary}</p>
                </motion.div>
              ))}
            </div>

            {result.comparisonNote && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <span className="font-semibold">Note: </span>{result.comparisonNote}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
