import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import { RecommendedHotel } from '../types/hotel';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getCachedHotelImage, getCachedUrl } from '../services/serpApi';

interface InteractiveMapProps {
  hotels: RecommendedHotel[];
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ hotels }) => {
  // Prefetch images for listed hotels to avoid empty images on first hover
  React.useEffect(() => {
    (async () => {
      for (const hotel of hotels) {
        const hotelKey = `${hotel.name}-${hotel.city}`;
        const q = hotel.address ? `${hotel.name} ${hotel.address}` : `${hotel.name} ${hotel.city}`;
        const existing = getCachedUrl(hotelKey);
        if (existing) continue;
        await getCachedHotelImage(hotelKey, q);
      }
    })();
  }, [hotels]);

  const getRating = (hotel: RecommendedHotel) => {
    const g = hotel.platform_ratings?.Google?.rating;
    if (typeof g === 'number') return g;
    const vals = Object.values(hotel.platform_ratings || {})
      .map((v: any) => v?.rating)
      .filter((n: any) => typeof n === 'number');
    return vals.length ? (vals.reduce((s: number, v: number) => s + v, 0) / vals.length) : undefined;
  };

  const center = hotels[0]?.coordinates ?? { lat: 22.9734, lng: 78.6569 };

  const FitBounds: React.FC = () => {
    const map = useMap();
    React.useEffect(() => {
      if (hotels.length > 1) {
        const b = L.latLngBounds(hotels.filter(h => h.coordinates).map(h => [h.coordinates.lat, h.coordinates.lng] as [number, number]));
        if (b.isValid()) map.fitBounds(b, { padding: [30, 30] });
      } else {
        map.setView([center.lat, center.lng], 12);
      }
    }, [map, hotels]);
    return null;
  };

  // City stats (retain UI from old map)
  const hotelsByCity = hotels.reduce((acc, hotel) => {
    if (!acc[hotel.city]) acc[hotel.city] = [];
    acc[hotel.city].push(hotel);
    return acc;
  }, {} as Record<string, RecommendedHotel[]>);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Interactive Map</h2>
        <p className="text-gray-600">Hover markers to preview hotel details</p>
      </div>

      <div className="relative w-full max-w-6xl mx-auto">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={hotels.length > 1 ? 6 : 12}
          className="w-full h-96 rounded-xl border border-gray-200"
          scrollWheelZoom
          style={{ height: '24rem' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <FitBounds />

          {hotels.map((hotel) => (
            <CircleMarker
              key={`${hotel.name}-${hotel.city}`}
              center={[hotel.coordinates.lat, hotel.coordinates.lng]}
              radius={8}
              pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.85 }}
              eventHandlers={{
                mouseover: async (e: L.LeafletMouseEvent) => {
                  const layer = e.target as L.CircleMarker;
                  // Ensure popup content is set and opened
                  const hotelKey = `${hotel.name}-${hotel.city}`;
                  const currentImg = getCachedUrl(hotelKey) ?? hotel.image ?? '/placeholder-hotel.svg';
                  const rating = getRating(hotel);
                  const html = `
                    <div style="display:flex; gap:12px; align-items:center; max-width:320px;">
                      <img src="${currentImg}" alt="${hotel.name}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid #eee;" />
                      <div>
                        <div style="font-weight:600;color:#111827;">${hotel.name}</div>
                        <div style="color:#6b7280;font-size:12px;">${hotel.city}${hotel.address ? ' • ' + hotel.address : ''}</div>
                        ${rating ? `<div style=\"margin-top:4px;color:#111827;font-size:13px;\">⭐ ${rating.toFixed(1)}</div>` : ''}
                      </div>
                    </div>`;
                  layer.bindPopup(html, { closeButton: true }).openPopup();

                  const existing = getCachedUrl(hotelKey);
                  if (!existing) {
                    const q = hotel.address ? `${hotel.name} ${hotel.address}` : `${hotel.name} ${hotel.city}`;
                    const fetched = await getCachedHotelImage(hotelKey, q);
                    const updatedImg = fetched ?? currentImg;
                    const updatedHtml = `
                      <div style="display:flex; gap:12px; align-items:center; max-width:320px;">
                        <img src="${updatedImg}" alt="${hotel.name}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid #eee;" />
                        <div>
                          <div style="font-weight:600;color:#111827;">${hotel.name}</div>
                          <div style="color:#6b7280;font-size:12px;">${hotel.city}${hotel.address ? ' • ' + hotel.address : ''}</div>
                          ${rating ? `<div style=\"margin-top:4px;color:#111827;font-size:13px;\">⭐ ${rating.toFixed(1)}</div>` : ''}
                        </div>
                      </div>`;
                    layer.setPopupContent(updatedHtml);
                  }
                },
              }}
            />
          ))}
        </MapContainer>

        {/* City Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(hotelsByCity).map(([city, cityHotels]) => (
            <motion.div
              key={city}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-orange-50 to-pink-50 p-4 rounded-xl border border-orange-100 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-orange-600">
                  {cityHotels.length} hotels
                </span>
              </div>
              <h3 className="font-semibold text-gray-800">{city}</h3>
              <div className="flex items-center mt-2">
                <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                <span className="text-sm text-gray-600">
                  Avg: {(cityHotels.reduce((sum, h) => sum + h.overall_score, 0) / cityHotels.length).toFixed(1)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};