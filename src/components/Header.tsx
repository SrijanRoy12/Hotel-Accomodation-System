import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, Heart, Search } from 'lucide-react';

interface HeaderProps {
  onProfileClick?: () => void;
  onFavoritesClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onProfileClick, onFavoritesClick }) => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/95 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              StayAI
            </span>
          </motion.div>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            >
              Explore
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            >
              AI Insights
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            >
              About
            </motion.button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onFavoritesClick}
              className="p-2 text-gray-600 hover:text-red-500 transition-colors duration-200"
            >
              <Heart className="w-6 h-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onProfileClick}
              className="p-2 text-gray-600 hover:text-orange-500 transition-colors duration-200"
            >
              <User className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};