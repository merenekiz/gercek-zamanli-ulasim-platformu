/**
 * Google Transit Service
 * Google Directions API kullanarak toplu taşıma rotaları hesaplar
 */

import { Client, DirectionsRequest, TravelMode, TransitMode } from '@googlemaps/google-maps-services-js';
import { googleConfig } from '../config/google';
import logger from '../utils/logger';
import { redisClient } from '../config/database';

const client = new Client({});

interface TransitRouteRequest {
  origin: {
    lat: number;
    lng: number;
  };
  destination: {
    lat: number;
    lng: number;
  };
  departureTime?: Date;
  routingPreference?: 'fewer_transfers' | 'less_walking';
  language?: string;
  allowedModes?: string[]; // Kullanıcının seçtiği ulaşım modları
}

interface TransitRouteResult {
  routes: any[];
  status: string;
}

export class GoogleTransitService {
  /**
   * Backend TransportMode'u Google TransitMode'a dönüştür
   */
  private static mapTransportModeToGoogleMode(mode: string): TransitMode | null {
    switch (mode.toUpperCase()) {
      case 'BUS':
        return TransitMode.bus;
      case 'METRO':
        return TransitMode.subway;
      case 'ANKARAY':
        return TransitMode.rail;
      case 'TRAM':
        return TransitMode.tram;
      default:
        return null;
    }
  }

  /**
   * Toplu taşıma rotası hesapla
   */
  static async calculateTransitRoute(request: TransitRouteRequest): Promise<TransitRouteResult> {
    const { origin, destination, departureTime, routingPreference, language = 'tr', allowedModes } = request;

    // Kullanıcının seçtiği modları Google Transit Mode'a dönüştür
    let transitModes: TransitMode[] = [
      TransitMode.bus,
      TransitMode.rail,
      TransitMode.subway,
      TransitMode.train,
      TransitMode.tram,
    ];

    if (allowedModes && allowedModes.length > 0) {
      const mappedModes = allowedModes
        .map(mode => this.mapTransportModeToGoogleMode(mode))
        .filter((mode): mode is TransitMode => mode !== null);

      if (mappedModes.length > 0) {
        transitModes = mappedModes;
      }
    }

    // Cache key oluştur (modları da dahil et)
    const modesKey = allowedModes?.sort().join(',') || 'all';
    const cacheKey = `transit:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}:${departureTime?.getTime() || 'now'}:${routingPreference || 'default'}:${modesKey}`;

    try {
      // Cache'den kontrol et
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('Transit route returned from cache');
        return JSON.parse(cached);
      }

      // Google Directions API isteği
      const directionsRequest: DirectionsRequest = {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          mode: TravelMode.transit,
          transit_mode: transitModes,
          transit_routing_preference: (routingPreference || googleConfig.transitOptions.defaultPreference) as any,
          departure_time: departureTime || new Date(),
          language: language as any,
          key: googleConfig.apiKey,
          alternatives: true, // Alternatif rotalar
        },
        timeout: googleConfig.timeout.directions,
      };

      logger.info('Requesting transit route from Google Directions API', {
        origin,
        destination,
        departureTime: departureTime?.toISOString(),
      });

      const response = await client.directions(directionsRequest);

      if (response.data.status !== 'OK') {
        logger.warn('Google Directions API returned non-OK status', {
          status: response.data.status,
          errorMessage: response.data.error_message,
        });

        return {
          routes: [],
          status: response.data.status,
        };
      }

      const result = {
        routes: response.data.routes.map((route) => this.formatRoute(route)),
        status: response.data.status,
      };

      // Cache'e kaydet (30 dakika)
      await redisClient.setex(cacheKey, googleConfig.cache.routeTTL, JSON.stringify(result));

      logger.info('Transit route calculated successfully', {
        routeCount: result.routes.length,
      });

