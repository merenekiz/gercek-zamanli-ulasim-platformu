'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Navigation, X, Search } from 'lucide-react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import RouteResults from '@/components/route/RouteResults';
import { useAppDispatch } from '@/lib/store/hooks';
import { showToast } from '@/lib/store/slices/uiSlice';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/map/Map'), {
  ssr: false,
  loading: () => <div className="text-center text-gray-500">Harita yükleniyor...</div>
});

function FavoritesContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [favoriteRoutes, setFavoriteRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [mapPolylines, setMapPolylines] = useState<any[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    const storedFavorites = localStorage.getItem('favoriteRoutes');
    if (storedFavorites) {
      try {
        const favorites = JSON.parse(storedFavorites);
        setFavoriteRoutes(favorites);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Decode Google encoded polyline to array of [lat, lng] positions
  const decodePolyline = (encoded: string): [number, number][] => {
    const points: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      // Decode latitude
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      // Decode longitude
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push([lat / 1e5, lng / 1e5]);
    }

    return points;
  };

  // Transport mode color mapping for map polylines
  const transportModeMapColors: Record<string, string> = {
    BUS: '#3B82F6',
    METRO: '#EF4444',
    ANKARAY: '#F97316',
    WALKING: '#22C55E',
    TAXI: '#EAB308',
    RIDESHARE: '#A855F7',
    TRAM: '#8B5CF6',
  };

  const handleRouteSelect = (route: any) => {
    setSelectedRoute(route);

    // Update map markers
    const markers = [];
    if (route.origin) {
      markers.push({
        position: [route.origin.lat, route.origin.lng] as [number, number],
        popup: `<strong>Başlangıç:</strong><br>${route.origin.address}`,
      });
    }
    if (route.destination) {
      markers.push({
        position: [route.destination.lat, route.destination.lng] as [number, number],
        popup: `<strong>Varış:</strong><br>${route.destination.address}`,
      });
    }

    // Add polylines from segments
    const polylines: any[] = [];
    if (route.segments) {
      route.segments.forEach((segment: any) => {
        if (segment.polyline) {
          try {
            const positions = decodePolyline(segment.polyline);
            if (positions.length > 0) {
              const color = transportModeMapColors[segment.mode as string] || '#6B7280';
              const weight = segment.mode === 'WALKING' ? 3 : 5;
              polylines.push({
                positions,
                color,
                weight,
              });
            }
          } catch (error) {
            console.error('Error decoding polyline:', error);
          }
        }
      });
    }

    setMapMarkers(markers);
    setMapPolylines(polylines);

    dispatch(
      showToast({
        message: 'Rota haritada gösteriliyor',
        type: 'success',
      })
    );
  };

  const handleRemoveFromFavorites = (route: any) => {
    const updatedFavorites = favoriteRoutes.filter((fav) => fav.id !== route.id);
    setFavoriteRoutes(updatedFavorites);
    localStorage.setItem('favoriteRoutes', JSON.stringify(updatedFavorites));

    dispatch(
      showToast({
        message: 'Rota favorilerden çıkarıldı',
        type: 'success',
      })
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-500 via-red-600 to-pink-600 shadow-xl border-b border-white/10 sticky top-0 z-40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Heart className="w-7 h-7" />
                  Favori Rotalar
                </h1>
                <p className="text-red-100 text-sm mt-0.5">Kayıtlı rotalarınız</p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push('/routes/search')}
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-red-600"
            >
              <Search className="w-5 h-5" />
              Yeni Rota Ara
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {favoriteRoutes.length === 0 ? (
          // Empty State
          <Card variant="glass" className="p-12 animate-scale-in">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="inline-block p-4 bg-red-100 dark:bg-red-900/20 rounded-2xl mb-4">
                <Heart className="w-12 h-12 mx-auto text-red-500 animate-pulse" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Henüz favori rota yok
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Sık kullandığınız rotaları favorilere ekleyerek hızlı erişim sağlayabilirsiniz
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/routes/search')}
                className="flex items-center gap-2 mx-auto"
              >
                <Search className="w-5 h-5" />
                Rota Aramaya Başla
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Favorite Routes */}
            <div className="space-y-6">
              <Card variant="glass" className="p-6 animate-scale-in">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <span>❤️</span>
                  <span>Favori Rotalarım</span>
                  <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-semibold rounded-full shadow-lg">
                    {favoriteRoutes.length}
                  </span>
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kalp ikonuna tekrar tıklayarak favorilerden çıkarabilirsiniz
                </p>
              </Card>

              <RouteResults
                routes={favoriteRoutes}
                onRouteSelect={handleRouteSelect}
                onSaveToFavorites={handleRemoveFromFavorites}
                favoriteRouteIds={favoriteRoutes.map((fav) => fav.id)}
              />
            </div>

            {/* Right Column: Map */}
            <div className="lg:sticky lg:top-28 h-[calc(100vh-10rem)]">
              <Card variant="glass" className="h-full p-0 overflow-hidden shadow-xl animate-scale-in" style={{ animationDelay: '200ms' } as any}>
                <Map
                  center={
                    selectedRoute && selectedRoute.origin
                      ? [selectedRoute.origin.lat, selectedRoute.origin.lng]
                      : [39.9334, 32.8597]
                  }
                  zoom={selectedRoute ? 14 : 13}
                  markers={mapMarkers}
                  polylines={mapPolylines}
                  className="h-full w-full rounded-2xl"
                />
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <ProtectedRoute>
      <FavoritesContent />
    </ProtectedRoute>
  );
}
