'use client';

import { useState, useEffect } from 'react';
import { MapPin, Star, ChevronDown, ChevronUp, Compass } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

interface Attraction {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  photos?: string[];
  vicinity?: string;
  category: string;
}

interface NearbyAttractionsProps {
  destination: { lat: number; lng: number; address: string } | null;
}

export default function NearbyAttractions({ destination }: NearbyAttractionsProps) {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (destination) {
      fetchAttractions();
    }
  }, [destination]);

  const fetchAttractions = async () => {
    if (!destination) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5001/api/v1/attractions/nearby?lat=${destination.lat}&lng=${destination.lng}&radius=500`
      );
      const data = await response.json();
      if (data.success) {
        setAttractions(data.data || []);
      }
    } catch (error) {
      console.error('[NearbyAttractions] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!destination) return null;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Turistik Yer': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'Müze': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      'Park': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'Restoran': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      'Kafe': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Alışveriş Merkezi': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
  };

  // Helper function to get Google Place Photo URL
  const getPhotoUrl = (photoRef: string, maxWidth: number = 400) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoRef}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
  };

  return (
    <Card variant="glass" className="p-6 animate-scale-in h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
            Çevredeki Gezilecek Yerler
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Varış noktanız yakınında
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Gezilecek yerler yükleniyor...</p>
          </div>
        ) : attractions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <MapPin className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">Yakında gezilecek yer bulunamadı</p>
            <p className="text-xs mt-1">Varış noktası seçildiğinde öneriler gösterilecek</p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-2 h-full" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
            {attractions.map((attraction, index) => (
              <div
                key={attraction.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${attraction.location.lat},${attraction.location.lng}`,
                    '_blank'
                  );
                }}
              >
                {/* Image */}
                {attraction.photos && attraction.photos.length > 0 ? (
                  <div className="relative h-40 w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <img
                      src={getPhotoUrl(attraction.photos[0])}
                      alt={attraction.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {attraction.rating && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 dark:bg-gray-900/95 px-2.5 py-1.5 rounded-lg shadow-lg backdrop-blur-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {attraction.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative h-40 w-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-purple-300 dark:text-purple-700" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {attraction.name}
                  </h4>

                  {attraction.vicinity && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {attraction.vicinity}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${getCategoryColor(
                        attraction.category
                      )}`}
                    >
                      {attraction.category}
                    </span>
                    {attraction.userRatingsTotal && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {attraction.userRatingsTotal} değerlendirme
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
