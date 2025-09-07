import Papa from 'papaparse';
import Fuse from 'fuse.js';

export interface HotelData {
  address: string;
  city: string;
  country: string;
  crawl_date: string;
  hotel_description: string;
  hotel_facilities: string;
  hotel_star_rating: string;
  image_count: number;
  latitude: number;
  longitude: number;
  pageurl: string;
  property_id: number;
  property_name: string;
  property_type: string;
  qts: string;
  room_count: number;
  room_type: string;
  special_tag: string;
  state: string;
  uniq_id: string;
  customer_segment: string;
  reviews_from_different_sites: string;
  price: number;
  top_positive_review: string;
  top_negative_review: string;
  average_rating: number;
  reviews_summary: string; // JSON string with platform ratings & counts
}

export interface AggregatedHotel {
  name: string;
  address: string;
  city: string;
  country?: string;
  averageScore: number;
  totalReviews: number;
  positiveWordCount: number;
  negativeWordCount: number;
  tags: string[];
  reviews: string[];
  confidenceScore: number;
  priceRange: number;
  coordinates: { lat: number; lng: number };
  platformRatings: Record<string, { rating: number; reviews_count: number }>; // e.g., Booking.com, TripAdvisor
  starRating?: number;
  roomType?: string;
  facilitiesBrief?: string;
  reviewSummary?: string;
}

export interface RecommendationResult {
  hotels: AggregatedHotel[];
  insights: {
    totalAnalyzed: number;
    averageRating: number;
    topFeatures: string[];
    cityStats: {
      name: string;
      hotelCount: number;
      avgRating: number;
    };
  };
}

class RecommendationEngine {
  private hotelData: HotelData[] = [];
  private aggregatedHotels: AggregatedHotel[] = [];
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load and parse CSV data
      await this.loadHotelData();
      
