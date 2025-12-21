'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Search,
  MapPin,
  ArrowLeftRight,
  X,
  Navigation,
  Compass,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { searchRoutes, setSelectedRoute, clearRoutes } from '@/lib/store/slices/routeSlice';
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
import NearbyAttractions from '@/components/route/NearbyAttractions';

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

// Transit stop icon URLs (constant - moved outside component to prevent re-creation)
const TRANSIT_STOP_ICONS = {
  bus: '/icons/bus_stop.png',
  metro: '/icons/metro_stop.png',
  ankaray: '/icons/ankaray_stop.png',
};

function RouteSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { routes, selectedRoute, loading } = useAppSelector((state) => state.route);

  const [origin, setOrigin] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [mapPolylines, setMapPolylines] = useState<any[]>([]);
  const [favoriteRoutes, setFavoriteRoutes] = useState<any[]>([]);

  // Track if auto-search from query params has been done
  const autoSearchDoneRef = useRef(false);

  // Load query parameters from URL and auto-search (for repeat trip functionality)
  useEffect(() => {
    const originAddress = searchParams?.get('origin');
    const destinationAddress = searchParams?.get('destination');

    // If no query params, clear everything
    if (!originAddress && !destinationAddress) {
      console.log('[RouteSearch] No query params - clearing routes and locations');
      dispatch(clearRoutes());
      setOrigin(null);
      setDestination(null);
      setValue('origin', '');
      setValue('destination', '');
      autoSearchDoneRef.current = false;
      return;
    }

    // Reset auto-search flag when query params change
    console.log('[RouteSearch] Query params detected - resetting auto-search flag');
    autoSearchDoneRef.current = false;

    // Use Google Geocoding API to convert addresses to coordinates
    const geocodeAddress = async (address: string) => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.error('Google Maps API key not found');
          return null;
        }

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        );
        const data = await response.json();

        if (data.status === 'OK' && data.results[0]) {
          return {
            address: data.results[0].formatted_address,
            lat: data.results[0].geometry.location.lat,
            lng: data.results[0].geometry.location.lng,
          };
        }
        console.error('Geocoding failed:', data.status);
        return null;
      } catch (error) {
        console.error('Geocoding error:', error);
        return null;
      }
    };

    // Load both origin and destination
    const loadLocations = async () => {
      console.log('[RouteSearch] Loading locations from query params');

      // Load origin
      if (originAddress) {
        const location = await geocodeAddress(originAddress);
        if (location) {
          console.log('[RouteSearch] Origin loaded:', location.address);
          setOrigin(location);
          setValue('origin', location.address);
        }
      }

      // Load destination
      if (destinationAddress) {
        const location = await geocodeAddress(destinationAddress);
        if (location) {
          console.log('[RouteSearch] Destination loaded:', location.address);
          setDestination(location);
          setValue('destination', location.address);
        }
      }
    };

    loadLocations();
  }, [searchParams, dispatch]);

  // Auto-search when both origin and destination are loaded from query params
  useEffect(() => {
    const originAddress = searchParams?.get('origin');
    const destinationAddress = searchParams?.get('destination');

    // Only auto-search if:
    // 1. We have query params
    // 2. Both origin and destination are loaded
    // 3. We haven't done auto-search yet
    if (
      originAddress &&
      destinationAddress &&
      origin &&
      destination &&
      !autoSearchDoneRef.current
    ) {
      console.log('[RouteSearch] Auto-searching routes from query params');
      autoSearchDoneRef.current = true;

      // Trigger route search
      dispatch(
        searchRoutes({
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          modes: ['BUS', 'METRO', 'ANKARAY', 'WALKING', 'TAXI'] as unknown as TransportModeEnum[],
          preferences: {
            maxWalkingDistance: 1000,
            accessibilityRequired: false,
          },
        })
      )
        .unwrap()
        .then(() => {
          dispatch(
            showToast({
              message: 'Rotalar başarıyla bulundu',
              type: 'success',
            })
          );
        })
        .catch((error: any) => {
          dispatch(
            showToast({
              message: error.message || 'Rota ararken bir hata oluştu',
              type: 'error',
            })
          );
        });
    }
  }, [origin, destination, searchParams, dispatch]);

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

    const polylines: any[] = [];
    const stopMarkers: any[] = [];

    // Add origin marker
    if (origin) {
      stopMarkers.push({
        position: [origin.lat, origin.lng] as [number, number],
        popup: `<strong>Başlangıç:</strong><br>${origin.address}`,
      });
    }

    // Process segments: add polylines
    for (const segment of selectedRoute.segments || []) {
      console.log('[RouteSearch] Segment:', segment.mode, 'polyline:', segment.polyline ? 'exists' : 'missing');

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
              opacity: 1,
            });
          }
        } catch (error) {
          console.error('[RouteSearch] Error decoding polyline:', error);
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

    // Set polylines and origin/destination markers immediately
    setMapPolylines(polylines);
    setMapMarkers(stopMarkers);

    // Fetch REAL stops from Google Places API (gerçek durak isimleri ile)
    const fetchRealStops = async () => {
      console.log('[RouteSearch] Fetching real stops from Places API...');
      const newStopMarkers = [...stopMarkers];

      for (const segment of selectedRoute.segments || []) {
        if (['BUS', 'METRO', 'ANKARAY'].includes(segment.mode) && segment.polyline) {
          const color = transportModeMapColors[segment.mode as string] || '#6B7280';
          const modeLabel = transportModeLabelsMap[segment.mode as string] || segment.mode;
          const routeName = segment.routeInfo?.routeName || segment.routeInfo?.routeLongName || '';

          console.log(`[RouteSearch] Fetching ${segment.mode} stops for route: "${routeName}" (segment.routeInfo:`, segment.routeInfo, ')');

          // Determine icon based on mode
          let iconUrl = '';
          let iconSize = 24;

          if (segment.mode === 'BUS') {
            iconUrl = TRANSIT_STOP_ICONS.bus;
            iconSize = 24; // Bus icon küçültüldü (32'den 24'e)
          } else if (segment.mode === 'METRO') {
            iconUrl = TRANSIT_STOP_ICONS.metro;
            iconSize = 24;
          } else if (segment.mode === 'ANKARAY') {
            iconUrl = TRANSIT_STOP_ICONS.ankaray;
            iconSize = 24;
          }

          const markerIcon = {
            url: iconUrl,
            scaledSize: {
              width: iconSize,
              height: iconSize
            },
            anchor: {
              x: iconSize / 2,
              y: iconSize / 2
            },
          };

          try {
            // Places API'den gerçek durakları al - Route name ile Text Search kullan
            const response = await fetch('http://localhost:5001/api/v1/stops/along-route', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                polyline: segment.polyline,
                transitMode: segment.mode,
                routeName: routeName, // Rota ismi eklendi (örn: "442", "M1")
              }),
            });

            if (!response.ok) {
              console.error(`[RouteSearch] API error for ${segment.mode}:`, response.status);
              continue;
            }

            const data = await response.json();
            const stops = data.data || [];
            console.log(`[RouteSearch] Found ${stops.length} real stops for ${routeName}`, stops);

            // Add markers for real stops from Places API
            for (const stop of stops) {
              const popupContent = `<div style="min-width: 160px; padding: 8px;">
                <div style="font-weight: bold; color: ${color}; font-size: 13px; margin-bottom: 4px;">
                  ${routeName} - ${modeLabel}
                </div>
                <div style="font-size: 12px; color: #333; font-weight: 500;">
                  ${stop.name}
                </div>
                <div style="font-size: 11px; color: #666; margin-top: 2px;">
                  ${stop.type === 'BUS_STOP' ? 'Otobüs Durağı' : stop.type === 'METRO_STATION' ? 'Metro İstasyonu' : 'Ankaray İstasyonu'}
                </div>
              </div>`;

              newStopMarkers.push({
                position: [stop.location.lat, stop.location.lng] as [number, number],
                popup: popupContent,
                icon: markerIcon,
              });
            }
          } catch (error) {
            console.error(`[RouteSearch] Error fetching stops for ${segment.mode}:`, error);
          }
        }
      }

      console.log('[RouteSearch] Total markers with real stops:', newStopMarkers.length);
      setMapMarkers(newStopMarkers);
    };

    // Fetch real stops asynchronously
    fetchRealStops();
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

    // Clear previous routes, polylines, and stop markers before new search
    console.log('[RouteSearch] Clearing previous routes and map data');
    dispatch(clearRoutes());
    setMapPolylines([]);

    // Reset map markers to only show origin and destination
    const initialMarkers = [];
    if (origin) {
      initialMarkers.push({
        position: [origin.lat, origin.lng] as [number, number],
        popup: `<strong>Başlangıç:</strong><br>${origin.address}`,
      });
    }
    if (destination) {
      initialMarkers.push({
        position: [destination.lat, destination.lng] as [number, number],
        popup: `<strong>Varış:</strong><br>${destination.address}`,
      });
    }
    setMapMarkers(initialMarkers);

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

  // Memoize map center and zoom to prevent unnecessary re-renders
  const mapCenter = useMemo<[number, number]>(() => {
    if (origin) {
      return [origin.lat, origin.lng];
    }
    return [39.9334, 32.8597]; // Default: Ankara coordinates
  }, [origin]);

  const mapZoom = useMemo(() => {
    return origin || destination ? 15 : 14;
  }, [origin, destination]);

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
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column: Search Form & Results */}
          <div className="xl:col-span-4 space-y-6">
            {/* Search Form */}
            <Card variant="glass" className="p-6 animate-scale-in">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Origin Input */}
                <LocationSearchInput
                  label="Nereden"
                  placeholder="Başlangıç noktası girin"
                  value={origin?.address || ''}
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
                  value={destination?.address || ''}
                  onLocationSelect={handleDestinationSelect}
                  error={errors.destination?.message}
                />

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

          {/* Middle Column: Map */}
          <div className="xl:col-span-5 xl:sticky xl:top-28 h-[calc(100vh-10rem)]">
            <Card variant="glass" className="h-full p-0 overflow-hidden shadow-xl animate-scale-in" style={{ animationDelay: '100ms' } as any}>
              <Map
                center={mapCenter}
                zoom={mapZoom}
                markers={mapMarkers}
                polylines={mapPolylines}
                className="h-full w-full rounded-2xl"
              />
            </Card>
          </div>

          {/* Right Column: Nearby Attractions */}
          <div className="xl:col-span-3 xl:sticky xl:top-28 h-[calc(100vh-10rem)]">
            {selectedRoute && destination ? (
              <NearbyAttractions destination={destination} />
            ) : (
              <Card variant="glass" className="p-6 h-full flex items-center justify-center animate-scale-in" style={{ animationDelay: '200ms' } as any}>
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Compass className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Gezilecek Yerler</p>
                  <p className="text-xs mt-1">Rota seçtiğinizde öneriler burada görünecek</p>
                </div>
              </Card>
            )}
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
