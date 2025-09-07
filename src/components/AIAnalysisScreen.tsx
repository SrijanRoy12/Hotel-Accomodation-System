import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Database, 
  Search, 
  TrendingUp, 
  Star, 
  MapPin,
  Users,
  BarChart3,
  Zap
} from 'lucide-react';

interface AIAnalysisScreenProps {
  persona: string;
  city: string;
  preferences: string[];
  onComplete: () => void;
}

const analysisSteps = [
  {
    icon: Database,
    title: "Loading Hotel Database",
    description: "Accessing 50,000+ hotel reviews and ratings",
    duration: 800
  },
  {
    icon: MapPin,
    title: "Filtering by Location",
    description: "Finding hotels in your selected city",
    duration: 600
  },
  {
    icon: Brain,
    title: "AI Semantic Analysis",
    description: "Understanding review sentiments and preferences",
    duration: 1000
  },
  {
    icon: TrendingUp,
    title: "Scoring Algorithm",
    description: "Calculating confidence scores and rankings",
    duration: 700
  },
  {
    icon: Star,
    title: "Generating Recommendations",
    description: "Selecting top 5 perfect matches for you",
    duration: 500
  }
];

export const AIAnalysisScreen: React.FC<AIAnalysisScreenProps> = ({
  persona,
  city,
  preferences,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [analysisData, setAnalysisData] = useState({
    hotelsAnalyzed: 0,
    reviewsProcessed: 0,
    sentimentScore: 0,
    matchingHotels: 0
  });

  useEffect(() => {
    let stepTimer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;
    let dataTimer: NodeJS.Timeout;

    const runAnalysis = async () => {
      for (let i = 0; i < analysisSteps.length; i++) {
        setCurrentStep(i);
        
        // Animate progress for current step
        const stepDuration = analysisSteps[i].duration;
        const progressIncrement = 100 / analysisSteps.length;
        const startProgress = i * progressIncrement;
        
        let currentProgress = 0;
        progressTimer = setInterval(() => {
          currentProgress += 2;
          setProgress(startProgress + (currentProgress / 100) * progressIncrement);
          
          if (currentProgress >= 100) {
            clearInterval(progressTimer);
          }
        }, stepDuration / 50);

        // Simulate data updates
        dataTimer = setInterval(() => {
          setAnalysisData(prev => ({
            hotelsAnalyzed: Math.min(prev.hotelsAnalyzed + Math.floor(Math.random() * 50) + 10, 1247),
            reviewsProcessed: Math.min(prev.reviewsProcessed + Math.floor(Math.random() * 200) + 50, 52847),
            sentimentScore: Math.min(prev.sentimentScore + Math.floor(Math.random() * 5) + 2, 94),
            matchingHotels: Math.min(prev.matchingHotels + Math.floor(Math.random() * 3) + 1, 23)
          }));
        }, 200);

        await new Promise(resolve => {
          stepTimer = setTimeout(resolve, stepDuration);
        });

        clearInterval(progressTimer);
        clearInterval(dataTimer);
      }

      // Complete analysis
      setProgress(100);
      setTimeout(onComplete, 1000);
    };

    runAnalysis();

    return () => {
      clearTimeout(stepTimer);
      clearInterval(progressTimer);
      clearInterval(dataTimer);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
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

      <div className="relative z-10 max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Brain className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Magic in Progress
          </h1>
          <p className="text-xl text-white/80 mb-2">
            Analyzing hotels for {persona} travelers in {city}
          </p>
          <p className="text-sm text-white/60">
            Processing {preferences.length} preferences with advanced algorithms
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between text-white/80 text-sm mb-2">
            <span>Analysis Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="bg-gradient-to-r from-orange-400 to-pink-500 h-3 rounded-full"
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Current Step */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              {React.createElement(analysisSteps[currentStep]?.icon || Brain, {
                className: "w-6 h-6 text-white"
              })}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {analysisSteps[currentStep]?.title}
              </h3>
              <p className="text-white/70">
                {analysisSteps[currentStep]?.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Real-time Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
          >
            <BarChart3 className="w-8 h-8 text-blue-300 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {analysisData.hotelsAnalyzed.toLocaleString()}
            </div>
            <div className="text-sm text-white/70">Hotels Analyzed</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
          >
            <Users className="w-8 h-8 text-green-300 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {analysisData.reviewsProcessed.toLocaleString()}
            </div>
            <div className="text-sm text-white/70">Reviews Processed</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
          >
            <Zap className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {analysisData.sentimentScore}%
            </div>
            <div className="text-sm text-white/70">Sentiment Score</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
          >
            <Star className="w-8 h-8 text-purple-300 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {analysisData.matchingHotels}
            </div>
            <div className="text-sm text-white/70">Perfect Matches</div>
          </motion.div>
        </div>

        {/* Floating Analysis Bubbles */}
        <div className="relative h-32">
          {[
            "Analyzing breakfast quality reviews...",
            "Processing location convenience scores...",
            "Evaluating family-friendly amenities...",
            "Calculating price-value ratios...",
            "Matching your preferences..."
          ].map((text, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                y: [50, 0, -20, -50],
              }}
              transition={{
                duration: 4,
                delay: index * 0.8,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="absolute left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-medium text-white"
              style={{ left: `${20 + index * 15}%` }}
            >
              {text}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};