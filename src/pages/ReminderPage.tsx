import { useState, useEffect } from 'react';
import { calendarService } from '../services/calendarService';
import { CalendarPlus, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReminderPage() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Target election date (mocked to 30 days from now)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 30);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAddCalendar = async () => {
    setIsAdding(true);
    try {
      await calendarService.addElectionReminder({
        summary: "General Elections 2026 - Voting Day!",
        description: "Don't forget to carry your Voter ID (EPIC) or a valid alternate ID. Your vote shapes the nation.",
        location: "Your designated Polling Booth",
        startDateTime: new Date(targetDate.setHours(7, 0, 0, 0)).toISOString(),
        endDateTime: new Date(targetDate.setHours(18, 0, 0, 0)).toISOString(),
      });
      setAdded(true);
    } catch (e) {
      console.error(e);
      alert("Failed to add to calendar");
    } finally {
      setIsAdding(false);
    }
  };

  const whatsappText = encodeURIComponent(
    "🗳️ Don't forget to vote! The General Election is coming up. Check your eligibility and polling booth on the MataData Platform today!"
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  return (
    <div className="max-w-3xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-brand-dark">Election Countdown</h1>
        <p className="text-xl text-gray-600">Every second counts. Be ready to make your mark.</p>
      </div>

      {/* Timer */}
      <div className="glass-panel p-8 md:p-12">
        <div className="grid grid-cols-4 gap-4 text-center divide-x divide-gray-200">
          <div className="space-y-2">
            <div className="text-4xl md:text-6xl font-bold text-primary-600">{timeLeft.days.toString().padStart(2, '0')}</div>
            <div className="text-sm md:text-base text-gray-500 font-medium uppercase tracking-wider">Days</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl md:text-6xl font-bold text-primary-600">{timeLeft.hours.toString().padStart(2, '0')}</div>
            <div className="text-sm md:text-base text-gray-500 font-medium uppercase tracking-wider">Hours</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl md:text-6xl font-bold text-primary-600">{timeLeft.minutes.toString().padStart(2, '0')}</div>
            <div className="text-sm md:text-base text-gray-500 font-medium uppercase tracking-wider">Mins</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl md:text-6xl font-bold text-primary-600">{timeLeft.seconds.toString().padStart(2, '0')}</div>
            <div className="text-sm md:text-base text-gray-500 font-medium uppercase tracking-wider">Secs</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} className="glass-panel p-6 space-y-4 text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <CalendarPlus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Sync to Calendar</h3>
          <p className="text-gray-600 text-sm">Add a block to your Google Calendar so you don't schedule meetings over voting time.</p>
          
          {added ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-medium py-2">
              <CheckCircle2 className="w-5 h-5" /> Added to Calendar
            </div>
          ) : (
            <button 
              onClick={handleAddCalendar}
              disabled={isAdding}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isAdding ? <Clock className="w-5 h-5 animate-spin" /> : "Add Reminder"}
            </button>
          )}
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="glass-panel p-6 space-y-4 text-center">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Remind Family & Friends</h3>
          <p className="text-gray-600 text-sm">Share a quick reminder on WhatsApp to encourage your network to vote.</p>
          
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2 inline-block"
          >
            Share on WhatsApp
          </a>
        </motion.div>
      </div>
    </div>
  );
}
