import { useState, useEffect } from 'react';
import { TravelerPersona, RecommendedHotel } from '../types/hotel';
import { recommendationEngine } from '../services/RecommendationEngine';
import recommendationsData from '../data/recommendations.json';

export const useAI = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedHotel[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [isEngineReady, setIsEngineReady] = useState(false);

  useEffect(() => {
    // Initialize the recommendation engine
    const initEngine = async () => {
      try {
        await recommendationEngine.initialize();
        setIsEngineReady(true);
      } catch (error) {
        console.error('Failed to initialize AI engine:', error);
        // Fallback to static data if AI engine fails
        setIsEngineReady(false);
      }
    };

    initEngine();
  }, []);

  const analyzePreferences = async (
    persona: TravelerPersona,
    city: string,
    preferences: string[] = [],
    options?: {
      priceMin?: number;
      priceMax?: number;
      starRatings?: number[];
      avgRatingMin?: number;
      avgRatingMax?: number;
      area?: string;
      extraRequirements?: string;
    }
  ) => {
    setIsAnalyzing(true);
    
    try {
      if (isEngineReady) {
        // Use AI recommendation engine
        const result = await recommendationEngine.generateRecommendations(persona, city, preferences, options);

        // Normalize platform ratings keys from engine (e.g., 'Booking.com') to app keys
        const normalizePlatforms = (platforms: Record<string, { rating: number; reviews_count: number }>) => {
          const get = (k: string) => platforms?.[k];
          return {
            Google: get('Google') || undefined,
            Booking: get('Booking.com') || get('Booking') || undefined,
            MakeMyTrip: get('MakeMyTrip') || undefined,
            TripAdvisor: get('TripAdvisor') || undefined,
            Agoda: get('Agoda') || undefined,
            Goibibo: get('Goibibo') || undefined,
            Expedia: get('Expedia') || undefined,
          };
        };

        // Helper to compute average of platform ratings
        const avgPlatform = (platforms: Record<string, { rating: number; reviews_count: number }>) => {
          const vals = Object.values(platforms || {})
            .map(v => v?.rating)
            .filter((v): v is number => typeof v === 'number');
          return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined;
        };

        // Convert to RecommendedHotel format
        const aiRecommendations: RecommendedHotel[] = result.hotels.map(hotel => ({
          name: hotel.name,
          city: hotel.city,
          // Use Unsplash Source for a deterministic, no-key image by city/topic
          image: `https://source.unsplash.com/800x600/?hotel,${encodeURIComponent(hotel.city)}`,
          overall_score: hotel.confidenceScore,
          price_range: hotel.priceRange,
          address: hotel.address,
          hotel_star_rating: hotel.starRating,
          room_type: hotel.roomType,
          review_summary: hotel.reviewSummary,
          facilities_brief: hotel.facilitiesBrief,
          features: [
            { name: 'cleanliness', score: Math.round(hotel.averageScore * 10) },
            { name: 'location', score: Math.round((hotel.averageScore + Math.random() * 2 - 1) * 10) },
            { name: 'service', score: Math.round((hotel.averageScore + Math.random() * 1.5 - 0.75) * 10) },
            { name: 'value', score: Math.round((hotel.averageScore + Math.random() * 1 - 0.5) * 10) },
            { name: 'facilities', score: Math.round((hotel.averageScore + Math.random() * 1.2 - 0.6) * 10) }
          ],
          badges: hotel.tags.slice(0, 3),
          platform_ratings: normalizePlatforms(hotel.platformRatings || {}),
          average_platform_rating: avgPlatform(normalizePlatforms(hotel.platformRatings || {})),
          booking_links: {
            Google: `https://www.google.com/travel/hotels/entity?q=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`,
            Booking: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`,
            MakeMyTrip: `https://www.makemytrip.com/hotels/hotel-listing/?searchText=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`,
            TripAdvisor: `https://www.tripadvisor.in/Search?q=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`
          },
          coordinates: hotel.coordinates
        }));

        setRecommendations(aiRecommendations);
        setInsights(result.insights);
      } else {
        // Fallback to static data
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const personaRecommendations = recommendationsData[persona] || [];
        const filteredRecommendations = city && city !== 'all'
          ? personaRecommendations.filter(hotel => 
              hotel.city.toLowerCase() === city.toLowerCase()
            )
          : personaRecommendations;

        // Normalize static data platform_ratings (numbers) to objects
        const normalized: RecommendedHotel[] = filteredRecommendations.map((h: any) => ({
          ...h,
          image: `https://source.unsplash.com/800x600/?hotel,${encodeURIComponent(h.city || '')}`,
          platform_ratings: {
            Google: typeof h.platform_ratings?.Google === 'number' ? { rating: h.platform_ratings.Google, reviews_count: 0 } : h.platform_ratings?.Google,
            Booking: typeof h.platform_ratings?.Booking === 'number' ? { rating: h.platform_ratings.Booking, reviews_count: 0 } : h.platform_ratings?.Booking,
            MakeMyTrip: typeof h.platform_ratings?.MakeMyTrip === 'number' ? { rating: h.platform_ratings.MakeMyTrip, reviews_count: 0 } : h.platform_ratings?.MakeMyTrip,
            TripAdvisor: typeof h.platform_ratings?.TripAdvisor === 'number' ? { rating: h.platform_ratings.TripAdvisor, reviews_count: 0 } : h.platform_ratings?.TripAdvisor,
            Agoda: typeof h.platform_ratings?.Agoda === 'number' ? { rating: h.platform_ratings.Agoda, reviews_count: 0 } : h.platform_ratings?.Agoda,
            Goibibo: typeof h.platform_ratings?.Goibibo === 'number' ? { rating: h.platform_ratings.Goibibo, reviews_count: 0 } : h.platform_ratings?.Goibibo,
            Expedia: typeof h.platform_ratings?.Expedia === 'number' ? { rating: h.platform_ratings.Expedia, reviews_count: 0 } : h.platform_ratings?.Expedia,
          },
          average_platform_rating: (() => {
            const vals = Object.values(h.platform_ratings || {})
              .map((v: any) => (typeof v === 'number' ? v : v?.rating))
              .filter((v: any): v is number => typeof v === 'number');
            return vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : undefined;
          })()
        }));

        setRecommendations(normalized);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      // Fallback to static data on error
      const personaRecommendations = recommendationsData[persona] || [];
      const filteredRecommendations = city && city !== 'all'
        ? personaRecommendations.filter(hotel => 
            hotel.city.toLowerCase() === city.toLowerCase()
          )
        : personaRecommendations;

      const normalized: RecommendedHotel[] = filteredRecommendations.map((h: any) => ({
        ...h,
        image: `https://source.unsplash.com/800x600/?hotel,${encodeURIComponent(h.city || '')}`,
        platform_ratings: {
          Google: typeof h.platform_ratings?.Google === 'number' ? { rating: h.platform_ratings.Google, reviews_count: 0 } : h.platform_ratings?.Google,
          Booking: typeof h.platform_ratings?.Booking === 'number' ? { rating: h.platform_ratings.Booking, reviews_count: 0 } : h.platform_ratings?.Booking,
          MakeMyTrip: typeof h.platform_ratings?.MakeMyTrip === 'number' ? { rating: h.platform_ratings.MakeMyTrip, reviews_count: 0 } : h.platform_ratings?.MakeMyTrip,
          TripAdvisor: typeof h.platform_ratings?.TripAdvisor === 'number' ? { rating: h.platform_ratings.TripAdvisor, reviews_count: 0 } : h.platform_ratings?.TripAdvisor,
          Agoda: typeof h.platform_ratings?.Agoda === 'number' ? { rating: h.platform_ratings.Agoda, reviews_count: 0 } : h.platform_ratings?.Agoda,
          Goibibo: typeof h.platform_ratings?.Goibibo === 'number' ? { rating: h.platform_ratings.Goibibo, reviews_count: 0 } : h.platform_ratings?.Goibibo,
          Expedia: typeof h.platform_ratings?.Expedia === 'number' ? { rating: h.platform_ratings.Expedia, reviews_count: 0 } : h.platform_ratings?.Expedia,
        },
        average_platform_rating: (() => {
          const vals = Object.values(h.platform_ratings || {})
            .map((v: any) => (typeof v === 'number' ? v : v?.rating))
            .filter((v: any): v is number => typeof v === 'number');
          return vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : undefined;
        })()
      }));

      setRecommendations(normalized);
    } finally {
      setIsAnalyzing(false);
    }
    
    return recommendations;
  };

  const generateInsights = (persona: TravelerPersona) => {
    if (insights) {
      return {
        keyFactors: insights.topFeatures,
        sentiment: `${insights.totalAnalyzed} hotels analyzed with ${insights.averageRating} average rating`,
        recommendation: `Based on ${insights.cityStats.hotelCount} hotels in ${insights.cityStats.name}`
      };
    }

    // Fallback insights
    const fallbackInsights = {
      Family: {
        keyFactors: ['Safety', 'Kid-friendly amenities', 'Space'],
        sentiment: 'Families prioritize safety and entertainment for children',
        recommendation: 'Look for hotels with pools, play areas, and family rooms'
      },
      Business: {
        keyFactors: ['WiFi quality', 'Meeting facilities', 'Location'],
        sentiment: 'Business travelers value efficiency and connectivity',
        recommendation: 'Choose hotels near business districts with work amenities'
      },
      Luxury: {
        keyFactors: ['Service quality', 'Amenities', 'Exclusivity'],
        sentiment: 'Luxury travelers expect exceptional service and unique experiences',
        recommendation: 'Premium hotels with spa, fine dining, and personalized service'
      },
      Solo: {
        keyFactors: ['Safety', 'Location', 'Value'],
        sentiment: 'Solo travelers prioritize safety and central locations',
        recommendation: 'Well-located hotels with good security and social spaces'
      },
      Couple: {
        keyFactors: ['Romance', 'Privacy', 'Ambiance'],
        sentiment: 'Couples seek romantic settings and intimate experiences',
        recommendation: 'Hotels with romantic dining, spa services, and scenic views'
      }
    };

    return fallbackInsights[persona];
  };

  return {
    isAnalyzing,
    recommendations,
    insights,
    isEngineReady,
    analyzePreferences,
    generateInsights
  };
};