import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Award, Trophy, ChevronRight, FileSpreadsheet, Share2 } from 'lucide-react';
import { sheetsService } from '../services/sheetsService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const MOCK_QUESTIONS = [
  { q: "What is the minimum voting age in India?", options: ["16", "18", "21", "25"], answer: 1 },
  { q: "Which form is used for registering as a new voter?", options: ["Form 6", "Form 7", "Form 8", "Form 9"], answer: 0 },
  { q: "What does EVM stand for?", options: ["Electronic Voting Machine", "Electoral Vote Monitor", "Election Validity Meter", "None of the above"], answer: 0 },
  { q: "What is NOTA?", options: ["Name Of The Applicant", "None Of The Above", "National Observer Tool App", "Notice Of Tracking Area"], answer: 1 },
  { q: "Who conducts the general elections in India?", options: ["President", "Supreme Court", "Election Commission of India", "Parliament"], answer: 2 },
  { q: "Which of these is a valid ID for voting if you don't have an EPIC?", options: ["Library Card", "Aadhaar Card", "Gym Membership", "Credit Card"], answer: 1 },
  { q: "What color is the indelible ink applied to a voter's finger?", options: ["Red", "Blue/Purple", "Green", "Black"], answer: 1 },
  { q: "Where can you check if your name is on the voter list?", options: ["NVSP Portal", "Local Police Station", "Post Office", "Banks"], answer: 0 },
  { q: "What does VVPAT stand for?", options: ["Voter Verifiable Paper Audit Trail", "Voting Validity Protocol And Tracking", "Voter Value Print At Terminal", "Verify Vote Print And Tally"], answer: 0 },
  { q: "Which constitutional article established the Election Commission?", options: ["Article 370", "Article 324", "Article 356", "Article 14"], answer: 1 },
];

