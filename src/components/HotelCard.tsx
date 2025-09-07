import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Heart, IndianRupee } from 'lucide-react';
import { RecommendedHotel } from '../types/hotel';
import { BookingPlatforms } from './BookingPlatforms';
import { getPriceRangeInfo, formatPrice } from '../utils/priceUtils';
import { getCachedHotelImage, getCachedUrl } from '../services/serpApi';

interface HotelCardProps {
  hotel: RecommendedHotel;
  index: number;
  onFavorite?: (hotel: RecommendedHotel) => void;
  isFavorite?: boolean;
}

export const HotelCard: React.FC<HotelCardProps> = ({ 
  hotel, 
  index, 
  onFavorite,
  isFavorite = false 
}) => {
  const hotelKey = `${hotel.name}-${hotel.city}`;
  const [imgSrc, setImgSrc] = React.useState<string>(
    hotel.image || getCachedUrl(hotelKey) || '/placeholder-hotel.svg'
  );
  const attemptedRef = React.useRef(false);

  const isUsableUrl = (url?: string | null) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    if (lower.includes('placeholder-hotel.svg')) return false;
    if (lower.startsWith('http://') || lower.startsWith('https://')) return true;
    return false;
  };

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      // If we already have a valid image on the hotel or in cache, skip fetch
      if (isUsableUrl(hotel.image)) return;
      const existing = getCachedUrl(hotelKey);
      if (existing) {
        if (!cancelled) setImgSrc(existing);
        return;
      }
      if (attemptedRef.current) return;
      attemptedRef.current = true;

      const query = hotel.address
        ? `${hotel.name} ${hotel.address}`
        : `${hotel.name} ${hotel.city}`;

      const fetched = await getCachedHotelImage(hotelKey, query);
      if (!cancelled && fetched) {
        setImgSrc(fetched);
      }
    })();
    return () => { cancelled = true; };
  }, [hotelKey, hotel.name, hotel.address, hotel.city, hotel.image]);
  const ratingValues = Object.values(hotel.platform_ratings)
    .map((pr) => pr?.rating)
    .filter((v): v is number => typeof v === 'number');
  const derivedAverage = ratingValues.length
    ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
    : 0;
  const averageRating = hotel.average_platform_rating ?? derivedAverage;
  const priceInfo = getPriceRangeInfo(hotel.price_range);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group max-w-sm mx-auto"
    >
      {/* Image Container */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={imgSrc}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src.endsWith('/placeholder-hotel.svg')) return;
            target.src = '/placeholder-hotel.svg';
            // If initial image was bad, attempt a fetch once to recover
            if (!attemptedRef.current) {
              attemptedRef.current = true;
              const query = hotel.address
                ? `${hotel.name} ${hotel.address}`
                : `${hotel.name} ${hotel.city}`;
              getCachedHotelImage(hotelKey, query).then((fetched) => {
                if (fetched) {
                  setImgSrc(fetched);
                }
              });
            }
          }}
        />
        
        {/* AI Score Badge */}
        <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
          AI Score: {hotel.overall_score}
        </div>

        {/* Price Badge */}
        <div className="absolute top-3 right-12 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg">
          <div className="flex items-center gap-1">
            <IndianRupee className="w-3 h-3 text-gray-600" />
            <span className="text-xs font-semibold text-gray-800">{formatPrice(hotel.price_range)}</span>
          </div>
        </div>

        {/* Favorite Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onFavorite?.(hotel)}
          className="absolute top-12 right-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg hover:bg-white transition-all duration-200"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
        </motion.button>

        {/* Badges */}
        <div className="absolute bottom-3 left-3 flex gap-1">
          {hotel.badges.slice(0, 2).map((badge, i) => (
            <span
              key={i}
              className="bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-0.5 rounded-full text-gray-700"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1 leading-tight">{hotel.name}</h3>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{hotel.address || hotel.city}</span>
            </div>
            {hotel.hotel_star_rating && (
              <div className="mt-1 text-xs text-gray-600">{hotel.hotel_star_rating}-star hotel</div>
            )}
            {hotel.room_type && (
              <div className="mt-1 text-xs text-gray-600">Room type: {hotel.room_type}</div>
            )}
          </div>
          <div className="flex items-center bg-green-100 px-2 py-1 rounded-lg shrink-0">
            <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
            <span className="text-sm font-semibold text-green-700">
              {averageRating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Price Range Tag */}
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${priceInfo.color}`}>
            <IndianRupee className="w-3 h-3" />
            {priceInfo.tag} • {formatPrice(hotel.price_range)}/night
          </span>
        </div>

        {/* Review Summary */}
        {hotel.review_summary && (
          <div className="mb-3 text-sm text-gray-700">
            {hotel.review_summary}
          </div>
        )}

        {/* Feature Scores */}
        <div className="space-y-2 mb-3">
          {hotel.features.slice(0, 3).map((feature, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 capitalize">{feature.name}</span>
              <div className="flex items-center">
                <div className="w-12 bg-gray-200 rounded-full h-1.5 mr-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${feature.score}%` }}
                    transition={{ duration: 1, delay: index * 0.1 + i * 0.1 }}
                    className="bg-gradient-to-r from-orange-400 to-pink-400 h-1.5 rounded-full"
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-6">{feature.score}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Facilities brief */}
        {hotel.facilities_brief && (
          <div className="mb-3 text-xs text-gray-600">
            <span className="font-medium text-gray-700">Facilities: </span>
            {hotel.facilities_brief}
          </div>
        )}

        {/* Booking Platforms */}
        <div className="pt-3 border-t border-gray-100">
          <BookingPlatforms hotel={hotel} />
        </div>
      </div>
    </motion.div>
  );
};