      return result;
    } catch (error: any) {
      logger.error('Error calculating transit route', {
        error: error.message,
        origin,
        destination,
      });

      throw new Error(`Transit route calculation failed: ${error.message}`);
    }
  }

  /**
   * Google route formatını backend formatına dönüştür
   */
  private static formatRoute(route: any) {
    const leg = route.legs[0]; // İlk leg (çok durma olmadığı için)

    return {
      summary: route.summary,
      duration: leg.duration.value, // Saniye
      durationText: leg.duration.text,
      distance: leg.distance.value, // Metre
      distanceText: leg.distance.text,
      startAddress: leg.start_address,
      endAddress: leg.end_address,
      startLocation: {
        lat: leg.start_location.lat,
        lng: leg.start_location.lng,
      },
      endLocation: {
        lat: leg.end_location.lat,
        lng: leg.end_location.lng,
      },
      departureTime: leg.departure_time?.value ? new Date(leg.departure_time.value * 1000) : null,
      arrivalTime: leg.arrival_time?.value ? new Date(leg.arrival_time.value * 1000) : null,
      steps: leg.steps.map((step: any) => this.formatStep(step)),
      polyline: route.overview_polyline.points,
    };
  }

  /**
   * Step formatla (her bir adım)
   */
  private static formatStep(step: any) {
    const formatted: any = {
      duration: step.duration.value,
      durationText: step.duration.text,
      distance: step.distance.value,
      distanceText: step.distance.text,
      startLocation: {
        lat: step.start_location.lat,
        lng: step.start_location.lng,
      },
      endLocation: {
        lat: step.end_location.lat,
        lng: step.end_location.lng,
      },
      travelMode: step.travel_mode,
      instructions: step.html_instructions.replace(/<[^>]*>/g, ''), // HTML tag'leri temizle
      polyline: step.polyline?.points,
    };

    // Toplu taşıma adımıysa detayları ekle
    if (step.travel_mode === 'TRANSIT' && step.transit_details) {
      const transit = step.transit_details;

      formatted.transit = {
        // Hat bilgisi
        line: {
          name: transit.line.name,
          shortName: transit.line.short_name,
          color: transit.line.color,
          textColor: transit.line.text_color,
          vehicle: {
            type: transit.line.vehicle.type, // BUS, RAIL, SUBWAY, TRAIN, TRAM
            name: transit.line.vehicle.name,
            icon: transit.line.vehicle.icon,
          },
          agency: {
            name: transit.line.agencies?.[0]?.name,
            url: transit.line.agencies?.[0]?.url,
          },
        },

        // Biniş durağı
        departureStop: {
          name: transit.departure_stop.name,
          location: {
            lat: transit.departure_stop.location.lat,
            lng: transit.departure_stop.location.lng,
          },
        },

        // İniş durağı
        arrivalStop: {
          name: transit.arrival_stop.name,
          location: {
            lat: transit.arrival_stop.location.lat,
            lng: transit.arrival_stop.location.lng,
          },
        },

        // Zaman bilgileri
        departureTime: transit.departure_time?.value ? new Date(transit.departure_time.value * 1000) : null,
        arrivalTime: transit.arrival_time?.value ? new Date(transit.arrival_time.value * 1000) : null,

        // Durak sayısı
        numStops: transit.num_stops,

        // Uyarı/bildirimler (varsa)
        headsign: transit.headsign,
      };
    }

    return formatted;
  }

  /**
   * Çoklu rota seçenekleri hesapla
   */
  static async getMultipleRouteOptions(request: TransitRouteRequest): Promise<any[]> {
    try {
      // Farklı routing preference'larla 2 farklı rota al
      const [fewerTransfersRoutes, lessWalkingRoutes] = await Promise.all([
        this.calculateTransitRoute({
          ...request,
          routingPreference: 'fewer_transfers',
        }),
        this.calculateTransitRoute({
          ...request,
          routingPreference: 'less_walking',
        }),
      ]);

      // Tüm rotaları birleştir ve benzersiz hale getir
      const allRoutes = [
        ...fewerTransfersRoutes.routes,
        ...lessWalkingRoutes.routes,
      ];

      // Benzersiz rotaları filtrele (polyline'a göre)
      const uniqueRoutes = allRoutes.filter(
        (route, index, self) =>
          index === self.findIndex((r) => r.polyline === route.polyline)
      );

      // Süreye göre sırala
      return uniqueRoutes.sort((a, b) => a.duration - b.duration);
    } catch (error: any) {
      logger.error('Error getting multiple route options', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Taksi/Araç rotası hesapla (en kısa/en az trafikli yol)
   */
  static async calculateDrivingRoute(request: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    departureTime?: Date;
    language?: string;
  }): Promise<any | null> {
    const { origin, destination, departureTime, language = 'tr' } = request;

    // Cache key oluştur
    const cacheKey = `driving:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}:${departureTime?.getTime() || 'now'}`;

    try {
      // Cache'den kontrol et
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('Driving route returned from cache');
        return JSON.parse(cached);
      }

      // Google Directions API isteği - DRIVING mode
      const directionsRequest: DirectionsRequest = {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          mode: TravelMode.driving,
          departure_time: departureTime || new Date(),
          traffic_model: 'best_guess' as any, // Trafik tahmini
          language: language as any,
          key: googleConfig.apiKey,
          alternatives: false, // Tek rota yeterli
        },
        timeout: googleConfig.timeout.directions,
      };

      logger.info('Requesting driving route from Google Directions API', {
        origin,
        destination,
      });

      const response = await client.directions(directionsRequest);

      if (response.data.status !== 'OK' || !response.data.routes[0]) {
        logger.warn('Google Directions API returned non-OK status for driving', {
          status: response.data.status,
        });
        return null;
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      // Taksi rotası formatla
      const result = {
        duration: leg.duration_in_traffic?.value || leg.duration.value, // Trafik dahil süre
        durationText: leg.duration_in_traffic?.text || leg.duration.text,
        distance: leg.distance.value,
        distanceText: leg.distance.text,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        startLocation: {
          lat: leg.start_location.lat,
          lng: leg.start_location.lng,
        },
        endLocation: {
          lat: leg.end_location.lat,
          lng: leg.end_location.lng,
        },
        polyline: route.overview_polyline.points,
        steps: leg.steps.map((step: any) => ({
          duration: step.duration.value,
          distance: step.distance.value,
          startLocation: {
            lat: step.start_location.lat,
            lng: step.start_location.lng,
          },
          endLocation: {
            lat: step.end_location.lat,
            lng: step.end_location.lng,
          },
          travelMode: 'DRIVING',
          instructions: step.html_instructions.replace(/<[^>]*>/g, ''),
          polyline: step.polyline?.points,
        })),
      };

      // Cache'e kaydet (15 dakika - trafik değişkenliği için daha kısa)
      await redisClient.setex(cacheKey, 900, JSON.stringify(result));

      logger.info('Driving route calculated successfully', {
        distance: result.distanceText,
        duration: result.durationText,
      });

      return result;
    } catch (error: any) {
      logger.error('Error calculating driving route', {
        error: error.message,
        origin,
        destination,
      });
      return null;
    }
  }

  /**
   * Rate limit kontrolü
   */
  static async checkRateLimit(userId: string): Promise<boolean> {
    const hourKey = `ratelimit:directions:hour:${userId}`;
    const dayKey = `ratelimit:directions:day:${userId}`;

    const [hourCount, dayCount] = await Promise.all([
      redisClient.incr(hourKey),
      redisClient.incr(dayKey),
    ]);

    // İlk increment ise TTL ayarla
    if (hourCount === 1) {
      await redisClient.expire(hourKey, 3600); // 1 saat
    }
    if (dayCount === 1) {
      await redisClient.expire(dayKey, 86400); // 1 gün
    }

    // Limit kontrolü
    if (hourCount > googleConfig.rateLimits.directionsPerHour) {
      logger.warn('Hourly rate limit exceeded', { userId, hourCount });
      return false;
    }

    if (dayCount > googleConfig.rateLimits.directionsPerDay) {
      logger.warn('Daily rate limit exceeded', { userId, dayCount });
      return false;
    }

    return true;
  }

  /**
   * Encoded polyline'ı decode et
   */
  static decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
    const points: Array<{ lat: number; lng: number }> = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }

    return points;
  }

  /**
   * Polyline boyunca transit durakları bul (Google Places API)
   */
  static async findTransitStopsAlongRoute(
    polyline: string,
    transportMode: string
  ): Promise<Array<{ name: string; lat: number; lng: number }>> {
    try {
      // Polyline'ı decode et
      const points = this.decodePolyline(polyline);
      if (points.length === 0) return [];

      // Polyline boyunca belirli aralıklarla nokta seç (her 5 noktada 1)
      const samplePoints = points.filter((_, i) => i % 5 === 0);
      if (samplePoints.length === 0) return [];

      // Orta noktayı al
      const midIndex = Math.floor(samplePoints.length / 2);
      const midPoint = samplePoints[midIndex];

      // Places API ile transit durağı ara
      const response = await client.placesNearby({
        params: {
          location: midPoint,
          radius: 500, // 500 metre yarıçap
          type: 'transit_station',
          key: googleConfig.apiKey,
          language: 'tr' as any,
        },
        timeout: 5000,
      });

      if (response.data.status !== 'OK' || !response.data.results) {
        return [];
      }

      // Sonuçları formatla ve polyline'a yakın olanları filtrele
      const stops = response.data.results
        .slice(0, 10) // Maksimum 10 durak
        .map((place: any) => ({
          name: place.name,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        }));

      logger.debug(`Found ${stops.length} transit stops along route`);
      return stops;
    } catch (error: any) {
      logger.error('Error finding transit stops:', error.message);
      return [];
    }
  }
}

export default GoogleTransitService;