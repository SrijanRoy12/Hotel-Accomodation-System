import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Star } from 'lucide-react';
import { RecommendedHotel } from '../types/hotel';

interface BookingPlatformsProps {
  hotel: RecommendedHotel;
}

export const BookingPlatforms: React.FC<BookingPlatformsProps> = ({ hotel }) => {
  const platforms = [
    {
      name: 'Google',
      rating: hotel.platform_ratings.Google?.rating,
      count: hotel.platform_ratings.Google?.reviews_count,
      url: `https://www.google.com/travel/hotels/entity?q=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`,
      color: 'bg-blue-500 hover:bg-blue-600',
      logo: '🔍'
    },
    {
      name: 'Booking.com',
      rating: hotel.platform_ratings.Booking?.rating,
      count: hotel.platform_ratings.Booking?.reviews_count,
      url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`,
      color: 'bg-blue-600 hover:bg-blue-700',
      logo: '🏨'
    },
    {
      name: 'MakeMyTrip',
      rating: hotel.platform_ratings.MakeMyTrip?.rating,
      count: hotel.platform_ratings.MakeMyTrip?.reviews_count,
      url: `https://www.makemytrip.com/hotels/hotel-listing/?searchText=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`,
      color: 'bg-red-500 hover:bg-red-600',
      logo: '✈️'
    },
    {
      name: 'TripAdvisor',
      rating: hotel.platform_ratings.TripAdvisor?.rating,
      count: hotel.platform_ratings.TripAdvisor?.reviews_count,
      url: `https://www.tripadvisor.in/Search?q=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`,
      color: 'bg-green-500 hover:bg-green-600',
      logo: '🦉'
    }
  ];

  const handlePlatformClick = (url: string) => {
    // Open in new tab with specific hotel search
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-800 mb-3">Compare & Book</h4>
      <div className="grid grid-cols-2 gap-2">
        {platforms.map((platform, index) => (
          <motion.button
            key={platform.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePlatformClick(platform.url)}
            className={`${platform.color} text-white p-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg group`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{platform.logo}</span>
                <div className="text-left">
                  <div className="text-sm font-medium">{platform.name}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs">{platform.rating?.toFixed(1) ?? '—'}</span>
                    </div>
                    {typeof platform.count === 'number' && (
                      <span className="text-[10px] opacity-90">{platform.count.toLocaleString()} reviews</span>
                    )}
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};