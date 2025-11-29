import { Client } from '@googlemaps/google-maps-services-js';
import polyline from '@mapbox/polyline';

interface TransitStop {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  type: 'BUS_STOP' | 'METRO_STATION' | 'ANKARAY_STATION';
  stopId?: string; // Durdurma kimliği
}

export class TransitStopsService {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * Google Places API ile yakındaki durakları getir
   */
  async getNearbyStops(
    location: { lat: number; lng: number },
    radius: number = 200,  // 200 metre - daha dar arama alanı
    types: string[] = ['bus_station', 'subway_station', 'transit_station']
  ): Promise<TransitStop[]> {
    try {
      console.log('[TransitStopsService] 🔍 Fetching nearby stops:', {
        location,
        radius,
        type: types[0],
        hasApiKey: !!this.apiKey,
        apiKeyLength: this.apiKey?.length
      });

      const response = await this.client.placesNearby({
        params: {
          location: location,
          radius: radius,
          type: types[0], // Google API tek type alıyor
          key: this.apiKey,
        },
      });

      console.log('[TransitStopsService] 📡 Google Places API response:', {
        status: response.data.status,
        resultsCount: response.data.results?.length || 0,
        errorMessage: response.data.error_message
      });

      const stops: TransitStop[] = [];

      for (const place of response.data.results) {
        if (place.geometry && place.geometry.location) {
          stops.push({
            id: place.place_id || '',
            name: place.name || 'Unknown Stop',
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            type: this.mapPlaceTypeToStopType(place.types || []),
            stopId: place.place_id, // Google Place ID'yi durdurma kimliği olarak kullan
          });
        }
      }

      console.log('[TransitStopsService] ✅ Processed stops:', stops.length);
      return stops;
    } catch (error: any) {
      console.error('[TransitStopsService] ❌ Error fetching nearby stops:', {
        message: error.message,
        stack: error.stack
      });
      return [];
    }
  }

