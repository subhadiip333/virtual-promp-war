import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Bot, User, Volume2, VolumeX } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Namaste! I'm your AI Election Coach. How can I help you understand the voting process today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakText = (text: string) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await geminiService.askElectionCoach(text);
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: response.reply, sender: 'bot' };
      setMessages(prev => [...prev, botMsg]);
      speakText(response.reply);
    } catch {
      const errMsg = "Sorry, I'm having trouble connecting to my database right now.";
      const errorMsg: Message = { id: (Date.now() + 1).toString(), text: errMsg, sender: 'bot' };
      setMessages(prev => [...prev, errorMsg]);
      speakText(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListen = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support the Web Speech API.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    // @ts-expect-error browser specific api
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    
    recognition.onresult = (event: unknown) => {
      const e = event as { results: { transcript: string }[][] };
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col glass-panel overflow-hidden">
      <div className="bg-primary-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 bg-white/20 p-1 rounded-full" aria-hidden="true" />
          <div>
            <h2 className="font-bold text-lg">Election AI Coach</h2>
            <p className="text-primary-100 text-sm">Powered by Gemini 1.5 Flash</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as 'en-IN' | 'hi-IN')}
            className="bg-primary-700 text-white border-none rounded-lg p-1 text-sm outline-none"
            aria-label="Select Assistant Language"
          >
            <option value="en-IN">English (IN)</option>
            <option value="hi-IN">Hindi (IN)</option>
          </select>
          <button 
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="p-2 hover:bg-primary-700 rounded-full transition-colors"
            aria-label={ttsEnabled ? "Disable Text to Speech" : "Enable Text to Speech"}
            title={ttsEnabled ? "Voice Output ON" : "Voice Output OFF"}
          >
            {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 opacity-70" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50" role="log" aria-live="polite">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] flex gap-3 p-3 rounded-2xl ${
              msg.sender === 'user' 
                ? 'bg-primary-600 text-white rounded-tr-none' 
                : 'bg-white border text-gray-800 rounded-tl-none shadow-sm'
            }`}>
              {msg.sender === 'bot' && <Bot className="w-5 h-5 mt-1 opacity-70 shrink-0" aria-hidden="true" />}
              <p className="leading-relaxed">{msg.text}</p>
              {msg.sender === 'user' && <User className="w-5 h-5 mt-1 opacity-70 shrink-0" aria-hidden="true" />}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border text-gray-500 rounded-2xl rounded-tl-none p-4 shadow-sm flex gap-2" aria-label="Bot is typing">
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="flex gap-2"
        >
          <button 
            type="button"
            onClick={toggleListen}
            className={`p-3 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask your question in ${language === 'en-IN' ? 'English' : 'Hindi'}...`}
            className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
            disabled={isLoading}
            aria-label="Message input"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-primary-600 text-white p-3 rounded-xl disabled:opacity-50 hover:bg-primary-700 transition-colors flex items-center justify-center w-12"
            aria-label="Send message"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
