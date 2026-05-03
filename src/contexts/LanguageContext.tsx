/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { translationService } from '../services/translationService';

/**
 * ISO 639-1 / BCP-47 mapping for the 22 Scheduled Languages of India
 * Note: Cloud Translation API supports most of these. Some might fallback to English if unsupported.
 */
export const LANGUAGE_MAPPING: Record<string, string> = {
  "English": "en",
  "Hindi": "hi",
  "Bengali": "bn",
  "Telugu": "te",
  "Marathi": "mr",
  "Tamil": "ta",
  "Urdu": "ur",
  "Gujarati": "gu",
  "Kannada": "kn",
  "Odia": "or",
  "Malayalam": "ml",
  "Punjabi": "pa",
  "Assamese": "as",
  "Maithili": "mai",
  "Santali": "sat",
  "Kashmiri": "ks",
  "Nepali": "ne",
  "Sindhi": "sd",
  "Dogri": "doi",
  "Konkani": "kok",
  "Manipuri": "mni",
  "Bodo": "brx"
};

interface LanguageContextType {
  currentLanguage: string; // ISO Code
  languageName: string;   // Display Name
  setLanguage: (name: string) => void;
  t: (text: string) => string;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Local cache to avoid redundant API calls within a session
const translationCache = new Map<string, string>();

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem('selectedLanguageCode') || 'en';
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const languageName = Object.keys(LANGUAGE_MAPPING).find(key => LANGUAGE_MAPPING[key] === currentLanguage) || "English";

  const setLanguage = (name: string) => {
    const code = LANGUAGE_MAPPING[name];
    if (code) {
      setCurrentLanguage(code);
      localStorage.setItem('selectedLanguageCode', code);
      // Clear local component state translations to force re-fetch if needed
      // Though cache persists
    }
  };

  /**
   * Translates a string dynamically.
   * In a real app, we'd use a more robust i18n solution, 
   * but for "Dynamic AI Translation" of everything, we intercept here.
   */
  const t = useCallback((text: string): string => {
    if (currentLanguage === 'en' || !text.trim()) return text;

    const cacheKey = `${currentLanguage}:${text}`;

    // Return from state if already loaded in this render cycle
    if (translations[cacheKey]) return translations[cacheKey];

    // Check static cache
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    // Trigger background translation if not cached
    // Note: This is a "reactive" translation approach.
    // The first render will show English, then update to translated text.
    fetchTranslation(text, currentLanguage);

    return text; // Return original while loading
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage, translations]);

  const fetchTranslation = async (text: string, langCode: string) => {
    const cacheKey = `${langCode}:${text}`;
    if (translationCache.has(cacheKey) || isTranslating) return;

    try {
      setIsTranslating(true);
      const translated = await translationService.translateText(text, langCode);
      translationCache.set(cacheKey, translated);
      setTranslations(prev => ({ ...prev, [cacheKey]: translated }));
    } catch (error) {
      console.error("Translation fetch failed:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, languageName, setLanguage, t, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used within LanguageProvider");
  return context;
};