  /**
   * İki koordinat arasındaki mesafeyi Haversine formülü ile hesapla (metre cinsinden)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Dünya'nın yarıçapı (metre)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Metre cinsinden mesafe
  }

  /**
   * Bir noktanın polyline'a olan minimum mesafesini hesapla
   */
  private getMinimumDistanceToPolyline(
    point: { lat: number; lng: number },
    polylineCoords: [number, number][]
  ): number {
    let minDistance = Infinity;

    // Her polyline segmenti için minimum mesafeyi bul
    for (const [lat, lng] of polylineCoords) {
      const distance = this.calculateDistance(point.lat, point.lng, lat, lng);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    return minDistance;
  }

  /**
   * Google Places Text Search ile spesifik rota için durak ara
   */
  async searchStopsByRouteName(
    routeName: string,
    transitMode: 'BUS' | 'METRO' | 'ANKARAY',
    location: { lat: number; lng: number }
  ): Promise<TransitStop[]> {
    try {
      // Arama query'si oluştur
      let query = '';
      if (transitMode === 'BUS') {
        query = `${routeName} otobüs durağı Ankara`;
      } else if (transitMode === 'METRO') {
        query = `${routeName} metro durağı Ankara`;
      } else if (transitMode === 'ANKARAY') {
        query = `${routeName} ankaray durağı Ankara`;
      }

      console.log('[TransitStopsService] 🔍 Text Search query:', query);

      const response = await this.client.textSearch({
        params: {
          query: query,
          location: location,
          radius: 10000, // 10km yarıçap
          key: this.apiKey,
          language: 'tr' as any,
        },
      });

      console.log('[TransitStopsService] 📡 Text Search response:', {
        status: response.data.status,
        resultsCount: response.data.results?.length || 0,
      });

      const stops: TransitStop[] = [];

      for (const place of response.data.results) {
        if (place.geometry && place.geometry.location) {
          stops.push({
            id: place.place_id || '',
            name: place.name || 'Unknown Stop',
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            type: this.mapPlaceTypeToStopType(place.types || []),
            stopId: place.place_id,
          });
        }
      }

      console.log('[TransitStopsService] ✅ Found stops via Text Search:', stops.length);
      return stops;
    } catch (error: any) {
      console.error('[TransitStopsService] ❌ Error in Text Search:', {
        message: error.message,
      });
      return [];
    }
  }

  /**
   * Rota üzerindeki durakları getir (sadece polyline'a yakın olanlar)
   */
  async getStopsAlongRoute(
    routePolyline: string,
    transitMode: 'BUS' | 'METRO' | 'ANKARAY',
    routeName?: string // Rota ismi eklendi (örn: "442", "M1")
  ): Promise<TransitStop[]> {
    try {
      console.log('[TransitStopsService] 🚌 Getting stops along route:', {
        transitMode,
        routeName: routeName || 'not provided'
      });

      // Polyline'ı decode et
      const coordinates = polyline.decode(routePolyline);
      console.log('[TransitStopsService] 📍 Decoded coordinates:', coordinates.length);

      if (coordinates.length === 0) {
        console.log('[TransitStopsService] ⚠️ No coordinates decoded from polyline');
        return [];
      }

      let allStops: TransitStop[] = [];
      const seenStopIds = new Set<string>();

      // Sadece Nearby Search kullan - Text Search yanlış sonuçlar veriyor
      console.log('[TransitStopsService] 📍 Using Nearby Search to find stops along polyline');

      // Transit mode'a göre arama tipini belirle
      const searchType = this.getSearchTypeForMode(transitMode);
      console.log('[TransitStopsService] 🔎 Search type:', searchType);

      // Rota üzerinde belirli aralıklarla noktalar seç - ÇOK sık sample et
      // Google Places API verisi eksik olduğu için her 5 noktada bir ara
      const samplingRate = Math.max(1, Math.floor(coordinates.length / 5));
      console.log('[TransitStopsService] 📊 Sampling rate:', samplingRate, 'points to check:', Math.ceil(coordinates.length / samplingRate));

      // Her örnek nokta için yakındaki durakları al
      for (let i = 0; i < coordinates.length; i += samplingRate) {
        const [lat, lng] = coordinates[i];

        const nearbyStops = await this.getNearbyStops(
          { lat, lng },
          500, // 500 metre yarıçap - geniş arama Google'ın eksik verisi için
          [searchType]
        );

        // Tekrar eden durakları filtrele
        for (const stop of nearbyStops) {
          if (!seenStopIds.has(stop.stopId || stop.id)) {
            seenStopIds.add(stop.stopId || stop.id);
            allStops.push(stop);
          }
        }
      }

      console.log(`[TransitStopsService] 🔍 Found ${allStops.length} stops near route, filtering with distance...`);

      // Polyline'a makul mesafede olan durakları filtrele
      // Dengelenmiş threshold - Google Places API sınırlamaları nedeniyle
      const maxDistanceFromRoute = transitMode === 'BUS' ? 120 : 100; // Otobüs: 120m, Metro/Ankaray: 100m
      const stopsOnRoute = allStops.filter((stop) => {
        const distance = this.getMinimumDistanceToPolyline(stop.location, coordinates);
        const isOnRoute = distance <= maxDistanceFromRoute;

        if (isOnRoute) {
          console.log(`[TransitStopsService] ✅ Stop "${stop.name}" is on route (${Math.round(distance)}m from polyline)`);
        } else {
          console.log(`[TransitStopsService] ❌ Stop "${stop.name}" filtered out (${Math.round(distance)}m from polyline)`);
        }

        return isOnRoute;
      });

      console.log(`[TransitStopsService] ✅ Found ${stopsOnRoute.length} stops ON the route for ${transitMode}`);
      return stopsOnRoute;
    } catch (error: any) {
      console.error('[TransitStopsService] ❌ Error fetching stops along route:', {
        message: error.message,
        transitMode
      });
      return [];
    }
  }

  /**
   * Transit mode için Google Places API search type'ını belirle
   */
  private getSearchTypeForMode(mode: 'BUS' | 'METRO' | 'ANKARAY'): string {
    // Google Places API'de Ankara otobüs durakları verisi çok eksik
    // Bu yüzden bus için de 'transit_station' kullanıyoruz (daha geniş arama)
    switch (mode) {
      case 'BUS':
        return 'transit_station'; // bus_station yerine transit_station
      case 'METRO':
        return 'subway_station';
      case 'ANKARAY':
        return 'light_rail_station';
      default:
        return 'transit_station';
    }
  }

  /**
   * Place type'ı durak tipine dönüştür
   */
  private mapPlaceTypeToStopType(types: string[]): 'BUS_STOP' | 'METRO_STATION' | 'ANKARAY_STATION' {
    if (types.includes('bus_station') || types.includes('bus_stop')) {
      return 'BUS_STOP';
    }
    if (types.includes('subway_station') || types.includes('metro_station')) {
      return 'METRO_STATION';
    }
    if (types.includes('light_rail_station')) {
      return 'ANKARAY_STATION';
    }
    return 'BUS_STOP'; // Default
  }

  /**
   * Belirli bir stop ID ile durak detaylarını getir
   */
  async getStopDetails(stopId: string): Promise<TransitStop | null> {
    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: stopId,
          key: this.apiKey,
        },
      });

      const place = response.data.result;
      if (place && place.geometry && place.geometry.location) {
        return {
          id: place.place_id || '',
          name: place.name || 'Unknown Stop',
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          type: this.mapPlaceTypeToStopType(place.types || []),
          stopId: place.place_id,
        };
      }

      return null;
    } catch (error) {
      console.error('[TransitStopsService] Error fetching stop details:', error);
      return null;
    }
  }
}

export default new TransitStopsService();
