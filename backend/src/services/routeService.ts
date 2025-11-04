/**
 * Rota Planlama Servisi - Google Transit API
 *
 * Bu servis, kullanıcının başlangıç ve bitiş noktaları arasında
 * SADECE TOPLU TAŞIMA seçenekleri ile rota hesaplar.
 *
 * Desteklenen Modlar:
 * - Otobüs (BUS)
 * - Metro (METRO/SUBWAY)
 * - Tramvay (TRAM)
 * - Tren (TRAIN/RAIL)
 * - Ankaray (TRAM)
 */

import { redisClient } from '../config/database';
import {
  RouteRequest,
  RouteOption,
  RouteSegment,
  TransportMode,
} from '../types';
import logger from '../utils/logger';
import { GoogleTransitService } from './googleTransitService';

class RouteService {
  private readonly CACHE_TTL = 1800; // 30 dakika

  /**
   * Rota arama - Toplu taşıma seçenekleri döndürür
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

      // Google Transit API ile rota seçenekleri al
      const routes = await this.calculateTransitRoutes(request);

      // Rotaları sırala
      const sortedRoutes = this.sortRoutes(routes, request.preferences);

      // Cache'e kaydet
      await this.saveToCache(cacheKey, sortedRoutes);

      logger.info(`Found ${sortedRoutes.length} transit routes`, {
        origin: request.origin,
        destination: request.destination,
      });

      return sortedRoutes;
    } catch (error: any) {
      logger.error('Route search error:', error);
      throw new Error('Rota arama sırasında hata oluştu: ' + error.message);
    }
  }

  /**
   * Google Transit API ile toplu taşıma rotaları hesapla
   */
  private async calculateTransitRoutes(request: RouteRequest): Promise<RouteOption[]> {
    const { origin, destination, departureTime, userId, modes } = request;

    // Rate limit kontrolü
    if (userId) {
      const allowed = await GoogleTransitService.checkRateLimit(userId);
      if (!allowed) {
        throw new Error('İstek limiti aşıldı. Lütfen daha sonra tekrar deneyin.');
      }
    }

    // Google Transit API'den rota seçenekleri al
    const transitResult = await GoogleTransitService.getMultipleRouteOptions({
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      departureTime,
      language: 'tr',
      allowedModes: modes, // Kullanıcının seçtiği modları geç
    });

    if (!transitResult || transitResult.length === 0) {
      logger.warn('No transit routes found', { origin, destination });
      return [];
    }

    // Google formatını backend formatına dönüştür
    let routes: RouteOption[] = transitResult.map((googleRoute) =>
      this.convertGoogleRouteToRouteOption(googleRoute)
    );

    console.log('[RouteService] Total routes before filtering:', routes.length);
    console.log('[RouteService] User selected modes:', modes);

    // Kullanıcının seçtiği modlara göre filtrele
    if (modes && modes.length > 0) {
      const initialCount = routes.length;
      routes = routes.filter((route) => {
        // Rotadaki tüm segmentler izin verilen modlardan mı kontrol et
        const routeModes = route.segments
          .filter(seg => seg.mode !== TransportMode.WALKING) // Yürümeyi hariç tut
          .map(seg => seg.mode);

        console.log('[RouteService] Route modes:', routeModes, 'Allowed modes:', modes);

        // Eğer rotada hiç toplu taşıma yoksa (sadece yürüme varsa) ve WALKING seçilmişse kabul et
        if (routeModes.length === 0 && modes.includes(TransportMode.WALKING)) {
          console.log('[RouteService] Route accepted: Only walking');
          return true;
        }

        // Rotadaki en az bir modun kullanıcının seçtikleri arasında olması gerekir
        const isAccepted = routeModes.some(mode => modes.includes(mode));
        console.log('[RouteService] Route accepted:', isAccepted);
        return isAccepted;
      });

      console.log('[RouteService] Routes after filtering:', routes.length, 'from', initialCount);
    }

    return routes;
  }

