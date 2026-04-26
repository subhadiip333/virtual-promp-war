import { useState, useEffect } from 'react';
import { calendarService } from '../services/calendarService';
import { CalendarPlus, MessageCircle, Clock, CheckCircle2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReminderPage() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [detectedState, setDetectedState] = useState<string>('General Election');
  const [targetDate, setTargetDate] = useState<Date>(() => {
    const d = new Date();
    d.setFullYear(2029, 4, 15); // Default to General Elections 2029
    return d;
  });

  useEffect(() => {
    // Attempt to geolocate user for state-specific elections
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Mock reverse-geocoding based on lat/lng
          const lat = position.coords.latitude;
          if (lat > 28) {
            setDetectedState('Delhi State Election');
            const d = new Date();
            d.setFullYear(new Date().getFullYear() + 1, 1, 10);
            setTargetDate(d);
          } else if (lat < 15) {
            setDetectedState('Kerala State Election');
            const d = new Date();
            d.setFullYear(new Date().getFullYear() + 2, 3, 20);
            setTargetDate(d);
          } else {
            setDetectedState('Maharashtra State Election');
            const d = new Date();
            d.setDate(d.getDate() + 45); // 45 days from now
            setTargetDate(d);
          }
        },
        () => {
          console.warn("Geolocation denied. Defaulting to General Elections.");
        }
      );
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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
  }, [targetDate]);

  const handleAddCalendar = async () => {
    setIsAdding(true);
    try {
      await calendarService.addElectionReminder({
        summary: `${detectedState} - Voting Day!`,
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
    `🗳️ Don't forget to vote! The ${detectedState} is coming up. Check your eligibility and polling booth on the MataData Platform today!`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  return (
    <div className="max-w-3xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-brand-dark" tabIndex={0}>Election Countdown</h1>
        <p className="text-xl text-gray-600">Every second counts. Be ready to make your mark.</p>
        
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-medium" aria-live="polite">
          <MapPin className="w-5 h-5" aria-hidden="true" />
          Showing dates for: {detectedState}
        </div>
      </div>

      {/* Timer */}
      <div className="glass-panel p-8 md:p-12">
        <div className="grid grid-cols-4 gap-4 text-center divide-x divide-gray-200" aria-label="Countdown timer" tabIndex={0}>
          <div className="space-y-2">
            <div className="text-4xl md:text-6xl font-bold text-primary-600" aria-hidden="true">{timeLeft.days.toString().padStart(2, '0')}</div>
            <div className="text-sm md:text-base text-gray-500 font-medium uppercase tracking-wider">Days</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl md:text-6xl font-bold text-primary-600" aria-hidden="true">{timeLeft.hours.toString().padStart(2, '0')}</div>
            <div className="text-sm md:text-base text-gray-500 font-medium uppercase tracking-wider">Hours</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl md:text-6xl font-bold text-primary-600" aria-hidden="true">{timeLeft.minutes.toString().padStart(2, '0')}</div>
            <div className="text-sm md:text-base text-gray-500 font-medium uppercase tracking-wider">Mins</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl md:text-6xl font-bold text-primary-600" aria-hidden="true">{timeLeft.seconds.toString().padStart(2, '0')}</div>
            <div className="text-sm md:text-base text-gray-500 font-medium uppercase tracking-wider">Secs</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} className="glass-panel p-6 space-y-4 text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto" aria-hidden="true">
            <CalendarPlus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-800" tabIndex={0}>Sync to Calendar</h3>
          <p className="text-gray-600 text-sm">Add a block to your Google Calendar so you don't schedule meetings over voting time.</p>
          
          {added ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-medium py-2" aria-live="polite">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> Added to Calendar
            </div>
          ) : (
            <button 
              onClick={handleAddCalendar}
              disabled={isAdding}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              aria-label="Add reminder to Google Calendar"
            >
              {isAdding ? <Clock className="w-5 h-5 animate-spin" aria-hidden="true" /> : "Add Reminder"}
            </button>
          )}
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="glass-panel p-6 space-y-4 text-center">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto" aria-hidden="true">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-800" tabIndex={0}>Remind Family & Friends</h3>
          <p className="text-gray-600 text-sm">Share a quick reminder on WhatsApp to encourage your network to vote.</p>
          
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2 inline-block"
            aria-label="Share election reminder on WhatsApp"
          >
            Share on WhatsApp
          </a>
        </motion.div>
      </div>
    </div>
  );
}
