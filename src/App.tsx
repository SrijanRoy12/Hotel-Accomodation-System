import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PersonalizationFlow } from './components/PersonalizationFlow';
import RecommendationsScreen from './components/RecommendationsScreen';
import { AIInsights } from './components/AIInsights';
import { Header } from './components/Header';
import { LoadingScreen } from './components/LoadingScreen';
import { useAI } from './hooks/useAI';
import { TravelerPersona } from './types/hotel';

type AppState = 'loading' | 'welcome' | 'personalization' | 'recommendations';

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [selectedPersona, setSelectedPersona] = useState<TravelerPersona | null>(null);
  const [selectedCity, setSelectedCity] = useState('');
  const { recommendations, analyzePreferences, isAnalyzing } = useAI();

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setAppState('welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    setAppState('personalization');
  };

  const handlePersonalizationComplete = async (persona: TravelerPersona, city: string) => {
    setSelectedPersona(persona);
    setSelectedCity(city);
    
    // Trigger AI analysis
    await analyzePreferences(persona, city);
    
    setAppState('recommendations');
  };

  const handleBack = () => {
    setAppState('personalization');
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {appState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingScreen />
          </motion.div>
        )}

        {appState === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <WelcomeScreen onGetStarted={handleGetStarted} />
          </motion.div>
        )}

        {appState === 'personalization' && (
          <motion.div
            key="personalization"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PersonalizationFlow onComplete={handlePersonalizationComplete} />
          </motion.div>
        )}

        {appState === 'recommendations' && selectedPersona && (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Header />
            <div className="pt-8">
              <RecommendationsScreen
                hotels={recommendations}
                persona={selectedPersona}
                selectedCity={selectedCity}
                onBack={handleBack}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;