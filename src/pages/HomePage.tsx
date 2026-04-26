import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, BrainCircuit, Target, Bell, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const languages = [
  "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Urdu", "Gujarati",
  "Kannada", "Odia", "Malayalam", "Punjabi", "Assamese", "Maithili", "Santali",
  "Kashmiri", "Nepali", "Sindhi", "Dogri", "Konkani", "Manipuri", "Bodo"
];

const features = [
  { icon: ShieldCheck,  title: "Eligibility Checker", desc: "Verify if you can vote with a quick 3-step check.",           path: "/eligibility", color: "text-green-600",  bg: "bg-green-100"  },
  { icon: MapPin,       title: "Booth Locator",       desc: "Find your nearest polling booth with live Maps.",             path: "/booths",      color: "text-blue-600",   bg: "bg-blue-100"   },
  { icon: BrainCircuit, title: "AI Coach",            desc: "Ask our Gemini-powered AI any election question.",            path: "/coach",       color: "text-purple-600", bg: "bg-purple-100" },
  { icon: Target,       title: "Gamified Journey",    desc: "Track your progress from registration to casting your vote.", path: "/journey",     color: "text-orange-600", bg: "bg-orange-100" },
  { icon: Bell,         title: "Smart Reminders",     desc: "Get Calendar & WhatsApp alerts for voting day.",             path: "/reminders",   color: "text-red-600",    bg: "bg-red-100"    },
];

export default function HomePage() {
  const [selectedLang, setSelectedLang] = useState("English");

  return (
    <div className="space-y-16 py-8">

      {/* Hero Section */}
      <section className="text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">
            India's Election Intelligence
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Empowering 900+ million voters. Demystifying the electoral process, one vote at a time.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12">
          {[
            { label: "Eligible Voters",  value: "968M+" },
            { label: "Polling Stations", value: "1M+"   },
            { label: "Languages",        value: "22"    },
            { label: "States & UTs",     value: "36"    },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass-panel p-6"
            >
              <div className="text-3xl font-bold text-primary-600">{stat.value}</div>
              <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Language Selector */}
      <section className="max-w-md mx-auto text-center space-y-4">
        <h2 className="text-xl font-semibold">Choose Your Language</h2>
        <select
          value={selectedLang}
          onChange={e => setSelectedLang(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
        >
          {languages.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </section>

      {/* Features Grid — each card navigates on click */}
      <section>
        <h2 className="text-2xl font-bold text-center text-brand-dark mb-8">What can MataData do?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="h-full"
            >
              <Link
                to={feature.path}
                className="glass-panel p-6 flex flex-col items-center text-center space-y-4 hover:shadow-2xl transition-all h-full group block"
                aria-label={`Go to ${feature.title}`}
              >
                <div className={`p-4 ${feature.bg} ${feature.color} rounded-full transition-transform group-hover:scale-110`}>
                  <feature.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-brand-dark">{feature.title}</h3>
                <p className="text-gray-600 text-sm flex-1">{feature.desc}</p>
                <span className={`flex items-center gap-1 text-sm font-semibold ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Explore <ArrowRight size={14} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}