  /**
   * Google route'u RouteOption formatına dönüştür
   */
  private convertGoogleRouteToRouteOption(
    googleRoute: any
  ): RouteOption {
    const segments: RouteSegment[] = [];

    // Her adımı segment olarak ekle
    for (const step of googleRoute.steps) {
      const segment: RouteSegment = {
        mode: this.mapGoogleModeToTransportMode(step.travelMode, step.transit?.line?.vehicle?.type),
        from: {
          lat: step.startLocation.lat,
          lng: step.startLocation.lng,
          name: step.transit?.departureStop?.name || 'Başlangıç',
        },
        to: {
          lat: step.endLocation.lat,
          lng: step.endLocation.lng,
          name: step.transit?.arrivalStop?.name || 'Varış',
        },
        distance: step.distance,
        duration: step.duration,
        instructions: step.instructions,
        polyline: step.polyline,
      };

      // Transit (toplu taşıma) adımıysa detayları ekle
      if (step.transit) {
        segment.routeInfo = {
          routeName: step.transit.line.shortName || step.transit.line.name,
          routeLongName: step.transit.line.name,
          routeColor: step.transit.line.color,
          routeTextColor: step.transit.line.textColor,
          vehicleType: step.transit.line.vehicle.type,
          vehicleName: step.transit.line.vehicle.name,
          vehicleIcon: step.transit.line.vehicle.icon,
          departureStop: step.transit.departureStop.name,
          arrivalStop: step.transit.arrivalStop.name,
          departureTime: step.transit.departureTime,
          arrivalTime: step.transit.arrivalTime,
          stops: step.transit.numStops,
          headsign: step.transit.headsign,
          agency: step.transit.line.agency?.name,
        };
      }

      segments.push(segment);
    }

    // Toplam değerleri hesapla
    const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

    // Toplu taşıma ücreti (Ankara kart)
    const totalCost = this.calculateTransitCost(segments);

    return {
      id: this.generateRouteId(),
      segments,
      totalDistance,
      totalDuration,
      totalCost,
      departureTime: googleRoute.departureTime || new Date(),
      arrivalTime: googleRoute.arrivalTime || new Date(Date.now() + totalDuration * 1000),
      isEcoFriendly: true,
      carbonFootprint: (totalDistance / 1000) * 0.04, // kg CO2 per km (toplu taşıma)
    };
  }

  /**
   * Google travel mode'u TransportMode'a dönüştür
   */
  private mapGoogleModeToTransportMode(
    travelMode: string,
    vehicleType?: string
  ): TransportMode {
    if (travelMode === 'WALKING') {
      return TransportMode.WALKING;
    }

    if (travelMode === 'TRANSIT' && vehicleType) {
      switch (vehicleType.toUpperCase()) {
        case 'BUS':
          return TransportMode.BUS;
        case 'SUBWAY':
        case 'METRO_RAIL':
          return TransportMode.METRO;
        case 'TRAM':
        case 'LIGHT_RAIL':
          return TransportMode.TRAM;
        case 'TRAIN':
        case 'HEAVY_RAIL':
        case 'COMMUTER_TRAIN':
          return TransportMode.ANKARAY; // Ankaray için TRAIN kullan
        case 'RAIL':
          return TransportMode.METRO;
        default:
          return TransportMode.BUS; // Default
      }
    }

    return TransportMode.BUS; // Fallback
  }

  /**
   * Toplu taşıma ücreti hesapla
   */
  private calculateTransitCost(segments: RouteSegment[]): number {
    // Ankara kart ücreti
    const transitSegments = segments.filter(
      (seg) => seg.mode !== TransportMode.WALKING
    );

    // Her biniş için 1 Ankara kart (17.70 TL)
    // Aktarmalar: İlk 45 dakika içinde ücretsiz
    return transitSegments.length > 0 ? 17.70 : 0;
  }

  /**
   * Rotaları sırala (hız, maliyet, aktarma sayısı)
   */
  private sortRoutes(
    routes: RouteOption[],
    preferences?: RouteRequest['preferences']
  ): RouteOption[] {
    const sorted = [...routes];

    // Varsayılan: En hızlı rotayı önce göster
    sorted.sort((a, b) => {
      // 1. Önce süreye göre
      const durationDiff = a.totalDuration - b.totalDuration;
      if (Math.abs(durationDiff) > 300) {
        // 5 dakikadan fazla fark varsa
        return durationDiff;
      }

      // 2. Süre benzer ise aktarma sayısına göre
      const aTransfers = a.segments.filter((s) => s.mode !== TransportMode.WALKING).length;
      const bTransfers = b.segments.filter((s) => s.mode !== TransportMode.WALKING).length;
      return aTransfers - bTransfers;
    });

    // En hızlı rotayı işaretle
    if (sorted[0]) {
      sorted[0].isFastest = true;
    }

    // Preferences varsa özel sıralama
    if (preferences?.preferFastest) {
      sorted.sort((a, b) => a.totalDuration - b.totalDuration);
    }

    if (preferences?.preferCheapest) {
      sorted.sort((a, b) => (a.totalCost || 0) - (b.totalCost || 0));
    }

    return sorted;
  }

  /**
   * Cache key oluştur
   */
  private generateCacheKey(request: RouteRequest): string {
    const { origin, destination, departureTime } = request;
    const timeKey = departureTime ? departureTime.getTime() : 'now';
    return `transit:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}:${timeKey}`;
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
    return `route_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

export default new RouteService();