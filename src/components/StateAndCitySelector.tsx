import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, Search } from 'lucide-react';

interface StateAndCitySelectorProps {
  onCitySelect: (city: string) => void;
}

const indianStatesAndCities = {
  'Delhi': ['New Delhi', 'Delhi'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nashik', 'Aurangabad'],
  'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Hubli'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
  'West Bengal': ['Kolkata', 'Darjeeling', 'Siliguri', 'Durgapur'],
  'Rajasthan': ['Jaipur', 'Udaipur', 'Jodhpur', 'Ajmer'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  'Uttar Pradesh': ['Agra', 'Lucknow', 'Varanasi', 'Kanpur']
};

export const StateAndCitySelector: React.FC<StateAndCitySelectorProps> = ({ onCitySelect }) => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStates = Object.keys(indianStatesAndCities).filter(state =>
    state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCities = selectedState 
    ? indianStatesAndCities[selectedState as keyof typeof indianStatesAndCities].filter(city =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setSearchTerm('');
  };

  const handleCitySelect = (city: string) => {
    onCitySelect(city);
  };

  const handleBack = () => {
    setSelectedState(null);
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {selectedState ? `Cities in ${selectedState}` : 'Choose Your Destination'}
          </h2>
          <p className="text-xl text-gray-600">
            {selectedState ? 'Select a city to find perfect hotels' : 'Select a state to explore cities'}
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 max-w-md mx-auto"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={selectedState ? "Search cities..." : "Search states..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200"
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {!selectedState ? (
            <motion.div
              key="states"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredStates.map((state, index) => (
                <motion.button
                  key={state}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStateSelect(state)}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-orange-200 group"
                >
                  <MapPin className="w-8 h-8 mx-auto mb-3 text-orange-500 group-hover:text-orange-600" />
                  <h3 className="font-semibold text-gray-800 mb-2">{state}</h3>
                  <p className="text-sm text-gray-600">
                    {indianStatesAndCities[state as keyof typeof indianStatesAndCities].length} cities
                  </p>
                  <ChevronRight className="w-5 h-5 mx-auto mt-2 text-gray-400 group-hover:text-orange-500" />
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="cities"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <div className="flex items-center justify-center mb-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                >
                  ← Back to States
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredCities.map((city, index) => (
                  <motion.button
                    key={city}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCitySelect(city)}
                    className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-orange-200 group"
                  >
                    <MapPin className="w-6 h-6 mx-auto mb-2 text-orange-500 group-hover:text-orange-600" />
                    <span className="font-semibold text-gray-800">{city}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};