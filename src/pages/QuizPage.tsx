import { useState } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Award, Trophy, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { sheetsService } from '../services/sheetsService';

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

  if (isFinished) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        {passed && <Confetti recycle={false} numberOfPieces={300} />}
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-brand-dark">Quiz Completed!</h1>
          <p className="text-xl text-gray-600">You scored {score} out of {MOCK_QUESTIONS.length} ({percentage}%)</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Certificate */}
          {passed ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-8 border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-white text-center flex flex-col items-center space-y-4">
              <Award className="w-20 h-20 text-yellow-500" />
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-800">Certificate of Civic Excellence</h2>
                <p className="text-gray-600 mt-2">Awarded for demonstrating outstanding knowledge of the Indian electoral process.</p>
              </div>
              <div className="w-full border-b-2 border-gray-300 mt-8 mb-2"></div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">MataData Platform</p>
            </motion.div>
          ) : (
            <div className="glass-panel p-8 text-center flex flex-col items-center justify-center space-y-4 bg-gray-50">
              <p className="text-lg text-gray-600">Score 80% or higher to unlock the Civic Excellence Certificate!</p>
              <button onClick={() => { setCurrentQ(0); setScore(0); setIsFinished(false); }} className="text-primary-600 font-medium hover:underline">Try Again</button>
            </div>
          )}

          {/* Leaderboard */}
          <div className="glass-panel p-6">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Trophy className="text-yellow-500 w-5 h-5" /> Top Scholars
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
            
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
              <FileSpreadsheet className="w-4 h-4" />
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
        <h1 className="text-3xl font-bold text-brand-dark">Election Quiz</h1>
        <div className="text-primary-600 font-bold bg-primary-50 px-4 py-2 rounded-full">
          Question {currentQ + 1} / {MOCK_QUESTIONS.length}
        </div>
      </div>

      <div className="glass-panel p-8 space-y-8 min-h-[350px]">
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
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
          <h2 className="text-xl font-semibold text-gray-800">{MOCK_QUESTIONS[currentQ].q}</h2>
          
          <div className="space-y-3">
            {MOCK_QUESTIONS[currentQ].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="w-full text-left p-4 rounded-xl border-2 border-gray-100 bg-white hover:border-primary-500 hover:bg-primary-50 transition-colors flex justify-between items-center group font-medium"
              >
                {opt}
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