export default function QuizPage() {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [eligibilityScore, setEligibilityScore] = useState(0);

  useEffect(() => {
    const savedElig = localStorage.getItem('eligibilityScore');
    if (savedElig) {
      setEligibilityScore(parseInt(savedElig, 10));
    }
  }, []);

  const handleAnswer = (index: number) => {
    if (index === MOCK_QUESTIONS[currentQ].answer) {
      setScore(s => s + 1);
    }
    
    if (currentQ < MOCK_QUESTIONS.length - 1) {
      setCurrentQ(c => c + 1);
    } else {
      finishQuiz(score + (index === MOCK_QUESTIONS[currentQ].answer ? 1 : 0));
    }
  };

  const finishQuiz = async (finalScore: number) => {
    setIsFinished(true);
    setIsLogging(true);
    try {
      await sheetsService.logQuizScore("user-123", "civics-101", finalScore);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLogging(false);
    }
  };

  const percentage = (score / MOCK_QUESTIONS.length) * 100;
  const passed = percentage >= 80;
  
  // Total Readiness Score (50 from eligibility + 50 from quiz)
  const quizPoints = (score / MOCK_QUESTIONS.length) * 50;
  const totalReadinessScore = Math.round(eligibilityScore + quizPoints);

  const chartData = {
    labels: ['Readiness', 'Remaining'],
    datasets: [
      {
        data: [totalReadinessScore, 100 - totalReadinessScore],
        backgroundColor: ['#22c55e', '#e5e7eb'],
        borderWidth: 0,
        circumference: 360,
        rotation: 270,
      },
    ],
  };

  const shareScore = () => {
    const text = encodeURIComponent(`I just scored ${totalReadinessScore}/100 on my Voter Readiness test at MataData! Check your eligibility and test your knowledge now! 🗳️🇮🇳`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (isFinished) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {passed && <Confetti recycle={false} numberOfPieces={300} />}
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-brand-dark" tabIndex={0}>Quiz Completed!</h1>
          <p className="text-xl text-gray-600">You scored {score} out of {MOCK_QUESTIONS.length} ({percentage}%) on the knowledge check.</p>
        </div>

        {/* Voter Readiness Score Section */}
        <div className="glass-panel p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="w-full md:w-1/2 space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark" tabIndex={0}>Your Voter Readiness Score</h2>
            <p className="text-gray-600">
              This score combines your basic Eligibility criteria (50%) and your Electoral Knowledge from the quiz (50%).
            </p>
            {eligibilityScore === 0 && (
              <p className="text-red-500 text-sm font-bold bg-red-50 p-2 rounded">
                Note: You scored 0 on eligibility. Please ensure you are an 18+ Indian resident.
              </p>
            )}
            <button 
              onClick={shareScore}
              className="mt-4 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
              aria-label="Share score on WhatsApp"
            >
              <Share2 className="w-5 h-5" aria-hidden="true" /> Share Score
            </button>
          </div>
          <div className="w-48 h-48 relative">
            <Doughnut data={chartData} options={{ cutout: '75%', plugins: { tooltip: { enabled: false }, legend: { display: false } } }} />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-extrabold text-brand-dark">{totalReadinessScore}</span>
              <span className="text-sm text-gray-500 font-medium">/ 100</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Certificate */}
          {passed ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-8 border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-white text-center flex flex-col items-center space-y-4">
              <Award className="w-20 h-20 text-yellow-500" aria-hidden="true" />
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-800" tabIndex={0}>Certificate of Civic Excellence</h2>
                <p className="text-gray-600 mt-2">Awarded for demonstrating outstanding knowledge of the Indian electoral process.</p>
              </div>
              <div className="w-full border-b-2 border-gray-300 mt-8 mb-2"></div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">MataData Platform</p>
            </motion.div>
          ) : (
            <div className="glass-panel p-8 text-center flex flex-col items-center justify-center space-y-4 bg-gray-50">
              <p className="text-lg text-gray-600">Score 80% or higher to unlock the Civic Excellence Certificate!</p>
              <button 
                onClick={() => { setCurrentQ(0); setScore(0); setIsFinished(false); }} 
                className="text-primary-600 font-medium hover:underline p-2"
                aria-label="Try the quiz again"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Leaderboard */}
          <div className="glass-panel p-6">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4" tabIndex={0}>
              <Trophy className="text-yellow-500 w-5 h-5" aria-hidden="true" /> Top Scholars
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <span className="font-medium">1. Anjali M.</span>
                <span className="font-bold text-green-600">100%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <span className="font-medium">2. Rahul S.</span>
                <span className="font-bold text-green-600">90%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary-50 rounded-lg border border-primary-200">
                <span className="font-bold text-primary-700">3. You</span>
                <span className="font-bold text-primary-700">{percentage}%</span>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 bg-gray-100 p-2 rounded" aria-live="polite">
              <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
              {isLogging ? "Logging score to Google Sheets..." : "Score safely synced to Google Sheets!"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brand-dark" tabIndex={0}>Election Quiz</h1>
        <div className="text-primary-600 font-bold bg-primary-50 px-4 py-2 rounded-full" aria-live="polite">
          Question {currentQ + 1} / {MOCK_QUESTIONS.length}
        </div>
      </div>

      <div className="glass-panel p-8 space-y-8 min-h-[350px]">
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden" aria-hidden="true">
          <div 
            className="bg-primary-500 h-full transition-all duration-300"
            style={{ width: `${((currentQ) / MOCK_QUESTIONS.length) * 100}%` }}
          />
        </div>

        <motion.div 
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-semibold text-gray-800" tabIndex={0}>{MOCK_QUESTIONS[currentQ].q}</h2>
          
          <div className="space-y-3" role="radiogroup" aria-label="Quiz options">
            {MOCK_QUESTIONS[currentQ].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="w-full text-left p-4 rounded-xl border-2 border-gray-100 bg-white hover:border-primary-500 hover:bg-primary-50 transition-colors flex justify-between items-center group font-medium"
                aria-label={`Select option: ${opt}`}
              >
                {opt}
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500" aria-hidden="true" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
