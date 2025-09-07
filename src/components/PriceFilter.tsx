import React from 'react';
import { motion } from 'framer-motion';
import { IndianRupee } from 'lucide-react';
import { priceRanges, PriceRange } from '../utils/priceUtils';

interface PriceFilterProps {
  selectedRange: PriceRange | null;
  onRangeSelect: (range: PriceRange | null) => void;
}

export const PriceFilter: React.FC<PriceFilterProps> = ({ selectedRange, onRangeSelect }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <IndianRupee className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-gray-800">Price Range</h3>
      </div>

      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onRangeSelect(null)}
          className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
            !selectedRange 
              ? 'border-orange-500 bg-orange-50 text-orange-700' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">All Prices</span>
            <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">Any Budget</span>
          </div>
        </motion.button>

        {priceRanges.map((range, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRangeSelect(range)}
            className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
              selectedRange === range 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">{range.label}</span>
              <span className={`text-xs px-2 py-1 rounded-full border ${range.color}`}>
                {range.tag}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};