      // Aggregate hotel data
      this.aggregateHotelData();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize recommendation engine:', error);
      throw error;
    }
  }

  private async loadHotelData() {
    try {
      // Load the new dataset from the public root. Make sure hotels_clean.csv is under project/public/.
      // Use Vite's BASE_URL to work in both dev and production (non-root deployments).
      const base = (import.meta as any)?.env?.BASE_URL || '/';
      const path = base.endsWith('/') ? `${base}hotels_clean.csv` : `${base}/hotels_clean.csv`;
      const resp = await fetch(path);
      if (!resp.ok) throw new Error(`Failed to fetch hotels_clean.csv: ${resp.status}`);
      const csvText = await resp.text();

      const result = Papa.parse<HotelData>(csvText, {
        header: true,
        skipEmptyLines: true,
        transform: (value: string, field: string) => {
          // Numeric coercion for known numeric fields
          const numericFields = new Set([
            'image_count', 'latitude', 'longitude', 'property_id', 'room_count', 'price', 'average_rating'
          ]);
          if (numericFields.has(field)) {
            return parseFloat(value) || 0;
          }
          return value;
        }
      });

      this.hotelData = result.data.filter((d: HotelData) => d && (d as any).property_name);
    } catch (error) {
      console.error('Failed to load hotel data:', error);
      // Fallback to empty array if CSV loading fails
      this.hotelData = [];
    }
  }

  private aggregateHotelData() {
    // Each row already represents a property; parse tags from facilities and reviews
    this.aggregatedHotels = this.hotelData.map((row) => {
      const name = row.property_name;
      const address = row.address;
      const city = row.city || this.extractCityFromAddress(address);

      // Parse platform ratings JSON (prefer reviews_summary which is valid JSON string)
      let platformRatings: Record<string, { rating: number; reviews_count: number }> = {};
      const raw = row.reviews_summary?.trim() || '';
      if (raw) {
        try {
          platformRatings = JSON.parse(raw);
        } catch {
          // Attempt to fix single-quoted dict from reviews_from_different_sites
          try {
            const repaired = (row.reviews_from_different_sites || '').replace(/'/g, '"');
            platformRatings = JSON.parse(repaired);
          } catch {
            platformRatings = {};
          }
        }
      }

      const totalReviews = Object.values(platformRatings).reduce((s: number, p: any) => s + (p?.reviews_count || 0), 0);
      const avgScore = row.average_rating || this.computeWeightedAverage(platformRatings);

      const tags = new Set<string>();
      // Split facilities by delimiters
      if (row.hotel_facilities) {
        row.hotel_facilities.split(/[•|]/).forEach((t) => {
          const tag = t.trim();
          if (tag) tags.add(tag.toLowerCase());
        });
      }

      const reviews: string[] = [];
      if (row.top_positive_review) reviews.push(row.top_positive_review.trim());
      if (row.top_negative_review) reviews.push(row.top_negative_review.trim());

      const confidenceScore = this.calculateConfidenceScore(avgScore, totalReviews, 1, 0);
      const priceRange = row.price && row.price > 0 ? row.price : this.estimatePriceRange(tags, avgScore, address);
      const starRating = parseInt((row.hotel_star_rating || '').toString().replace(/[^0-9]/g, '')) || undefined;
      const facilitiesBrief = (row.hotel_facilities || '').split(/[•|]/).map(s => s.trim()).filter(Boolean).slice(0, 6).join(', ');
      const reviewSummary = this.buildSimpleReviewSummary(row.top_positive_review, row.top_negative_review);

      return {
        name,
        address,
        city,
        country: row.country,
        averageScore: avgScore,
        totalReviews: totalReviews,
        positiveWordCount: 1,
        negativeWordCount: 0,
        tags: Array.from(tags).slice(0, 10),
        reviews: reviews,
        confidenceScore,
        priceRange,
        coordinates: this.getCoordinatesForRow(row, city),
        platformRatings,
        starRating,
        roomType: row.room_type || undefined,
        facilitiesBrief,
        reviewSummary
      };
    });
  }

  private extractCityFromAddress(address: string): string {
    const cityPatterns = [
      /New Delhi|Delhi/i,
      /Mumbai/i,
      /Bangalore/i,
      /Chennai/i,
      /Kolkata/i,
      /Jaipur/i,
      /Goa/i,
      /Hyderabad/i,
      /Pune/i,
      /Agra/i
    ];

    for (const pattern of cityPatterns) {
      const match = address.match(pattern);
      if (match) {
        return match[0].replace(/New Delhi/i, 'Delhi');
      }
    }

    return 'Delhi'; // Default fallback
  }

  private calculateConfidenceScore(
    avgScore: number, 
    totalReviews: number, 
    positiveWords: number, 
    negativeWords: number
  ): number {
    // Weighted confidence score
    const reviewWeight = Math.log(totalReviews + 1) / 10;
    const sentimentRatio = positiveWords / (positiveWords + negativeWords + 1);
    const baseScore = avgScore / 10;
    
    return Math.min(100, Math.round((baseScore * 0.5 + reviewWeight * 0.3 + sentimentRatio * 0.2) * 100));
  }

  private estimatePriceRange(tags: Set<string>, avgScore: number, address: string): number {
    const tagArray = Array.from(tags).join(' ').toLowerCase();
    const addressLower = address.toLowerCase();
    
    // Luxury indicators
    if (tagArray.includes('luxury') || tagArray.includes('palace') || 
        tagArray.includes('oberoi') || tagArray.includes('taj') ||
        addressLower.includes('palace') || avgScore > 9.0) {
      return Math.floor(Math.random() * 3000) + 4000; // 4000-7000
    }
    
    // Premium indicators
    if (tagArray.includes('business') || tagArray.includes('spa') || 
        avgScore > 8.5) {
      return Math.floor(Math.random() * 1000) + 2500; // 2500-3500
    }
    
    // Mid-range
    if (avgScore > 7.5) {
      return Math.floor(Math.random() * 1000) + 1500; // 1500-2500
    }
    
    // Budget
    return Math.floor(Math.random() * 500) + 800; // 800-1300
  }

  private getCoordinatesForCity(city: string): { lat: number; lng: number } {
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      'Delhi': { lat: 28.6139, lng: 77.2090 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Bangalore': { lat: 12.9716, lng: 77.5946 },
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Kolkata': { lat: 22.5726, lng: 88.3639 },
      'Jaipur': { lat: 26.9124, lng: 75.7873 },
      'Goa': { lat: 15.2993, lng: 74.1240 },
      'Hyderabad': { lat: 17.3850, lng: 78.4867 },
      'Pune': { lat: 18.5204, lng: 73.8567 },
      'Agra': { lat: 27.1767, lng: 78.0081 }
    };

    return cityCoords[city] || cityCoords['Delhi'];
  }

  private getCoordinatesForRow(row: HotelData, city: string): { lat: number; lng: number } {
    if (row.latitude && row.longitude) {
      return { lat: Number(row.latitude), lng: Number(row.longitude) };
    }
    return this.getCoordinatesForCity(city);
  }

  private computeWeightedAverage(platformRatings: Record<string, { rating: number; reviews_count: number }>): number {
    const entries = Object.values(platformRatings).filter(Boolean);
    if (!entries.length) return 0;
    const total = entries.reduce((acc, p) => acc + (p.rating || 0) * (p.reviews_count || 0), 0);
    const count = entries.reduce((acc, p) => acc + (p.reviews_count || 0), 0);
    return count ? total / count : (entries.reduce((a, p) => a + (p.rating || 0), 0) / entries.length);
  }

  async generateRecommendations(
    persona: string,
    city: string,
    preferences: string[] = [],
    options?: {
      priceMin?: number;
      priceMax?: number;
      starRatings?: number[]; // [2,3,5]
      avgRatingMin?: number;
      avgRatingMax?: number;
      area?: string; // preferred area/address fragment
      extraRequirements?: string; // free-text requirements
    }
  ): Promise<RecommendationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Filter hotels by city (exact match or present in address)
    let candidateHotels = this.aggregatedHotels;
    if (city && city !== 'all') {
      const cityLower = city.toLowerCase();
      const byExact = this.aggregatedHotels.filter(hotel => hotel.city.toLowerCase() === cityLower);
      const byAddress = this.aggregatedHotels.filter(hotel => hotel.address?.toLowerCase().includes(cityLower));
      // Merge unique
      const map: Record<string, boolean> = {};
      candidateHotels = [...byExact, ...byAddress].filter(h => {
        const key = `${h.name}|${h.address}`;
        if (map[key]) return false;
        map[key] = true;
        return true;
      });
      // If still none, fall back to all
      if (candidateHotels.length === 0) candidateHotels = this.aggregatedHotels;
    }

    // Apply additional filters: price, stars, avg rating
    if (options) {
      const {
        priceMin, priceMax, starRatings, avgRatingMin, avgRatingMax, area
      } = options;
      if (typeof priceMin === 'number' && typeof priceMax === 'number') {
        candidateHotels = candidateHotels.filter(h => h.priceRange >= priceMin && h.priceRange <= priceMax);
      }
      if (Array.isArray(starRatings) && starRatings.length) {
        const set = new Set(starRatings);
        candidateHotels = candidateHotels.filter(h => h.starRating && set.has(h.starRating));
      }
      if (typeof avgRatingMin === 'number' || typeof avgRatingMax === 'number') {
        candidateHotels = candidateHotels.filter(h => {
          const val = h.averageScore;
          if (typeof avgRatingMin === 'number' && val < avgRatingMin) return false;
          if (typeof avgRatingMax === 'number' && val > avgRatingMax) return false;
          return true;
        });
      }

      // Fuzzy area match (address/city/country). If matches exist, narrow candidates to them.
      if (area && area.trim()) {
        const areaFuse = new Fuse(candidateHotels, {
          keys: [
            { name: 'address', weight: 0.7 },
            { name: 'city', weight: 0.2 },
            { name: 'country', weight: 0.1 }
          ],
          threshold: 0.4,
          includeScore: true
        });
        const areaResults = areaFuse.search(area.trim());
        if (areaResults.length) {
          candidateHotels = areaResults.map(r => r.item);
        } else {
          // Geocode fallback and sort by distance
          const geo = await this.geocode(`${area}, ${city}`);
          if (geo) {
            const { lat, lng } = geo;
            candidateHotels = candidateHotels
              .map(h => ({ h, d: this.haversineKm(lat, lng, h.coordinates.lat, h.coordinates.lng) }))
              .sort((a, b) => a.d - b.d)
              .map(x => x.h);
          }
        }
      }
    }

    // Create search query based on persona, preferences, and extra requirements
    const searchQuery = this.buildSearchQuery(persona, [
      ...preferences,
      ...(options?.extraRequirements ? [options.extraRequirements] : [])
    ]);
    
    // Use Fuse.js for fuzzy search on tags and reviews
    const fuse = new Fuse(candidateHotels, {
      keys: [
        { name: 'tags', weight: 0.4 },
        { name: 'reviews', weight: 0.3 },
        { name: 'name', weight: 0.2 },
        { name: 'address', weight: 0.1 }
      ],
      threshold: 0.6,
      includeScore: true
    });

    const searchResults = fuse.search(searchQuery);
    
    // Score and rank hotels
    let scoredHotels = searchResults.map(result => {
      const hotel = result.item;
      const searchScore = 1 - (result.score || 0); // Convert distance to similarity
      const finalScore = this.calculateFinalScore(hotel, persona, searchScore);
      return { ...hotel, finalScore } as AggregatedHotel & { finalScore: number };
    });

    // Fallback: if Fuse returns no hits, rank by popularity (avg score + review volume)
    if (scoredHotels.length === 0) {
      scoredHotels = candidateHotels.map(hotel => {
        const reviewConfidence = Math.min(1, Math.log(hotel.totalReviews + 1) / 8);
        const popularity = (hotel.averageScore / 10) * 0.7 + reviewConfidence * 0.3;
        const finalScore = Math.round(popularity * 100);
        return { ...hotel, finalScore } as AggregatedHotel & { finalScore: number };
      });
    }

    // Sort by final score and take top 5
    const topHotels = scoredHotels
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 5);

    // Generate insights
    const insights = this.generateInsights(candidateHotels, city);

    return {
      hotels: topHotels,
      insights
    };
  }

  private buildSearchQuery(persona: string, preferences: string[]): string {
    const personaQueries = {
      'Family': 'family friendly kids children pool playground safe amenities',
      'Business': 'business meeting conference wifi executive professional',
      'Luxury': 'luxury premium spa fine dining exceptional service',
      'Solo': 'safe secure central location convenient transportation',
      'Couple': 'romantic intimate spa dining views peaceful quiet'
    };

    const baseQuery = personaQueries[persona as keyof typeof personaQueries] || '';
    const preferencesQuery = preferences.join(' ');
    
    return `${baseQuery} ${preferencesQuery}`.trim();
  }

  private buildSimpleReviewSummary(pos?: string, neg?: string): string | undefined {
    const p = (pos || '').trim();
    const n = (neg || '').trim();
    if (!p && !n) return undefined;
    const pros = p ? `Guests appreciated ${this.truncateSentence(p)}` : '';
    const cons = n ? `Some mentioned ${this.truncateSentence(n)}` : '';
    return [pros, cons].filter(Boolean).join('. ') + (pros || cons ? '.' : '');
  }

  private truncateSentence(text: string, max = 140): string {
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }

  private async geocode(q: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
      const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!resp.ok) return null;
      const data: any[] = await resp.json();
      if (!data || !data.length) return null;
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch {
      return null;
    }
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateFinalScore(
    hotel: AggregatedHotel, 
    persona: string, 
    searchScore: number
  ): number {
    let score = 0;

    // Base score from average rating (40%)
    score += (hotel.averageScore / 10) * 0.4;

    // Search relevance (30%)
    score += searchScore * 0.3;

    // Review volume confidence (15%)
    const reviewConfidence = Math.min(1, Math.log(hotel.totalReviews + 1) / 8);
    score += reviewConfidence * 0.15;

    // Sentiment ratio (15%)
    const sentimentRatio = hotel.positiveWordCount / 
      (hotel.positiveWordCount + hotel.negativeWordCount + 1);
    score += sentimentRatio * 0.15;

    // Persona-specific bonuses
    score += this.getPersonaBonus(hotel, persona);

    return Math.round(score * 100);
  }

  private getPersonaBonus(hotel: AggregatedHotel, persona: string): number {
    const tags = hotel.tags.join(' ').toLowerCase();
    const reviews = hotel.reviews.join(' ').toLowerCase();
    
    const bonusKeywords = {
      'Family': ['family', 'kids', 'children', 'pool', 'playground'],
      'Business': ['business', 'meeting', 'conference', 'executive', 'wifi'],
      'Luxury': ['luxury', 'spa', 'fine', 'premium', 'exceptional'],
      'Solo': ['safe', 'secure', 'central', 'convenient', 'transport'],
      'Couple': ['romantic', 'intimate', 'peaceful', 'quiet', 'views']
    };

    const keywords = bonusKeywords[persona as keyof typeof bonusKeywords] || [];
    let bonus = 0;

    keywords.forEach(keyword => {
      if (tags.includes(keyword) || reviews.includes(keyword)) {
        bonus += 0.02; // 2% bonus per matching keyword
      }
    });

    return Math.min(bonus, 0.1); // Cap at 10% bonus
  }

  private generateInsights(
    hotels: AggregatedHotel[], 
    city: string
  ) {
    const totalAnalyzed = hotels.length;
    const averageRating = hotels.reduce((sum, h) => sum + h.averageScore, 0) / totalAnalyzed;
    
    // Extract top features from tags
    const allTags = hotels.flatMap(h => h.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topFeatures = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    return {
      totalAnalyzed,
      averageRating: Math.round(averageRating * 10) / 10,
      topFeatures,
      cityStats: {
        name: city,
        hotelCount: totalAnalyzed,
        avgRating: Math.round(averageRating * 10) / 10
      }
    };
  }

  async searchHotelsByCity(city: string): Promise<AggregatedHotel[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!city || city === 'all') {
      return this.aggregatedHotels;
    }

    return this.aggregatedHotels.filter(hotel => 
      hotel.city.toLowerCase() === city.toLowerCase()
    );
  }

  getAvailableCities(): string[] {
    const cities = [...new Set(this.aggregatedHotels.map(h => h.city))];
    return cities.sort();
  }
}

export const recommendationEngine = new RecommendationEngine();