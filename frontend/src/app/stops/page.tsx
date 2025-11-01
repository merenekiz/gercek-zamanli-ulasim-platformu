'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Navigation as NavigationIcon,
  Search,
  Filter,
  Bus,
  X,
  Loader2,
} from 'lucide-react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Map from '@/components/map/Map';
import { useAppDispatch } from '@/lib/store/hooks';
import { showToast } from '@/lib/store/slices/uiSlice';

interface Stop {
  id: string;
  name: string;
  type: 'BUS_STOP' | 'METRO_STATION' | 'ANKARAY_STATION';
  location: {
    lat: number;
    lng: number;
  };
  routes: string[];
  distance?: number;
}

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
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'BUS_STOP',
    'METRO_STATION',
    'ANKARAY_STATION',
  ]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Mock data - will be replaced with API call
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    // Request user location on mount
    getUserLocation();
  }, []);

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
          // TODO: Fetch nearby stops
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

  const toggleStopType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
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
        ...stops.map((stop) => ({
          position: [stop.location.lat, stop.location.lng] as [number, number],
          popup: `<strong>${stop.name}</strong><br>${
            stopTypeLabels[stop.type]
          }`,
        })),
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Yakınımdaki Duraklar
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Çevrenizdeki toplu taşıma duraklarını keşfedin
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={getUserLocation}
              leftIcon={
                loadingLocation ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <NavigationIcon className="w-5 h-5" />
                )
              }
              disabled={loadingLocation}
            >
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
            {/* Search & Filters */}
            <Card className="p-6">
              <div className="space-y-4">
                {/* Search Input */}
                <Input
                  placeholder="Durak adı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                />

                {/* Stop Type Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Durak Türü
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stopTypeLabels).map(([type, label]) => (
                      <button
                        key={type}
                        onClick={() => toggleStopType(type)}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-medium
                          transition-all
                          ${
                            selectedTypes.includes(type)
                              ? `${stopTypeColors[type as keyof typeof stopTypeColors]} text-white`
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Stops List */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Yakınımdaki Duraklar
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
              ) : stops.length === 0 ? (
                // Empty State
                <Card className="p-12">
                  <div className="text-center text-gray-500">
                    <Bus className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium mb-2">
                      Yakınınızda durak bulunamadı
                    </p>
                    <p className="text-sm">
                      Konumunuzu kontrol edin veya haritada arama yapın
                    </p>
                  </div>
                </Card>
              ) : (
                // Stops List
                <div className="space-y-3">
                  {stops.map((stop) => (
                    <Card
                      key={stop.id}
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
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
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {stop.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {stopTypeLabels[stop.type]}
                          </p>

                          {/* Routes */}
                          {stop.routes.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {stop.routes.slice(0, 5).map((route, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
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
                            <p className="text-sm font-medium text-gray-900">
                              {formatDistance(stop.distance)}
                            </p>
                            <p className="text-xs text-gray-500">mesafe</p>
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
          <div className="lg:sticky lg:top-6 h-[calc(100vh-8rem)]">
            <Card className="h-full p-0 overflow-hidden">
              <Map
                center={userLocation || [39.9334, 32.8597]}
                zoom={userLocation ? 15 : 13}
                markers={mapMarkers}
                className="h-full w-full rounded-lg"
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
