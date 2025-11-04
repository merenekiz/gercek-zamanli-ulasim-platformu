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
  type TransportMode,
  transportModeLabels,
  transportModeIcons,
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

const transportModes: TransportMode[] = [
  'BUS',
  'METRO',
  'ANKARAY',
  'WALKING',
  'TAXI',
];

function RouteSearchContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { routes, selectedRoute, loading } = useAppSelector((state) => state.route);

  const [origin, setOrigin] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [mapPolylines, setMapPolylines] = useState<any[]>([]);

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
      modes: ['BUS', 'METRO', 'WALKING'],
      arriveBy: false,
      maxWalkingDistance: 1000,
      wheelchair: false,
    },
  });

  const selectedModes = watch('modes');

  // Debug: Watch selectedModes changes
  useEffect(() => {
    console.log('[RouteSearch] selectedModes changed:', selectedModes);
  }, [selectedModes]);

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
  };

  // Update map polylines when selected route changes
  useEffect(() => {
    if (!selectedRoute) {
      setMapPolylines([]);
      return;
    }

    const polylines = [];
    for (const segment of selectedRoute.segments) {
      if (segment.polyline) {
        try {
          const geometry = JSON.parse(segment.polyline);
          if (geometry.type === 'LineString' && geometry.coordinates) {
            // Convert GeoJSON coordinates [lng, lat] to [lat, lng]
            const positions = geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);

            // Get color based on transport mode
            const color = transportModeMapColors[segment.mode as string] || '#6B7280'; // Gray fallback
            const weight = segment.mode === 'WALKING' ? 3 : 5; // Thinner line for walking

            polylines.push({
              positions,
              color,
              weight,
              opacity: 0.8,
            });
          }
        } catch (error) {
          console.error('Error parsing polyline:', error);
        }
      }
    }
    setMapPolylines(polylines);
  }, [selectedRoute]);

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

  const toggleMode = (mode: TransportMode) => {
    const currentModes = selectedModes || [];
    console.log('[RouteSearch] Toggling mode:', mode, 'Current modes:', currentModes);

    if (currentModes.includes(mode)) {
      const newModes = currentModes.filter((m) => m !== mode);
      console.log('[RouteSearch] Removing mode. New modes:', newModes);
      setValue('modes', newModes, { shouldValidate: true });
    } else {
      const newModes = [...currentModes, mode];
      console.log('[RouteSearch] Adding mode. New modes:', newModes);
      setValue('modes', newModes, { shouldValidate: true });
    }
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

    console.log('[RouteSearch] Submitting with modes:', data.modes);

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
    dispatch(
      showToast({
        message: 'Rota haritada gösteriliyor',
        type: 'success',
      })
    );
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

                {/* Transport Modes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    🚌 Ulaşım Türleri
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {transportModes.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => toggleMode(mode)}
                        className={`
                          px-4 py-2.5 rounded-xl text-sm font-semibold
                          transition-all duration-300 flex items-center gap-2
                          border-2 shadow-sm hover:shadow-md hover:scale-105
                          ${
                            selectedModes?.includes(mode)
                              ? 'bg-gradient-primary text-white border-primary-600 dark:border-primary-400 shadow-primary/20 scale-105'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary/40 dark:hover:border-primary/40'
                          }
                        `}
                      >
                        <span className="text-base">{transportModeIcons[mode]}</span>
                        <span>{transportModeLabels[mode]}</span>
                      </button>
                    ))}
                  </div>
                  {errors.modes && (
                    <p className="mt-2 text-sm text-warning font-medium animate-fade-in">
                      {errors.modes.message}
                    </p>
                  )}
                </div>

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
