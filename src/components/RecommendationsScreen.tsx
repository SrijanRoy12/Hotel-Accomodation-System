import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, MapPin, Star, Users, Briefcase, Heart, User, Search as SearchIcon } from 'lucide-react';
import { RecommendedHotel, TravelerPersona } from '../types/hotel';
import { HotelCard } from './HotelCard';
import { InteractiveMap } from './InteractiveMap';
import { AIInsights } from './AIInsights';
import { PriceFilter } from './PriceFilter';
import type { PriceRange } from '../utils/priceUtils';
import Chatbot from './Chatbot';
import { geocodeNominatim, getCloseMatches, haversineDistance } from '../utils/geo';

interface RecommendationsScreenProps {
  hotels: RecommendedHotel[];
  persona: TravelerPersona;
  selectedCity: string;
  onBack: () => void;
}

const RecommendationsScreen: React.FC<RecommendationsScreenProps> = ({
  hotels,
  persona,
  selectedCity,
  onBack
}) => {
  const [sortBy, setSortBy] = useState<'ai_score' | 'price' | 'rating' | 'star' | 'avg_customer' | 'distance' | 'address_az'>('ai_score');
  const [showMap, setShowMap] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [areaQuery, setAreaQuery] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [geoCenter, setGeoCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceByKey, setDistanceByKey] = useState<Record<string, number>>({});
  const [areaFiltered, setAreaFiltered] = useState<RecommendedHotel[] | null>(null);

  // Filter hotels by selected city and price range
  const filteredHotels = useMemo(() => {
    let filtered = hotels;

    // Filter by city if selected
    if (selectedCity && selectedCity !== 'all') {
      filtered = filtered.filter(hotel => 
        hotel.city.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    // Filter by price range
    if (selectedPriceRange) {
      filtered = filtered.filter(hotel => {
        const price = hotel.price_range || 2500;
        return price >= selectedPriceRange.min && price <= selectedPriceRange.max;
      });
    }

    return filtered;
  }, [hotels, selectedCity, selectedPriceRange]);

  // Area search: compute top-5 hotels using fuzzy match over address/city, otherwise geocode and distance
  useEffect(() => {
    let cancel = false;
    (async () => {
      setSearchError(null);
      setGeoCenter(null);
      setDistanceByKey({});
      if (!areaQuery.trim()) {
        setAreaFiltered(null);
        return;
      }
      setSearching(true);
      try {
        // Fuzzy match within filteredHotels in the selected city
        const addressPool: string[] = [];
        const addressToHotelKey = new Map<string, string>();
        const keyToHotel = new Map<string, RecommendedHotel>();
        for (const h of filteredHotels) {
          const addr = h.address || '';
          const city = h.city || '';
          const combos = [addr, city].filter(Boolean);
          const key = `${h.name}__${h.city}`;
          keyToHotel.set(key, h);
          for (const c of combos) {
            addressPool.push(c);
            addressToHotelKey.set(c, key);
          }
        }

        const matches = getCloseMatches(areaQuery, addressPool, 10, 0.6);
        if (matches.length > 0) {
          const uniqKeys = Array.from(new Set(matches.map((m) => addressToHotelKey.get(m)).filter(Boolean))) as string[];
          const matchedHotels = uniqKeys.map((k) => keyToHotel.get(k as string)!).filter(Boolean).slice(0, 5);
          if (!cancel) {
            setAreaFiltered(matchedHotels);
            setSearching(false);
          }
          return;
        }

        // Geocode fallback
        const q = selectedCity && selectedCity !== 'all' ? `${areaQuery}, ${selectedCity}` : areaQuery;
        const center = await geocodeNominatim(q);
        if (!center) {
          if (!cancel) {
            setAreaFiltered(filteredHotels.slice(0, 5));
            setSearchError('No exact match found; showing top results.');
            setSearching(false);
          }
          return;
        }

        // Compute distances and pick nearest 5
        const distances: Record<string, number> = {};
        const withDist = filteredHotels
          .map((h) => {
            const key = `${h.name}-${h.city}`;
            const d = haversineDistance(center, { lat: h.coordinates.lat, lng: h.coordinates.lng });
            distances[key] = d;
            return { h, d };
          })
          .sort((a, b) => a.d - b.d)
          .slice(0, 5)
          .map((x) => x.h);

        if (!cancel) {
          setGeoCenter(center);
          setDistanceByKey(distances);
          setAreaFiltered(withDist);
          setSearching(false);
        }
      } catch (e) {
        if (!cancel) {
          setAreaFiltered(filteredHotels.slice(0, 5));
          setSearchError('Search failed; showing defaults.');
          setSearching(false);
        }
      }
    })();
    return () => { cancel = true; };
  }, [areaQuery, filteredHotels, selectedCity]);

  // Keep the input synced to the last executed query (useful after searches)
  useEffect(() => {
    setAreaInput(areaQuery);
  }, [areaQuery]);

  // Sort hotels (falls back to filteredHotels when no area search)
  const baseHotels = areaFiltered ?? filteredHotels;
  const sortedHotels = useMemo(() => {
    return [...baseHotels].sort((a, b) => {
      switch (sortBy) {
        case 'ai_score':
          return b.overall_score - a.overall_score;
        case 'price':
          return (a.price_range || 2500) - (b.price_range || 2500);
        case 'rating':
          const ratingsA = Object.values(a.platform_ratings).map(pr => pr?.rating).filter((v): v is number => typeof v === 'number');
          const ratingsB = Object.values(b.platform_ratings).map(pr => pr?.rating).filter((v): v is number => typeof v === 'number');
          const avgRatingA = ratingsA.length ? ratingsA.reduce((s, v) => s + v, 0) / ratingsA.length : 0;
          const avgRatingB = ratingsB.length ? ratingsB.reduce((s, v) => s + v, 0) / ratingsB.length : 0;
          return avgRatingB - avgRatingA;
        case 'avg_customer': {
          const avgA = (a.average_platform_rating ?? (() => {
            const vals = Object.values(a.platform_ratings).map(pr => pr?.rating).filter((v): v is number => typeof v === 'number');
            return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
          })());
          const avgB = (b.average_platform_rating ?? (() => {
            const vals = Object.values(b.platform_ratings).map(pr => pr?.rating).filter((v): v is number => typeof v === 'number');
            return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
          })());
          return (avgB || 0) - (avgA || 0);
        }
        case 'star':
          return (b.hotel_star_rating || 0) - (a.hotel_star_rating || 0);
        case 'address_az': {
          const aAddr = (a.address || a.city || a.name || '').toString();
          const bAddr = (b.address || b.city || b.name || '').toString();
          return aAddr.localeCompare(bAddr);
        }
        case 'distance': {
          const keyA = `${a.name}-${a.city}`;
          const keyB = `${b.name}-${b.city}`;
          const da = distanceByKey[keyA] ?? Number.POSITIVE_INFINITY;
          const db = distanceByKey[keyB] ?? Number.POSITIVE_INFINITY;
          return da - db;
        }
        default:
          return 0;
      }
    });
  }, [baseHotels, sortBy, distanceByKey]);

  const getPersonaIcon = (persona: TravelerPersona) => {
    switch (persona) {
      case 'Family': return <Users className="w-5 h-5" />;
      case 'Business': return <Briefcase className="w-5 h-5" />;
      case 'Luxury': return <Star className="w-5 h-5" />;
      case 'Solo': return <User className="w-5 h-5" />;
      case 'Couple': return <Heart className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const getPersonaColor = (persona: TravelerPersona) => {
    switch (persona) {
      case 'Family': return 'from-green-500 to-emerald-600';
      case 'Business': return 'from-blue-500 to-indigo-600';
      case 'Luxury': return 'from-purple-500 to-pink-600';
      case 'Solo': return 'from-orange-500 to-red-600';
      case 'Couple': return 'from-pink-500 to-rose-600';
      default: return 'from-blue-500 to-indigo-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                ←
              </button>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full bg-gradient-to-r ${getPersonaColor(persona)} text-white`}>
                  {getPersonaIcon(persona)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Perfect for {persona} Travelers
                    {selectedCity && selectedCity !== 'all' && (
                      <span className="text-gray-600"> in {selectedCity}</span>
                    )}
                  </h1>
                  <p className="text-sm text-gray-600">
                  {sortedHotels.length} AI-curated hotels found
                </p>
              </div>
            </div>
            </div>
            {/* Right: Search + Controls */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="text"
                  aria-label="Search area or landmark"
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setAreaQuery(areaInput.trim());
                    }
                  }}
                  placeholder="Search area/place (e.g., Connaught Place)"
                  className="w-64 sm:w-96 md:w-[36rem] px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {areaQuery && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    {searching ? 'Searching…' : geoCenter ? 'Nearest' : 'Fuzzy'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setAreaQuery(areaInput.trim())}
                disabled={searching}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-full shadow-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <SearchIcon className="w-4 h-4" />
                <span>Search</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              <button
                onClick={() => setShowMap(!showMap)}
                className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
              >
                <MapPin className="w-4 h-4" />
                <span>{showMap ? 'List' : 'Map'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters Sidebar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed left-0 top-20 bottom-0 w-80 bg-white/95 backdrop-blur-lg border-r border-white/20 z-40 overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              
              {/* Price Filter */}
              <PriceFilter selectedRange={selectedPriceRange} onRangeSelect={setSelectedPriceRange} />

              {/* Sort Options */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Sort By</h4>
                <div className="space-y-2">
                  {[
                    { value: 'ai_score', label: 'AI Score' },
                    { value: 'price', label: 'Price (Low to High)' },
                    { value: 'rating', label: 'Customer Rating (legacy)' },
                    { value: 'avg_customer', label: 'Average Customer Rating' },
                    { value: 'star', label: 'Hotel Star Rating' },
                    { value: 'address_az', label: 'Address (A–Z)' },
                    ...(areaFiltered || geoCenter ? [{ value: 'distance', label: 'Distance (Nearest)' }] as const : []),
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as any)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        sortBy === option.value
                          ? 'bg-orange-100 text-orange-700 border border-orange-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Address/Area helper note */}
              <div className="text-xs text-gray-500">
                Tip: Type a landmark or area to see the 5 nearest hotels. Typos are handled automatically.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${showFilters ? 'ml-80' : ''}`}>
        {showMap ? (
          <InteractiveMap hotels={sortedHotels} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* AI Insights */}
            <AIInsights persona={persona} city={selectedCity} />

            {areaQuery && (
              <div className="mt-2 mb-4 text-sm text-gray-600">
                Showing top 5 hotels near <span className="font-medium text-gray-800">{areaQuery}</span>
                {geoCenter && (
                  <span> • sorted by nearest</span>
                )}
                {searchError && (
                  <span className="text-red-500"> • {searchError}</span>
                )}
              </div>
            )}

            {/* Hotels Grid */}
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {sortedHotels.map((hotel, index) => (
                  <motion.div
                    key={hotel.name}
                    layout
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <HotelCard hotel={hotel} index={index} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {sortedHotels.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="text-gray-400 mb-4">
                  <MapPin className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No hotels found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your filters or selecting a different city
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Floating Chatbot */}
      <Chatbot persona={persona} city={selectedCity} />
    </div>
  );
};

export default RecommendationsScreen;