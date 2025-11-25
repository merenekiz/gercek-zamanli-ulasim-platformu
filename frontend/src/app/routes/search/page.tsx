'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Search,
  MapPin,
  Clock,
  ArrowLeftRight,
  Settings,
  X,
  Navigation,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { searchRoutes, setSelectedRoute } from '@/lib/store/slices/routeSlice';
import { showToast } from '@/lib/store/slices/uiSlice';
import {
  routeSearchSchema,
  type RouteSearchFormData,
} from '@/lib/validation/route';
import { TransportMode as TransportModeEnum } from '@/lib/types';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import RouteResults from '@/components/route/RouteResults';

const LocationSearchInput = dynamic(() => import('@/components/map/LocationSearchInput'), {
  ssr: false,
  loading: () => <div className="text-center text-gray-500">Konum arama yükleniyor...</div>
});
const Map = dynamic(() => import('@/components/map/Map'), {
  ssr: false,
  loading: () => <div className="text-center text-gray-500">Harita yükleniyor...</div>
});

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

function RouteSearchContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { routes, selectedRoute, loading } = useAppSelector((state) => state.route);

  const [origin, setOrigin] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [mapPolylines, setMapPolylines] = useState<any[]>([]);
  const [favoriteRoutes, setFavoriteRoutes] = useState<any[]>([]);
  const [busStopIconUrl, setBusStopIconUrl] = useState<string | null>(null);

  // Create bus stop icon with white circle background
  useEffect(() => {
    const createBusStopIcon = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 28;
      canvas.height = 28;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Draw white circle with blue border
      ctx.fillStyle = 'white';
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(14, 14, 13, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Load and draw bus stop PNG
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/icons/bus_stop.png';
      img.onload = () => {
        ctx.drawImage(img, 6, 6, 16, 16);
        setBusStopIconUrl(canvas.toDataURL());
      };
    };

    createBusStopIcon();
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const storedFavorites = localStorage.getItem('favoriteRoutes');
    if (storedFavorites) {
      try {
        setFavoriteRoutes(JSON.parse(storedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RouteSearchFormData>({
    resolver: zodResolver(routeSearchSchema),
    defaultValues: {
      origin: '',
      destination: '',
      modes: ['BUS', 'METRO', 'ANKARAY', 'WALKING', 'TAXI'], // Tüm ulaşım türleri
      arriveBy: false,
      maxWalkingDistance: 1000,
      wheelchair: false,
    },
  });

  // Update map markers when locations change
  useEffect(() => {
    const markers = [];
    if (origin) {
      markers.push({
        position: [origin.lat, origin.lng] as [number, number],
        popup: `<strong>Başlangıç:</strong><br>${origin.address}`,
      });
    }
    if (destination) {
      markers.push({
        position: [destination.lat, destination.lng] as [number, number],
        popup: `<strong>Varış:</strong><br>${destination.address}`,
      });
    }
    setMapMarkers(markers);
  }, [origin, destination]);

  // Transport mode color mapping for map polylines
  const transportModeMapColors: Record<string, string> = {
    BUS: '#3B82F6',      // Blue
    METRO: '#EF4444',    // Red
    ANKARAY: '#F97316',  // Orange
    WALKING: '#22C55E',  // Green
    TAXI: '#EAB308',     // Yellow
    RIDESHARE: '#A855F7', // Purple
    TRAM: '#8B5CF6',     // Purple
  };

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

  // Transport mode labels for popup
  const transportModeLabelsMap: Record<string, string> = {
    BUS: 'Otobüs',
    METRO: 'Metro',
    ANKARAY: 'Ankaray',
    WALKING: 'Yürüyüş',
    TAXI: 'Taksi',
    RIDESHARE: 'Paylaşımlı',
    TRAM: 'Tramvay',
  };

  // Update map polylines and stop markers when selected route changes
  useEffect(() => {
    console.log('[RouteSearch] selectedRoute changed:', selectedRoute?.id);

    if (!selectedRoute) {
      setMapPolylines([]);
      // Reset markers to only origin/destination
      const markers = [];
      if (origin) {
        markers.push({
          position: [origin.lat, origin.lng] as [number, number],
          popup: `<strong>Başlangıç:</strong><br>${origin.address}`,
        });
      }
      if (destination) {
        markers.push({
          position: [destination.lat, destination.lng] as [number, number],
          popup: `<strong>Varış:</strong><br>${destination.address}`,
        });
      }
      setMapMarkers(markers);
      return;
    }

    console.log('[RouteSearch] Route segments:', selectedRoute.segments?.length);

    const polylines = [];
    const stopMarkers: any[] = [];

    // Add origin marker
    if (origin) {
      stopMarkers.push({
        position: [origin.lat, origin.lng] as [number, number],
        popup: `<strong>Başlangıç:</strong><br>${origin.address}`,
      });
    }

    for (const segment of selectedRoute.segments || []) {
      console.log('[RouteSearch] Segment:', segment.mode, 'polyline:', segment.polyline ? 'exists' : 'missing');

      // Add polyline
      if (segment.polyline) {
        try {
          const positions = decodePolyline(segment.polyline);
          console.log('[RouteSearch] Decoded positions:', positions.length);

          if (positions.length > 0) {
            const color = transportModeMapColors[segment.mode as string] || '#6B7280';
            const weight = segment.mode === 'WALKING' ? 3 : 5;

            polylines.push({
              positions,
              color,
              weight,
              opacity: 0.8,
            });
          }
        } catch (error) {
          console.error('[RouteSearch] Error decoding polyline:', error);
        }
      }

      // Add stop markers for transit segments (TAXI hariç)
      if (segment.mode !== 'WALKING' && segment.mode !== 'TAXI' && segment.polyline) {
        try {
          const positions = decodePolyline(segment.polyline);
          const color = transportModeMapColors[segment.mode as string] || '#6B7280';
          const modeLabel = transportModeLabelsMap[segment.mode as string] || segment.mode;
          const routeName = segment.routeInfo?.routeName || '';
          const departureStop = segment.routeInfo?.departureStop || '';
          const arrivalStop = segment.routeInfo?.arrivalStop || '';
          const numStops = segment.routeInfo?.stops || 0;

          // Sadece BUS, METRO, ANKARAY için özel ikon kullan
          const modeIconUrls: Record<string, string> = {
            BUS: busStopIconUrl || '/icons/bus_stop.png', // Canvas ile oluşturulan icon
            METRO: '/icons/metro_stop.png',
            ANKARAY: '/icons/ankaray_stop.png',
          };
          const iconUrl = modeIconUrls[segment.mode as string];

          // İkon varsa (BUS, METRO, ANKARAY) görsel kullan, yoksa renkli daire
          let markerIcon;
          if (iconUrl) {
            markerIcon = {
              url: iconUrl,
              scaledSize: segment.mode === 'BUS' ? { width: 28, height: 28 } : { width: 18, height: 18 },
              anchor: segment.mode === 'BUS' ? { x: 14, y: 14 } : { x: 9, y: 9 },
            };
          } else {
            markerIcon = {
              path: 0, // google.maps.SymbolPath.CIRCLE
              scale: 6,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            };
          }

          // API'den gelen durak sayısına göre tüm durakları ekle
          const totalStops = numStops > 0 ? numStops : 2; // En az 2 durak (biniş-iniş)

          if (positions.length > 0 && totalStops > 0) {
            // Durakları polyline boyunca eşit aralıklarla yerleştir
            const interval = positions.length / totalStops;

            for (let i = 0; i < totalStops; i++) {
              const posIndex = Math.min(Math.floor(i * interval), positions.length - 1);
              const pos = positions[posIndex];
              const isFirst = i === 0;
              const isLast = i === totalStops - 1;

              // Popup içeriği - sadece API'den gelen bilgileri göster
              let popupContent = `<div style="min-width: 140px; padding: 8px;">
                <div style="font-weight: bold; color: ${color}; font-size: 13px; margin-bottom: 4px;">
                  ${modeLabel}${routeName ? ` - ${routeName}` : ''}
                </div>`;

              if (isFirst && departureStop) {
                popupContent += `<div style="font-size: 12px; color: #333;">${departureStop}</div>`;
              } else if (isLast && arrivalStop) {
                popupContent += `<div style="font-size: 12px; color: #333;">${arrivalStop}</div>`;
              } else {
                popupContent += `<div style="font-size: 11px; color: #666;">Durak ${i + 1}/${totalStops}</div>`;
              }

              popupContent += '</div>';

              stopMarkers.push({
                position: pos,
                popup: popupContent,
                icon: markerIcon,
              });
            }
          }
        } catch (error) {
          console.error('[RouteSearch] Error adding stop markers:', error);
        }
      }
    }

    // Add destination marker
    if (destination) {
      stopMarkers.push({
        position: [destination.lat, destination.lng] as [number, number],
        popup: `<strong>Varış:</strong><br>${destination.address}`,
      });
    }

    console.log('[RouteSearch] Total polylines created:', polylines.length);
    console.log('[RouteSearch] Total stop markers created:', stopMarkers.length);

    setMapPolylines(polylines);
    setMapMarkers(stopMarkers);
  }, [selectedRoute, origin, destination]);

  const handleOriginSelect = (location: any) => {
    setOrigin({
      address: location.display_name,
      lat: location.lat,
      lng: location.lng,
    });
    setValue('origin', location.display_name);
  };

  const handleDestinationSelect = (location: any) => {
    setDestination({
      address: location.display_name,
      lat: location.lat,
      lng: location.lng,
    });
    setValue('destination', location.display_name);
  };

  const handleSwapLocations = () => {
    const tempOrigin = origin;
    const tempDestination = destination;

    setOrigin(tempDestination);
    setDestination(tempOrigin);

    setValue('origin', tempDestination?.address || '');
    setValue('destination', tempOrigin?.address || '');
  };

  const onSubmit = async (data: RouteSearchFormData) => {
    if (!origin || !destination) {
      dispatch(
        showToast({
          message: 'Lütfen başlangıç ve varış noktalarını seçin',
          type: 'error',
        })
      );
      return;
    }

    try {
      await dispatch(
        searchRoutes({
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          modes: data.modes as unknown as TransportModeEnum[],
          departureTime: data.departureTime ? new Date(data.departureTime) : undefined,
          preferences: {
            maxWalkingDistance: data.maxWalkingDistance,
            accessibilityRequired: data.wheelchair,
          },
        })
      ).unwrap();

      dispatch(
        showToast({
          message: 'Rotalar başarıyla bulundu',
          type: 'success',
        })
      );
    } catch (error: any) {
      dispatch(
        showToast({
          message: error.message || 'Rota ararken bir hata oluştu',
          type: 'error',
        })
      );
    }
  };

  const handleRouteSelect = (route: any) => {
    console.log('[RouteSearch] Route selected:', route.id);
    dispatch(setSelectedRoute(route));

    // Save to trip history only if origin and destination exist
    if (origin && destination) {
      const tripData = {
        id: `trip_${Date.now()}`,
        route,
        origin: {
          address: origin.address,
          lat: origin.lat,
          lng: origin.lng,
        },
        destination: {
          address: destination.address,
          lat: destination.lat,
          lng: destination.lng,
        },
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('tr-TR'),
        time: new Date().toLocaleTimeString('tr-TR'),
      };

      // Get existing trip history
      const existingHistory = localStorage.getItem('tripHistory');
      let tripHistory = [];
      if (existingHistory) {
        try {
          tripHistory = JSON.parse(existingHistory);
        } catch (error) {
          console.error('Error parsing trip history:', error);
        }
      }

      // Add new trip to history (keep last 50 trips)
      tripHistory.unshift(tripData);
      if (tripHistory.length > 50) {
        tripHistory = tripHistory.slice(0, 50);
      }

      // Save to localStorage
      localStorage.setItem('tripHistory', JSON.stringify(tripHistory));
    }

    dispatch(
      showToast({
        message: 'Rota haritada gösteriliyor',
        type: 'success',
      })
    );
  };

  const handleSaveToFavorites = (route: any) => {
    const routeId = route.id || '';
    const isFavorite = favoriteRoutes.some((fav) => fav.id === routeId);

    let updatedFavorites;
    if (isFavorite) {
      // Remove from favorites
      updatedFavorites = favoriteRoutes.filter((fav) => fav.id !== routeId);
      dispatch(
        showToast({
          message: 'Rota favorilerden çıkarıldı',
          type: 'success',
        })
      );
    } else {
      // Add to favorites with metadata
      const favoriteRoute = {
        ...route,
        origin,
        destination,
        savedAt: new Date().toISOString(),
      };
      updatedFavorites = [...favoriteRoutes, favoriteRoute];
      dispatch(
        showToast({
          message: 'Rota favorilere eklendi',
          type: 'success',
        })
      );
    }

    setFavoriteRoutes(updatedFavorites);
    localStorage.setItem('favoriteRoutes', JSON.stringify(updatedFavorites));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-gradient-primary shadow-xl border-b border-white/10 sticky top-0 z-40 backdrop-blur-lg">
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
                  <Navigation className="w-7 h-7" />
                  Rota Ara
                </h1>
                <p className="text-primary-100 text-sm mt-0.5">En iyi rotayı bulun</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Search Form & Results */}
          <div className="space-y-6">
            {/* Search Form */}
            <Card variant="glass" className="p-6 animate-scale-in">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Origin Input */}
                <LocationSearchInput
                  label="Nereden"
                  placeholder="Başlangıç noktası girin"
                  onLocationSelect={handleOriginSelect}
                  error={errors.origin?.message}
                />

                {/* Swap Button */}
                <div className="flex justify-center -my-2">
                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 hover:from-primary/20 hover:to-primary/10 dark:hover:from-primary/30 dark:hover:to-primary/20 transition-all duration-300 hover:scale-110 group border border-primary/20 dark:border-primary/30 shadow-lg"
                  >
                    <ArrowLeftRight className="w-5 h-5 text-primary dark:text-primary-400 group-hover:rotate-180 transition-transform duration-500" />
                  </button>
                </div>

                {/* Destination Input */}
                <LocationSearchInput
                  label="Nereye"
                  placeholder="Varış noktası girin"
                  onLocationSelect={handleDestinationSelect}
                  error={errors.destination?.message}
                />

                {/* Advanced Options Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  <Settings className="w-4 h-4" />
                  Gelişmiş Ayarlar
                </button>

                {/* Advanced Options */}
                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {/* Departure Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Kalkış Zamanı
                      </label>
                      <input
                        type="datetime-local"
                        {...register('departureTime')}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Max Walking Distance */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Maksimum Yürüme Mesafesi: {watch('maxWalkingDistance')}m
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="100"
                        {...register('maxWalkingDistance', {
                          valueAsNumber: true,
                        })}
                        className="w-full"
                      />
                    </div>

                    {/* Wheelchair Accessible */}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register('wheelchair')}
                        className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Tekerlekli sandalye erişimi
                      </span>
                    </label>
                  </div>
                )}

                {/* Search Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={loading}
                  className="flex items-center gap-2 justify-center"
                >
                  <Search className="w-5 h-5" />
                  Rota Ara
                </Button>
              </form>
            </Card>

            {/* Route Results */}
            {routes.length > 0 && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-1 w-12 bg-gradient-primary rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🎯</span>
                    <span>Bulunan Rotalar</span>
                    <span className="px-3 py-1 bg-gradient-primary text-white text-sm font-semibold rounded-full shadow-lg">
                      {routes.length}
                    </span>
                  </h2>
                </div>
                <RouteResults
                  routes={routes}
                  onRouteSelect={handleRouteSelect}
                  onSaveToFavorites={handleSaveToFavorites}
                  favoriteRouteIds={favoriteRoutes.map((fav) => fav.id)}
                  loading={loading}
                />
              </div>
            )}
          </div>

          {/* Right Column: Map */}
          <div className="lg:sticky lg:top-28 h-[calc(100vh-10rem)]">
            <Card variant="glass" className="h-full p-0 overflow-hidden shadow-xl animate-scale-in" style={{ animationDelay: '200ms' } as any}>
              <Map
                center={
                  origin
                    ? [origin.lat, origin.lng]
                    : [39.9334, 32.8597]
                }
                zoom={origin || destination ? 14 : 13}
                markers={mapMarkers}
                polylines={mapPolylines}
                className="h-full w-full rounded-2xl"
              />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RouteSearchPage() {
  return (
    <ProtectedRoute>
      <RouteSearchContent />
    </ProtectedRoute>
  );
}
