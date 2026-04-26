import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Unlock, ArrowRight } from 'lucide-react';

const steps = [
  { id: 1, title: "Registration", desc: "Fill Form 6 to enroll as a new voter." },
  { id: 2, title: "Verification", desc: "BLO verifies your residential address." },
  { id: 3, title: "EPIC Issued", desc: "Receive your Voter ID card." },
  { id: 4, title: "Find Booth", desc: "Locate your assigned polling station." },
  { id: 5, title: "Know Candidates", desc: "Research candidates in your constituency." },
  { id: 6, title: "Cast Vote", desc: "Go to the booth and press the EVM button." },
  { id: 7, title: "Ink Mark", desc: "Receive the indelible ink mark." },
];

export default function VoterJourneyPage() {
  const [currentStep, setCurrentStep] = useState(1);

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('voterJourneyProgress');
    if (saved) {
      setCurrentStep(parseInt(saved, 10));
    }
  }, []);

  const completeStep = (id: number) => {
    if (id === currentStep && currentStep < steps.length + 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      localStorage.setItem('voterJourneyProgress', next.toString());
    }
  };

  const resetJourney = () => {
    setCurrentStep(1);
    localStorage.removeItem('voterJourneyProgress');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2 flex justify-between items-end">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-brand-dark">Your Voter Journey</h1>
          <p className="text-gray-500">Track your progress from registration to the ballot box.</p>
        </div>
        <button onClick={resetJourney} className="text-sm text-red-500 hover:underline">Reset Progress</button>
      </div>

      <div className="relative border-l-4 border-gray-200 ml-6 space-y-8 py-4">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isLocked = currentStep < step.id;

          return (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative pl-8 ${isLocked ? 'opacity-50' : 'opacity-100'}`}
            >
              {/* Timeline dot */}
              <div className={`absolute -left-[14px] top-1 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white
                ${isCompleted ? 'bg-green-500' : isActive ? 'bg-primary-500 animate-pulse' : 'bg-gray-300'}
              `}>
                {isCompleted && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
              </div>

              <div className={`glass-panel p-6 transition-all ${isActive ? 'ring-2 ring-primary-500 transform scale-[1.02]' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      Step {step.id}: {step.title}
                      {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                      {!isLocked && !isCompleted && <Unlock className="w-4 h-4 text-primary-500" />}
                    </h3>
                    <p className="text-gray-600 mt-1">{step.desc}</p>
                  </div>
                  
                  {!isLocked && !isCompleted && (
                    <button 
                      onClick={() => completeStep(step.id)}
                      className="flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-200 transition-colors"
                    >
                      Complete <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {isCompleted && (
                    <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Done</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {currentStep > steps.length && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-8 text-center bg-gradient-to-r from-primary-50 to-green-50">
          <h2 className="text-2xl font-bold text-green-700 mb-2">Journey Complete!</h2>
          <p className="text-gray-700">You are a fully prepared and active citizen of democracy.</p>
        </motion.div>
      )}
    </div>
  );
}
