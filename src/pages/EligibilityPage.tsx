import { useState } from 'react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function EligibilityPage() {
  const [step, setStep] = useState(1);
  const [isPassed, setIsPassed] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    age: '',
    citizen: '',
    resident: ''
  });

  const handleNext = () => setStep(s => s + 1);

  const checkEligibility = () => {
    if (parseInt(formData.age) >= 18 && formData.citizen === 'yes' && formData.resident === 'yes') {
      setIsPassed(true);
    } else {
      setIsPassed(false);
    }
    setStep(4);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {isPassed && <Confetti recycle={false} numberOfPieces={500} />}
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-brand-dark">Am I Eligible?</h1>
        <p className="text-gray-500">Check your voting eligibility in 3 simple steps.</p>
      </div>

      <div className="glass-panel p-8 relative overflow-hidden min-h-[300px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-6">
              <h2 className="text-xl font-semibold">1. How old are you?</h2>
              <input 
                type="number" 
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary-500 bg-white" 
                placeholder="Enter your age" 
              />
              <button 
                onClick={handleNext}
                disabled={!formData.age}
                className="w-full bg-primary-600 text-white p-3 rounded-lg font-medium disabled:opacity-50"
              >
                Next
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-6">
              <h2 className="text-xl font-semibold">2. Are you an Indian citizen?</h2>
              <div className="flex gap-4">
                <button onClick={() => { setFormData({...formData, citizen: 'yes'}); handleNext(); }} className="flex-1 bg-white border-2 border-gray-200 p-4 rounded-xl hover:border-primary-500 font-medium">Yes</button>
                <button onClick={() => { setFormData({...formData, citizen: 'no'}); handleNext(); }} className="flex-1 bg-white border-2 border-gray-200 p-4 rounded-xl hover:border-red-500 font-medium">No</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-6">
              <h2 className="text-xl font-semibold">3. Are you an ordinary resident of your polling area?</h2>
              <div className="flex gap-4">
                <button onClick={() => { setFormData({...formData, resident: 'yes'}); setTimeout(checkEligibility, 100); }} className="flex-1 bg-white border-2 border-gray-200 p-4 rounded-xl hover:border-primary-500 font-medium">Yes</button>
                <button onClick={() => { setFormData({...formData, resident: 'no'}); setTimeout(checkEligibility, 100); }} className="flex-1 bg-white border-2 border-gray-200 p-4 rounded-xl hover:border-red-500 font-medium">No</button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
              {isPassed ? (
                <>
                  <CheckCircle2 className="w-20 h-20 text-primary-500 mx-auto" />
                  <h2 className="text-3xl font-bold text-green-700">You are eligible!</h2>
                  <p className="text-gray-600">Congratulations! You meet all the basic criteria to cast your vote.</p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-20 h-20 text-red-500 mx-auto" />
                  <h2 className="text-3xl font-bold text-red-700">Not Eligible Yet</h2>
                  <p className="text-gray-600">Based on your answers, you currently do not meet the criteria to vote. You must be an 18+ Indian citizen residing in the constituency.</p>
                </>
              )}
              <button onClick={() => { setStep(1); setFormData({age: '', citizen: '', resident: ''}); setIsPassed(null); }} className="text-primary-600 font-medium hover:underline">Start Over</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
