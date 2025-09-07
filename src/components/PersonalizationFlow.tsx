import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Briefcase, Crown, Backpack, Heart, ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { TravelerPersona } from '../types/hotel';
import { StateAndCitySelector } from './StateAndCitySelector';
import { PreferencesSelector } from './PreferencesSelector';
import { AIAnalysisScreen } from './AIAnalysisScreen';

interface PersonalizationFlowProps {
  onComplete: (persona: TravelerPersona, city: string) => void;
}

const personas = [
  { id: 'Family' as TravelerPersona, icon: Users, label: 'Family', emoji: '👨‍👩‍👧', description: 'Kid-friendly amenities' },
  { id: 'Business' as TravelerPersona, icon: Briefcase, label: 'Business', emoji: '🧳', description: 'Work-focused stays' },
  { id: 'Luxury' as TravelerPersona, icon: Crown, label: 'Luxury', emoji: '🏖️', description: 'Premium experiences' },
  { id: 'Solo' as TravelerPersona, icon: Backpack, label: 'Solo', emoji: '🎒', description: 'Independent travel' },
  { id: 'Couple' as TravelerPersona, icon: Heart, label: 'Couple', emoji: '💑', description: 'Romantic getaways' },
];

const cities = [
  'Delhi', 'Mumbai', 'Goa', 'Jaipur', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Agra'
];

export const PersonalizationFlow: React.FC<PersonalizationFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedPersona, setSelectedPersona] = useState<TravelerPersona | null>(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  const handlePersonaSelect = (persona: TravelerPersona) => {
    setSelectedPersona(persona);
    setTimeout(() => setStep(2), 500);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setTimeout(() => setStep(3), 500);
  };

  const handlePreferencesComplete = (preferences: string[]) => {
    setSelectedPreferences(preferences);
    setTimeout(() => setStep(4), 500);
  };

  const handleAnalysisComplete = () => {
    onComplete(selectedPersona!, selectedCity);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="text-center"
            >
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-bold text-gray-800 mb-4"
              >
                What's your travel style?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-600 mb-12"
              >
                Help our AI understand your preferences
              </motion.p>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {personas.map((persona, index) => (
                  <motion.button
                    key={persona.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePersonaSelect(persona.id)}
                    className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-orange-200"
                  >
                    <div className="text-4xl mb-3">{persona.emoji}</div>
                    <persona.icon className="w-8 h-8 mx-auto mb-3 text-orange-500" />
                    <h3 className="font-semibold text-gray-800 mb-2">{persona.label}</h3>
                    <p className="text-sm text-gray-600">{persona.description}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <StateAndCitySelector onCitySelect={handleCitySelect} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <PreferencesSelector
                persona={selectedPersona!}
                city={selectedCity}
                onComplete={handlePreferencesComplete}
              />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AIAnalysisScreen
                persona={selectedPersona!}
                city={selectedCity}
                preferences={selectedPreferences}
                onComplete={handleAnalysisComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};