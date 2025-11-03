/**
 * Rota Planlama Servisi
 *
 * Bu servis, kullanıcının başlangıç ve bitiş noktaları arasında
 * çok modlu ulaşım seçenekleri ile rota hesaplar.
 */

import axios from 'axios';
import { redisClient } from '../config/database';
import {
  RouteRequest,
  RouteOption,
  RouteSegment,
  TransportMode,
  Location,
} from '../types';
import TaxiFareService from './taxiFareService';
import logger from '../utils/logger';

class RouteService {
  private readonly GOOGLE_DIRECTIONS_API_KEY = process.env.GOOGLE_DIRECTIONS_API_KEY || '';
  private readonly OSRM_API_URL = 'https://router.project-osrm.org';
  private readonly CACHE_TTL = 300; // 5 dakika

  /**
   * Rota arama - Çok modlu seçenekler döndürür
   */
  async searchRoutes(request: RouteRequest): Promise<RouteOption[]> {
    try {
      // Cache kontrolü
      const cacheKey = this.generateCacheKey(request);
      const cachedResult = await this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug('Route found in cache');
        return cachedResult;
      }

      const routes: RouteOption[] = [];

      // Her ulaşım modu için rota hesapla
      for (const mode of request.modes) {
        try {
          let routeOption: RouteOption | null = null;

          switch (mode) {
            case TransportMode.WALKING:
              routeOption = await this.calculateWalkingRoute(request);
              break;
            case TransportMode.TAXI:
            case TransportMode.UBER:
            case TransportMode.BOLT:
              routeOption = await this.calculateTaxiRoute(request, mode);
              break;
            case TransportMode.BUS:
            case TransportMode.METRO:
            case TransportMode.TRAM:
            case TransportMode.ANKARAY:
              routeOption = await this.calculatePublicTransitRoute(request, mode);
              break;
            default:
              logger.warn(`Unsupported transport mode: ${mode}`);
          }

          if (routeOption) {
            routes.push(routeOption);
          }
        } catch (error) {
          logger.error(`Error calculating route for mode ${mode}:`, error);
        }
      }

      // Rotaları performansa göre sırala
      const sortedRoutes = this.sortRoutes(routes, request.preferences);

      // Cache'e kaydet
      await this.saveToCache(cacheKey, sortedRoutes);

      return sortedRoutes;
    } catch (error) {
      logger.error('Route search error:', error);
      throw new Error('Rota arama sırasında hata oluştu');
    }
  }

  /**
   * Yürüme rotası hesapla (OSRM kullanarak)
   */
  private async calculateWalkingRoute(request: RouteRequest): Promise<RouteOption> {
    const { origin, destination } = request;

    // OSRM API çağrısı
    const url = `${this.OSRM_API_URL}/route/v1/foot/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;

    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    if (!data.routes || data.routes.length === 0) {
      throw new Error('Yürüme rotası bulunamadı');
    }

    const route = data.routes[0];
    const distanceMeters = route.distance;
    const durationSeconds = Math.ceil(route.duration);

    const segment: RouteSegment = {
      mode: TransportMode.WALKING,
      from: { ...origin, name: 'Başlangıç' },
      to: { ...destination, name: 'Varış' },
      distance: distanceMeters,
      duration: durationSeconds,
      instructions: 'Yürüyerek git',
      polyline: JSON.stringify(route.geometry),
    };

    const now = new Date();
    return {
      id: this.generateRouteId(),
      segments: [segment],
      totalDistance: distanceMeters,
      totalDuration: durationSeconds,
      totalCost: 0,
      departureTime: now,
      arrivalTime: new Date(now.getTime() + durationSeconds * 1000),
      isEcoFriendly: true,
      carbonFootprint: 0,
    };
  }

  /**
   * Taksi rotası hesapla
   */
  private async calculateTaxiRoute(
    request: RouteRequest,
    mode: TransportMode
  ): Promise<RouteOption> {
    const { origin, destination } = request;

    // OSRM ile araç rotası hesapla
    const url = `${this.OSRM_API_URL}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    if (!data.routes || data.routes.length === 0) {
      throw new Error('Araç rotası bulunamadı');
    }

    const route = data.routes[0];
    const distanceMeters = route.distance;
    const durationSeconds = Math.ceil(route.duration);

    // Taksi ücreti hesapla
    let estimatedCost = 0;
    if (mode === TransportMode.TAXI) {
      // TODO: Veritabanından taksi tarifesini al
      const mockFareConfig = {
        id: 'mock',
        cityId: 'mock',
        openingFee: 15.0,
        perKmRate: 12.5,
        minFare: 50.0,
        waitingFeePerHour: 150.0,
        validFrom: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const fareEstimate = TaxiFareService.calculateFare(mockFareConfig, {
        distance: distanceMeters,
        duration: Math.ceil(durationSeconds / 60),
        isNightTime: TaxiFareService.isNightTime(),
      });

      estimatedCost = fareEstimate.totalFare;
    }

    const segment: RouteSegment = {
      mode,
      from: { ...origin, name: 'Başlangıç' },
      to: { ...destination, name: 'Varış' },
      distance: distanceMeters,
      duration: durationSeconds,
      instructions: `${mode} ile git`,
      polyline: JSON.stringify(route.geometry),
    };

    const now = new Date();
    return {
      id: this.generateRouteId(),
      segments: [segment],
      totalDistance: distanceMeters,
      totalDuration: durationSeconds,
      totalCost: estimatedCost,
      departureTime: now,
      arrivalTime: new Date(now.getTime() + durationSeconds * 1000),
      carbonFootprint: (distanceMeters / 1000) * 0.12, // kg CO2 per km
    };
  }

  /**
   * Toplu taşıma rotası hesapla
   * NOT: Gerçek implementasyon için GTFS verisi ve routing algoritması gerekli
   */
  private async calculatePublicTransitRoute(
    request: RouteRequest,
    mode: TransportMode
  ): Promise<RouteOption> {
    // TODO: Gerçek toplu taşıma routing
    // Bu basitleştirilmiş bir örnek
    const { origin, destination } = request;

    const distanceMeters = TaxiFareService.calculateDistanceBetweenPoints(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );

    // Ortalama hız: Metro 40 km/h, Otobüs 25 km/h
    const avgSpeed = mode === TransportMode.METRO ? 40 : 25;
    const durationSeconds = Math.ceil((distanceMeters / 1000 / avgSpeed) * 3600);

    // Yürüme segmentleri ekle (süreleri saniyeye çevir)
    const segments: RouteSegment[] = [
      {
        mode: TransportMode.WALKING,
        from: { ...origin, name: 'Başlangıç' },
        to: { ...origin, name: 'Durak' },
        distance: 200,
        duration: 180, // 3 dakika = 180 saniye
        instructions: 'En yakın durağa yürü',
      },
      {
        mode,
        from: { ...origin, name: 'Durak' },
        to: { ...destination, name: 'Hedef Durak' },
        distance: distanceMeters - 400,
        duration: durationSeconds,
        instructions: `${mode} ile seyahat et`,
        routeInfo: {
          routeName: `${mode} Hattı`,
          stops: Math.ceil(distanceMeters / 1000),
        },
      },
      {
        mode: TransportMode.WALKING,
        from: { ...destination, name: 'Durak' },
        to: { ...destination, name: 'Varış' },
        distance: 200,
        duration: 180, // 3 dakika = 180 saniye
        instructions: 'Varış noktasına yürü',
      },
    ];

    const now = new Date();
    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

    return {
      id: this.generateRouteId(),
      segments,
      totalDistance: distanceMeters,
      totalDuration,
      totalCost: 17.5, // Ankara kart ücreti
      departureTime: now,
      arrivalTime: new Date(now.getTime() + totalDuration * 60000),
      isEcoFriendly: true,
      carbonFootprint: (distanceMeters / 1000) * 0.04, // kg CO2 per km
    };
  }

  /**
   * Rotaları sırala (hız, maliyet, çevre dostu)
   */
  private sortRoutes(routes: RouteOption[], preferences?: RouteRequest['preferences']): RouteOption[] {
    const sorted = [...routes];

    if (preferences?.preferFastest) {
      sorted.sort((a, b) => a.totalDuration - b.totalDuration);
      if (sorted[0]) sorted[0].isFastest = true;
    }

    if (preferences?.preferCheapest) {
      sorted.sort((a, b) => (a.totalCost || 0) - (b.totalCost || 0));
      if (sorted[0]) sorted[0].isCheapest = true;
    }

    return sorted;
  }

  /**
   * Cache key oluştur
   */
  private generateCacheKey(request: RouteRequest): string {
    const { origin, destination, modes } = request;
    return `route:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}:${modes.join(',')}`;
  }

  /**
   * Cache'den oku
   */
  private async getFromCache(key: string): Promise<RouteOption[] | null> {
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.error('Cache read error:', error);
    }
    return null;
  }

  /**
   * Cache'e yaz
   */
  private async saveToCache(key: string, data: RouteOption[]): Promise<void> {
    try {
      await redisClient.setex(key, this.CACHE_TTL, JSON.stringify(data));
    } catch (error) {
      logger.error('Cache write error:', error);
    }
  }

  /**
   * Benzersiz rota ID oluştur
   */
  private generateRouteId(): string {
    return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new RouteService();
