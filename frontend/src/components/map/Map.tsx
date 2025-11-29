'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    icon?: google.maps.Icon | google.maps.Symbol;
  }>;
  polylines?: Array<{
    positions: [number, number][];
    color?: string;
    weight?: number;
    opacity?: number;
  }>;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Map Component
 *
 * Google Maps integration
 *
 * @example
 * <Map
 *   center={[39.9334, 32.8597]}
 *   zoom={13}
 *   markers={[
 *     { position: [39.9334, 32.8597], popup: 'Ankara' }
 *   ]}
 * />
 */
export default function Map({
  center = [39.9334, 32.8597], // Ankara coordinates
  zoom = 13,
  markers = [],
  polylines = [],
  onMapClick,
  className = '',
  style = {},
}: MapProps) {
  console.log('[Map] Component rendering...', { center, zoom });

  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('[Map] State:', { isLoading, error });

  // Initialize Google Maps when container ref is set
  const initializeMap = useCallback((container: HTMLDivElement | null) => {
    console.log('[Map] initializeMap callback çağrıldı', { hasContainer: !!container, hasMap: !!mapRef.current });

    if (!container) {
      console.log('[Map] Container null, çıkılıyor');
      return;
    }

    if (mapRef.current) {
      console.log('[Map] Map zaten var, çıkılıyor');
      return;
    }

    console.log('[Map] Initializing map with container...');

    // Store container ref for later use
    mapContainerRef.current = container;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    console.log('[Map] Google Maps API Key:', apiKey ? 'Var' : 'Yok');

    if (!apiKey) {
      console.error('Google Maps API key bulunamadı!');
      setError('Google Maps API key bulunamadı');
      setIsLoading(false);
      return;
    }

    // Timeout after 15 seconds
    const timeoutId = setTimeout(() => {
      console.error('Google Maps yükleme timeout');
      setError('Harita yükleme zaman aşımına uğradı');
      setIsLoading(false);
    }, 15000);

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry', 'geocoding'],
    });

    console.log('[Map] Google Maps yükleniyor...');

    loader
      .load()
      .then(() => {
        clearTimeout(timeoutId);
        console.log('[Map] Google Maps API yüklendi!');

        if (!container) {
          console.error('[Map] Map container bulunamadı');
          return;
        }

        console.log('[Map] Harita oluşturuluyor...', { lat: center[0], lng: center[1], zoom });

        // Create map instance with current center and zoom
        const map = new google.maps.Map(container, {
          center: { lat: center[0], lng: center[1] },
          zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }],
            },
          ],
        });

        console.log('[Map] Harita oluşturuldu!');

        // Handle map click
        if (onMapClick) {
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onMapClick(e.latLng.lat(), e.latLng.lng());
            }
          });
        }

        mapRef.current = map;
        setIsLoading(false);
        console.log('[Map] Harita hazır!');
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error('[Map] Google Maps yükleme hatası:', error);
        setError(`Harita yüklenemedi: ${error.message || 'Bilinmeyen hata'}`);
        setIsLoading(false);
      });
  }, []); // Empty dependencies - only create once

  // Update center and zoom
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter({ lat: center[0], lng: center[1] });
      mapRef.current.setZoom(zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    console.log('[Map] Updating markers, count:', markers.length);

    // Remove old markers and info windows
    markersRef.current.forEach((marker) => marker.setMap(null));
    infoWindowsRef.current.forEach((infoWindow) => infoWindow.close());
    markersRef.current = [];
    infoWindowsRef.current = [];

    // Add new markers
    markers.forEach(({ position, popup, icon }, index) => {
      console.log(`[Map] Adding marker ${index}:`, {
        position,
        hasIcon: !!icon,
        iconType: icon ? (typeof icon) : 'none',
      });

      // Convert plain icon object to Google Maps format if needed
      let processedIcon: google.maps.Icon | google.maps.Symbol | string | undefined = icon;

      if (icon && typeof icon === 'object' && 'url' in icon) {
        const urlIcon = icon as any;

        console.log(`[Map] Processing icon for marker ${index}:`, {
          url: urlIcon.url,
          scaledSize: urlIcon.scaledSize,
          anchor: urlIcon.anchor,
        });

        processedIcon = {
          url: urlIcon.url,
          scaledSize: urlIcon.scaledSize
            ? new google.maps.Size(urlIcon.scaledSize.width, urlIcon.scaledSize.height)
            : new google.maps.Size(24, 24), // Default size
          anchor: urlIcon.anchor
            ? new google.maps.Point(urlIcon.anchor.x, urlIcon.anchor.y)
            : new google.maps.Point(12, 12), // Default anchor (center)
        } as google.maps.Icon;

        console.log(`[Map] Processed icon for marker ${index}:`, processedIcon);
      }

      try {
        const marker = new google.maps.Marker({
          position: { lat: position[0], lng: position[1] },
          map: mapRef.current!,
          icon: processedIcon,
          animation: google.maps.Animation.DROP,
        });

        console.log(`[Map] Marker ${index} created successfully`);

        if (popup) {
          const infoWindow = new google.maps.InfoWindow({
            content: popup,
          });

          marker.addListener('click', () => {
            // Close all other info windows
            infoWindowsRef.current.forEach((iw) => iw.close());
            infoWindow.open(mapRef.current!, marker);
          });

          infoWindowsRef.current.push(infoWindow);
        }

        markersRef.current.push(marker);
      } catch (error) {
        console.error(`[Map] Error creating marker ${index}:`, error);
      }
    });

    console.log('[Map] Total markers added:', markersRef.current.length);
  }, [markers]);

  // Update polylines
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old polylines
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];

    // Add new polylines
    polylines.forEach(({ positions, color = '#1E3A5F', weight = 5, opacity = 0.8 }) => {
      const polyline = new google.maps.Polyline({
        path: positions.map(([lat, lng]) => ({ lat, lng })),
        geodesic: true,
        strokeColor: color,
        strokeOpacity: opacity,
        strokeWeight: weight,
        map: mapRef.current!,
      });

      polylinesRef.current.push(polyline);
    });

    // Fit bounds if polylines exist
    if (polylines.length > 0 && polylines[0].positions.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      polylines.forEach((polyline) => {
        polyline.positions.forEach(([lat, lng]) => {
          bounds.extend({ lat, lng });
        });
      });
      mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [polylines]);

  return (
    <div className={`w-full h-full relative ${className}`} style={{ minHeight: '400px', ...style }}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-600 dark:text-gray-400">Harita yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg z-10">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Lütfen Google Maps API key'ini kontrol edin
            </p>
          </div>
        </div>
      )}

      {/* Map Container - Always rendered so ref callback is called */}
      <div
        ref={initializeMap}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
