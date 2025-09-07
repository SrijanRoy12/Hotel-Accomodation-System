import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, Star, Heart } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            animate={{
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        {/* Main Logo */}
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-32 h-32 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
        >
          <MapPin className="w-16 h-16 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-bold text-white mb-4"
        >
          StayAI
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-white/80 mb-8"
        >
          Initializing AI Engine...
        </motion.p>

        {/* Floating Icons */}
        <div className="relative h-20 mb-8">
          {[Sparkles, Star, Heart, MapPin].map((Icon, index) => (
            <motion.div
              key={index}
              className="absolute left-1/2 top-1/2"
              animate={{
                x: [0, Math.cos(index * Math.PI / 2) * 60],
                y: [0, Math.sin(index * Math.PI / 2) * 60],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2,
              }}
            >
              <Icon className="w-8 h-8 text-white/60" />
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-64 mx-auto bg-white/20 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="bg-gradient-to-r from-orange-400 to-pink-500 h-2 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};