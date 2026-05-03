/**
 * MisinformationPage.tsx
 * AI-powered election misinformation fact-checker.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Search, CheckCircle, XCircle, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { fetchFromBackend } from '../services/apiClient';

interface MisinfoResult {
  verdict: 'TRUE' | 'FALSE' | 'MISLEADING' | 'UNVERIFIABLE';
  confidence: number;
  explanation: string;
  sources: string[];
}

const verdictConfig = {
  TRUE:         { color: 'text-green-700 bg-green-50 border-green-200',  icon: CheckCircle,    label: '✅ Verified True'    },
  FALSE:        { color: 'text-red-700 bg-red-50 border-red-200',        icon: XCircle,        label: '❌ False Claim'      },
  MISLEADING:   { color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: AlertTriangle, label: '⚠️ Misleading'      },
  UNVERIFIABLE: { color: 'text-gray-700 bg-gray-50 border-gray-200',    icon: HelpCircle,     label: '❓ Cannot Verify'   },
};

const exampleClaims = [
  'You need to show Aadhaar card to vote.',
  'You can vote at any booth in your city.',
  'Postal ballot votes are not counted.',
  'First-time voters need extra documentation.',
];

export default function MisinformationPage() {
  const [claim, setClaim]     = useState('');
  const [result, setResult]   = useState<MisinfoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleCheck = async (text = claim) => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setClaim(text);
    try {
      const data = await fetchFromBackend<MisinfoResult>('/api/misinfo/check', {
        method: 'POST',
        body: JSON.stringify({ claim: text }),
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? 'Fact-checking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const config = result ? verdictConfig[result.verdict] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-2">
          <ShieldAlert className="w-8 h-8 text-orange-600" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Misinformation Detector</h1>
        <p className="text-gray-600">
          Paste any election claim and our AI — backed by ECI guidelines — will fact-check it instantly.
        </p>
      </motion.div>

      {/* Input */}
      <div className="glass-panel p-6 space-y-4">
        <label htmlFor="claim-input" className="block text-sm font-semibold text-gray-700">
          Enter a claim or statement to fact-check
        </label>
        <textarea
          id="claim-input"
          value={claim}
          onChange={e => setClaim(e.target.value)}
          rows={3}
          placeholder="e.g. 'You need an Aadhaar card to vote in India.'"
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm"
          aria-label="Election claim to fact-check"
          maxLength={2000}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">{claim.length}/2000</span>
          <button
            onClick={() => handleCheck()}
            disabled={!claim.trim() || loading}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
            aria-label="Check this claim"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Checking…' : 'Fact-Check'}
          </button>
        </div>
      </div>

      {/* Example claims */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {exampleClaims.map(ex => (
            <button
              key={ex}
              onClick={() => handleCheck(ex)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && config && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-6 rounded-2xl border-2 space-y-4 ${config.color}`}
            role="region"
            aria-label="Fact-check result"
          >
            <div className="flex items-center gap-3">
              <config.icon className="w-7 h-7" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Verdict</p>
                <p className="text-2xl font-extrabold">{config.label}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs opacity-70">Confidence</p>
                <p className="text-xl font-bold">{Math.round(result.confidence * 100)}%</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Explanation</p>
              <p className="text-sm leading-relaxed">{result.explanation}</p>
            </div>

            {result.sources.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Sources</p>
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  {result.sources.map(s => <li key={s}>{s}</li>)}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
