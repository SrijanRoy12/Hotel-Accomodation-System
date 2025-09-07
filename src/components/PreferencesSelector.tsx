import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, 
  Car, 
  Utensils, 
  Waves, 
  Dumbbell, 
  Coffee, 
  Shield, 
  Baby, 
  Briefcase, 
  Heart,
  Star,
  MapPin,
  ChevronRight
} from 'lucide-react';

interface PreferencesSelectorProps {
  persona: string;
  city: string;
  onComplete: (preferences: string[]) => void;
}

const preferenceOptions = {
  Family: [
    { id: 'pool', label: 'Swimming Pool', icon: Waves, description: 'Kid-friendly pool area' },
    { id: 'playground', label: 'Play Area', icon: Baby, description: 'Children playground' },
    { id: 'family_rooms', label: 'Family Rooms', icon: Shield, description: 'Spacious family accommodations' },
    { id: 'breakfast', label: 'Breakfast Included', icon: Coffee, description: 'Complimentary breakfast' },
    { id: 'parking', label: 'Free Parking', icon: Car, description: 'Complimentary parking' },
    { id: 'wifi', label: 'Free WiFi', icon: Wifi, description: 'High-speed internet' }
  ],
  Business: [
    { id: 'meeting_rooms', label: 'Meeting Rooms', icon: Briefcase, description: 'Conference facilities' },
    { id: 'business_center', label: 'Business Center', icon: Briefcase, description: '24/7 business services' },
    { id: 'wifi', label: 'High-Speed WiFi', icon: Wifi, description: 'Reliable internet connection' },
    { id: 'executive_lounge', label: 'Executive Lounge', icon: Star, description: 'Premium business amenities' },
    { id: 'airport_shuttle', label: 'Airport Transfer', icon: Car, description: 'Convenient transportation' },
    { id: 'concierge', label: 'Concierge Service', icon: Shield, description: 'Professional assistance' }
  ],
  Luxury: [
    { id: 'spa', label: 'Spa Services', icon: Star, description: 'Premium wellness treatments' },
    { id: 'fine_dining', label: 'Fine Dining', icon: Utensils, description: 'Gourmet restaurants' },
    { id: 'butler', label: 'Butler Service', icon: Shield, description: 'Personal butler assistance' },
    { id: 'premium_suite', label: 'Premium Suites', icon: Star, description: 'Luxury accommodations' },
    { id: 'valet', label: 'Valet Parking', icon: Car, description: 'Premium parking service' },
    { id: 'rooftop', label: 'Rooftop Amenities', icon: MapPin, description: 'Sky bar or restaurant' }
  ],
  Solo: [
    { id: 'central_location', label: 'Central Location', icon: MapPin, description: 'Easy access to attractions' },
    { id: 'security', label: '24/7 Security', icon: Shield, description: 'Safe and secure environment' },
    { id: 'wifi', label: 'Free WiFi', icon: Wifi, description: 'Stay connected' },
    { id: 'gym', label: 'Fitness Center', icon: Dumbbell, description: 'Exercise facilities' },
    { id: 'cafe', label: 'Café/Restaurant', icon: Coffee, description: 'On-site dining options' },
    { id: 'transport', label: 'Public Transport', icon: Car, description: 'Easy transportation access' }
  ],
  Couple: [
    { id: 'romantic_dining', label: 'Romantic Dining', icon: Heart, description: 'Intimate restaurant settings' },
    { id: 'spa_couple', label: 'Couples Spa', icon: Star, description: 'Spa treatments for two' },
    { id: 'ocean_view', label: 'Scenic Views', icon: Waves, description: 'Beautiful room views' },
    { id: 'private_balcony', label: 'Private Balcony', icon: MapPin, description: 'Personal outdoor space' },
    { id: 'room_service', label: 'Room Service', icon: Utensils, description: 'In-room dining' },
    { id: 'honeymoon_suite', label: 'Honeymoon Suite', icon: Heart, description: 'Romantic accommodations' }
  ]
};

export const PreferencesSelector: React.FC<PreferencesSelectorProps> = ({ 
  persona, 
  city, 
  onComplete 
}) => {
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  
  const options = preferenceOptions[persona as keyof typeof preferenceOptions] || [];

  const togglePreference = (preferenceId: string) => {
    setSelectedPreferences(prev => 
      prev.includes(preferenceId)
        ? prev.filter(id => id !== preferenceId)
        : [...prev, preferenceId]
    );
  };

  const handleContinue = () => {
    onComplete(selectedPreferences);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            What matters most to you?
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            Help our AI understand your preferences for {city}
          </p>
          <p className="text-sm text-gray-500">
            Select all that apply • {selectedPreferences.length} selected
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {options.map((option, index) => {
            const isSelected = selectedPreferences.includes(option.id);
            const IconComponent = option.icon;
            
            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => togglePreference(option.id)}
                className={`p-6 rounded-xl shadow-lg transition-all duration-300 border-2 ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50 shadow-orange-200'
                    : 'border-transparent bg-white hover:border-orange-200 hover:shadow-xl'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  isSelected 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className={`font-semibold mb-2 ${
                  isSelected ? 'text-orange-700' : 'text-gray-800'
                }`}>
                  {option.label}
                </h3>
                <p className="text-sm text-gray-600">{option.description}</p>
                
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-white text-xs">✓</span>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleContinue}
            disabled={selectedPreferences.length === 0}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-orange-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with {selectedPreferences.length} preferences
            <ChevronRight className="w-5 h-5 inline ml-2" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};