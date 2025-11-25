'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Navigation as NavigationIcon,
  Search,
  Bus,
  X,
  Loader2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import { useAppDispatch } from '@/lib/store/hooks';
import { showToast } from '@/lib/store/slices/uiSlice';
import { loadStops } from '@/lib/data/stopsLoader';
import { getNearbyStops, searchStops, Stop } from '@/lib/utils/stopsParser';

const Map = dynamic(() => import('@/components/map/Map'), { ssr: false });

const stopTypeLabels = {
  BUS_STOP: 'Otobüs Durağı',
  METRO_STATION: 'Metro İstasyonu',
  ANKARAY_STATION: 'Ankaray İstasyonu',
};

const stopTypeColors = {
  BUS_STOP: 'bg-blue-500',
  METRO_STATION: 'bg-red-500',
  ANKARAY_STATION: 'bg-orange-500',
};

function StopsContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [filteredStops, setFilteredStops] = useState<Stop[]>([]);

  useEffect(() => {
    // Load stops data
    loadStopsData();
    // Request user location on mount
    getUserLocation();
  }, []);

  useEffect(() => {
    // Filter and sort stops when search query or user location changes
    updateFilteredStops();
  }, [searchQuery, userLocation, allStops]);

  const loadStopsData = async () => {
    setLoading(true);
    try {
      const stops = await loadStops();
      setAllStops(stops);
    } catch (error) {
      console.error('Error loading stops:', error);
      dispatch(
        showToast({
          message: 'Duraklar yüklenirken hata oluştu',
          type: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFilteredStops = () => {
    let stops = allStops;

    // Apply search filter
    if (searchQuery) {
      stops = searchStops(stops, searchQuery);
    }

    // Calculate distances and sort by proximity if user location is available
    if (userLocation) {
      stops = getNearbyStops(stops, userLocation[0], userLocation[1]);
      // Limit to closest 50 stops for performance
      stops = stops.slice(0, 50);
    } else {
      // Limit to first 50 stops if no location
      stops = stops.slice(0, 50);
    }

    setFilteredStops(stops);
  };

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLoadingLocation(false);
          dispatch(
            showToast({
              message: 'Konumunuz alındı',
              type: 'success',
            })
          );
        },
        (error) => {
          setLoadingLocation(false);
          dispatch(
            showToast({
              message: 'Konum alınamadı. Lütfen konum izni verin.',
              type: 'error',
            })
          );
          // Default to Ankara center
          setUserLocation([39.9334, 32.8597]);
        }
      );
    } else {
      dispatch(
        showToast({
          message: 'Tarayıcınız konum servislerini desteklemiyor',
          type: 'error',
        })
      );
      // Default to Ankara center
      setUserLocation([39.9334, 32.8597]);
    }
  };

  const formatDistance = (meters?: number): string => {
    if (!meters) return '';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const mapMarkers = userLocation
    ? [
        {
          position: userLocation,
          popup: '<strong>Konumunuz</strong>',
        },
        ...filteredStops.map((stop) => ({
          position: [stop.location.lat, stop.location.lng] as [number, number],
          popup: `<strong>${stop.name}</strong><br>${
            stopTypeLabels[stop.type]
          }<br>${stop.distance ? `${formatDistance(stop.distance)} uzaklıkta` : ''}`,
        })),
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 shadow-xl border-b border-white/10 sticky top-0 z-40 backdrop-blur-lg">
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
                  <MapPin className="w-7 h-7" />
                  Yakınımdaki Duraklar
                </h1>
                <p className="text-green-100 text-sm mt-0.5">
                  Çevrenizdeki toplu taşıma duraklarını keşfedin
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={getUserLocation}
              disabled={loadingLocation}
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-green-600"
            >
              {loadingLocation ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <NavigationIcon className="w-5 h-5" />
              )}
              Konumu Yenile
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Filters & Results */}
          <div className="space-y-6">
            {/* Search */}
            <Card variant="glass" className="p-6 animate-scale-in">
              <Input
                placeholder="Durak adı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </Card>

            {/* Stops List */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tüm Duraklar
              </h2>

              {loading ? (
                // Loading State
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-4 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : filteredStops.length === 0 ? (
                // Empty State
                <Card variant="glass" className="p-12 animate-scale-in">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="inline-block p-4 bg-green-100 dark:bg-green-900/20 rounded-2xl mb-4">
                      <Bus className="w-12 h-12 mx-auto text-green-500 animate-pulse" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {searchQuery ? 'Arama sonucu bulunamadı' : 'Yakınınızda durak bulunamadı'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {searchQuery
                        ? 'Farklı anahtar kelimelerle tekrar deneyin'
                        : 'Konumunuzu kontrol edin veya haritada arama yapın'}
                    </p>
                  </div>
                </Card>
              ) : (
                // Stops List
                <div className="space-y-3">
                  {filteredStops.map((stop) => (
                    <Card
                      key={stop.id}
                      variant="gradient"
                      hover
                      animate
                      className="p-4 cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        {/* Stop Icon */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                            stopTypeColors[stop.type]
                          }`}
                        >
                          <Bus className="w-5 h-5" />
                        </div>

                        {/* Stop Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {stop.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {stopTypeLabels[stop.type]}
                          </p>
                          {stop.district && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                              {stop.district}
                            </p>
                          )}
                          {!stop.district && (
                            <div className="mb-2"></div>
                          )}

                          {/* Routes */}
                          {stop.routes.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {stop.routes.slice(0, 5).map((route, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded font-medium"
                                >
                                  {route}
                                </span>
                              ))}
                              {stop.routes.length > 5 && (
                                <span className="text-xs text-gray-500">
                                  +{stop.routes.length - 5}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Distance */}
                        {stop.distance && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDistance(stop.distance)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">mesafe</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Map */}
          <div className="lg:sticky lg:top-28 h-[calc(100vh-10rem)]">
            <Card variant="glass" className="h-full p-0 overflow-hidden shadow-xl animate-scale-in" style={{ animationDelay: '200ms' } as any}>
              <Map
                center={userLocation || [39.9334, 32.8597]}
                zoom={userLocation ? 15 : 13}
                markers={mapMarkers}
                className="h-full w-full rounded-2xl"
              />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StopsPage() {
  return (
    <ProtectedRoute>
      <StopsContent />
    </ProtectedRoute>
  );
}
