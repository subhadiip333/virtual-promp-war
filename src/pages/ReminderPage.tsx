import { useState, useEffect } from 'react';
import { calendarService } from '../services/calendarService';
import { CalendarPlus, MessageCircle, CheckCircle2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// 🔥 Reverse Geocoding
const getStateFromCoords = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`
    );
    const data = await res.json();

    const stateComp = data.results?.[0]?.address_components?.find((c: { types: string[] }) =>
      c.types.includes("administrative_area_level_1")
    );

    return stateComp?.long_name || null;
  } catch (err) {
    console.error("Geocoding failed", err);
    return null;
  }
};

// 🗳 Election mapping
const ELECTION_MAP: Record<string, { name: string; getDate: () => Date }> = {
  "Delhi": {
    name: "Delhi Assembly Election",
    getDate: () => {
      const d = new Date();
      d.setFullYear(new Date().getFullYear() + 1, 1, 10);
      return d;
    }
  },
  "Kerala": {
    name: "Kerala Assembly Election",
    getDate: () => {
      const d = new Date();
      d.setFullYear(new Date().getFullYear() + 2, 3, 20);
      return d;
    }
  },
  "Maharashtra": {
    name: "Maharashtra Assembly Election",
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 45);
      return d;
    }
  }
};

export default function ReminderPage() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [detectedState, setDetectedState] = useState<string>('Detecting...');
  const [targetDate, setTargetDate] = useState<Date>(() => {
    const d = new Date();
    d.setFullYear(2029, 4, 15);
    return d;
  });

  // 📍 Detect location → state → election
  useEffect(() => {
    const detectLocation = async () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const state = await getStateFromCoords(lat, lng);

          if (state && ELECTION_MAP[state]) {
            const election = ELECTION_MAP[state];
            setDetectedState(election.name);
            setTargetDate(election.getDate());
          } else {
            setDetectedState("General Election (India)");
            const d = new Date();
            d.setFullYear(2029, 4, 15);
            setTargetDate(d);
          }
        },
        () => {
          console.warn("Geolocation denied");
          setDetectedState("General Election (India)");
        }
      );
    };

    detectLocation();
  }, []);

  // ⏳ Countdown logic
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

  // 📅 Add to Calendar
  const handleAddCalendar = async () => {
    setIsAdding(true);
    try {
      await calendarService.addElectionReminder({
        summary: `${detectedState} - Voting Day`,
        description: "Don't forget to carry your Voter ID.",
        location: "Your designated polling booth",
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

  // 📲 WhatsApp
  const whatsappText = encodeURIComponent(
    `🗳️ Don't forget to vote! ${detectedState} is coming soon.`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  return (
    <div className="max-w-3xl mx-auto space-y-12 py-8">

      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-brand-dark">Election Countdown</h1>
        <p className="text-gray-600">Be ready to make your vote count.</p>

        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
          <MapPin className="w-5 h-5" />
          {detectedState}
        </div>
      </div>

      {/* Timer */}
      <div className="glass-panel p-8">
        <div className="grid grid-cols-4 gap-4 text-center">
          {Object.entries(timeLeft).map(([key, val]) => (
            <div key={key}>
              <div className="text-4xl font-bold text-primary-600">
                {val.toString().padStart(2, '0')}
              </div>
              <div className="text-gray-500 uppercase text-sm">{key}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Calendar */}
        <motion.div whileHover={{ scale: 1.02 }} className="glass-panel p-6 text-center">
          <CalendarPlus className="mx-auto mb-3" />
          <h3 className="font-bold">Add to Calendar</h3>

          {added ? (
            <div className="text-green-600 flex justify-center gap-2 mt-3">
              <CheckCircle2 /> Added
            </div>
          ) : (
            <button
              onClick={handleAddCalendar}
              disabled={isAdding}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
            >
              {isAdding ? "Adding..." : "Add Reminder"}
            </button>
          )}
        </motion.div>

        {/* WhatsApp */}
        <motion.div whileHover={{ scale: 1.02 }} className="glass-panel p-6 text-center">
          <MessageCircle className="mx-auto mb-3" />
          <h3 className="font-bold">Share Reminder</h3>

          <a
            href={whatsappUrl}
            target="_blank"
            className="mt-3 inline-block bg-green-500 text-white px-4 py-2 rounded"
          >
            Share on WhatsApp
          </a>
        </motion.div>

      </div>
    </div>
  );
}