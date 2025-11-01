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

const LocationSearchInput = dynamic(() => import('@/components/map/LocationSearchInput'), { ssr: false });
const Map = dynamic(() => import('@/components/map/Map'), { ssr: false });

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
    if (currentModes.includes(mode)) {
      setValue(
        'modes',
        currentModes.filter((m) => m !== mode)
      );
    } else {
      setValue('modes', [...currentModes, mode]);
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
    dispatch(setSelectedRoute(route));
    // Could navigate to route details page
    // router.push(`/routes/${route.id}`);
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Rota Ara</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Search Form & Results */}
          <div className="space-y-6">
            {/* Search Form */}
            <Card className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Origin Input */}
                <LocationSearchInput
                  label="Nereden"
                  placeholder="Başlangıç noktası girin"
                  onLocationSelect={handleOriginSelect}
                  error={errors.origin?.message}
                />

                {/* Swap Button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <ArrowLeftRight className="w-5 h-5 text-gray-600" />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ulaşım Türleri
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {transportModes.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => toggleMode(mode)}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-medium
                          transition-all flex items-center gap-2
                          ${
                            selectedModes?.includes(mode)
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        <span>{transportModeIcons[mode]}</span>
                        <span>{transportModeLabels[mode]}</span>
                      </button>
                    ))}
                  </div>
                  {errors.modes && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.modes.message}
                    </p>
                  )}
                </div>

                {/* Advanced Options Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary-600 font-medium"
                >
                  <Settings className="w-4 h-4" />
                  Gelişmiş Ayarlar
                </button>

                {/* Advanced Options */}
                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    {/* Departure Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Kalkış Zamanı
                      </label>
                      <input
                        type="datetime-local"
                        {...register('departureTime')}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Max Walking Distance */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
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
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Bulunan Rotalar ({routes.length})
                </h2>
                <RouteResults
                  routes={routes}
                  onRouteSelect={handleRouteSelect}
                  loading={loading}
                />
              </div>
            )}
          </div>

          {/* Right Column: Map */}
          <div className="lg:sticky lg:top-6 h-[calc(100vh-8rem)]">
            <Card className="h-full p-0 overflow-hidden">
              <Map
                center={
                  origin
                    ? [origin.lat, origin.lng]
                    : [39.9334, 32.8597]
                }
                zoom={origin || destination ? 14 : 13}
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

export default function RouteSearchPage() {
  return (
    <ProtectedRoute>
      <RouteSearchContent />
    </ProtectedRoute>
  );
}
