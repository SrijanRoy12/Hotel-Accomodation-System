import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Users, Star, MapPin } from 'lucide-react';
import { TravelerPersona } from '../types/hotel';

interface AIInsightsProps {
  persona: TravelerPersona;
  city: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ persona, city }) => {
  const insights = {
    Family: {
      topFeature: 'Family-friendly amenities',
      sentiment: 'families loved the kid-friendly facilities',
      trend: 'Pool access is most important for families',
      icon: Users
    },
    Business: {
      topFeature: 'Work-focused amenities',
      sentiment: 'business travelers praised WiFi quality',
      trend: 'Meeting rooms are highly valued',
      icon: TrendingUp
    },
    Luxury: {
      topFeature: 'Premium experiences',
      sentiment: 'luxury travelers loved spa services',
      trend: 'Rooftop dining is trending',
      icon: Star
    },
    Solo: {
      topFeature: 'Safety and convenience',
      sentiment: 'solo travelers felt secure',
      trend: 'Central locations preferred',
      icon: MapPin
    },
    Couple: {
      topFeature: 'Romantic ambiance',
      sentiment: 'couples loved the romantic settings',
      trend: 'Sea views are most requested',
      icon: Star
    }
  };

  const currentInsight = insights[persona];
  const IconComponent = currentInsight.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-2xl shadow-xl mb-8"
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="bg-white/20 p-3 rounded-full"
        >
          <Brain className="w-6 h-6" />
        </motion.div>
        <h3 className="text-xl font-bold">AI Insights for {persona} Travelers</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
          <IconComponent className="w-8 h-8 mb-2 text-yellow-300" />
          <h4 className="font-semibold mb-1">Top Priority</h4>
          <p className="text-sm opacity-90">{currentInsight.topFeature}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
          <TrendingUp className="w-8 h-8 mb-2 text-green-300" />
          <h4 className="font-semibold mb-1">Traveler Sentiment</h4>
          <p className="text-sm opacity-90">{currentInsight.sentiment}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
          <Star className="w-8 h-8 mb-2 text-blue-300" />
          <h4 className="font-semibold mb-1">Trending Now</h4>
          <p className="text-sm opacity-90">{currentInsight.trend}</p>
        </div>
      </div>
    </motion.div>
  );
};