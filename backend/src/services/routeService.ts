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
   * Rota arama - Toplu taşıma ve taksi seçenekleri döndürür
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

      // Google Transit API ile rota seçenekleri al + Taksi rotası
      const [transitRoutes, taxiRoute] = await Promise.all([
        this.calculateTransitRoutes(request),
        this.calculateTaxiRoute(request),
      ]);

      // Tüm rotaları birleştir
      let routes = [...transitRoutes];
      if (taxiRoute) {
        routes.push(taxiRoute);
      }

      // Rotaları sırala
      const sortedRoutes = this.sortRoutes(routes, request.preferences);

      // Cache'e kaydet
      await this.saveToCache(cacheKey, sortedRoutes);

      logger.info(`Found ${sortedRoutes.length} routes (${transitRoutes.length} transit + ${taxiRoute ? 1 : 0} taxi)`, {
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
   * Taksi rotası hesapla
   */
  private async calculateTaxiRoute(request: RouteRequest): Promise<RouteOption | null> {
    const { origin, destination, departureTime, modes } = request;

    // Kullanıcı TAXI modunu seçmediyse taksi rotası döndürme
    if (modes && modes.length > 0 && !modes.includes(TransportMode.TAXI)) {
      return null;
    }

    try {
      // Google Directions API'den driving rotası al
      const drivingRoute = await GoogleTransitService.calculateDrivingRoute({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        departureTime,
        language: 'tr',
      });

      if (!drivingRoute) {
        return null;
      }

      // Taksi ücretini hesapla
      const taxiFare = this.calculateTaxiFare(drivingRoute.distance);

      // RouteOption formatına dönüştür
      const taxiOption: RouteOption = {
        id: this.generateRouteId(),
        segments: [{
          mode: TransportMode.TAXI,
          from: {
            lat: drivingRoute.startLocation.lat,
            lng: drivingRoute.startLocation.lng,
            name: drivingRoute.startAddress,
          },
          to: {
            lat: drivingRoute.endLocation.lat,
            lng: drivingRoute.endLocation.lng,
            name: drivingRoute.endAddress,
          },
          distance: drivingRoute.distance,
          duration: drivingRoute.duration,
          instructions: `Taksi ile ${drivingRoute.distanceText} mesafe`,
          polyline: drivingRoute.polyline,
        }],
        totalDistance: drivingRoute.distance,
        totalDuration: drivingRoute.duration,
        totalCost: taxiFare,
        departureTime: departureTime || new Date(),
        arrivalTime: new Date((departureTime || new Date()).getTime() + drivingRoute.duration * 1000),
        isEcoFriendly: false,
        carbonFootprint: (drivingRoute.distance / 1000) * 0.21, // kg CO2 per km (araba)
      };

      logger.info('Taxi route calculated', {
        distance: drivingRoute.distanceText,
        duration: drivingRoute.durationText,
        fare: taxiFare,
      });

      return taxiOption;
    } catch (error: any) {
      logger.error('Error calculating taxi route:', error.message);
      return null;
    }
  }

  /**
   * Taksi ücreti hesapla (Ankara taksi tarifesi 2024)
   */
  private calculateTaxiFare(distanceMeters: number): number {
    // Ankara taksi tarifesi (2024)
    const openingFee = 35.00;      // Açılış ücreti
    const perKmRate = 25.00;       // Kilometre başı ücret
    const minFare = 130.00;        // Minimum ücret (indi-bindi)

    const distanceKm = distanceMeters / 1000;
    const calculatedFare = openingFee + (distanceKm * perKmRate);

    // Minimum ücret kontrolü
    return Math.max(calculatedFare, minFare);
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

    // Polyline verilerini kontrol et
    console.log('[RouteService] Routes converted. Checking polylines:');
    routes.forEach((route, i) => {
      const polylinesInfo = route.segments.map(s => ({
        mode: s.mode,
        hasPolyline: !!s.polyline,
        polylineLength: s.polyline?.length || 0
      }));
      console.log(`[RouteService] Route ${i}:`, JSON.stringify(polylinesInfo));
    });

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
    console.log('[RouteService] Converting route with', googleRoute.steps?.length, 'steps');

    for (const step of googleRoute.steps) {
      console.log('[RouteService] Step:', {
        travelMode: step.travelMode,
        hasPolyline: !!step.polyline,
        polylineLength: step.polyline?.length || 0
      });

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
        polyline: step.polyline, // Encoded polyline string - frontend will decode with Maps JS API
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

    const segmentsWithPolyline = segments.filter(s => s.polyline).length;
    console.log('[RouteService] Route created:', segments.length, 'segments,', segmentsWithPolyline, 'with polyline');

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
          // Ankara'da tramvay yok! Google Ankaray'ı TRAM/LIGHT_RAIL olarak gösteriyor
          // Bu yüzden TRAM -> ANKARAY olarak eşleyelim
          return TransportMode.ANKARAY;
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
    // Toplu taşıma segmentlerini filtrele (yürüyüş hariç)
    const transitSegments = segments.filter(
      (seg) => seg.mode !== TransportMode.WALKING
    );

    // Her biniş için ayrı ücret (31 TL)
    // Aktarmalarda da her araç için ayrı biniş ücreti ödenir
    const farePerRide = 31.00;
    return transitSegments.length * farePerRide;
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
    const { origin, destination, departureTime, modes } = request;
    const timeKey = departureTime ? departureTime.getTime() : 'now';
    const modesKey = modes?.sort().join(',') || 'all';
    return `routes:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}:${timeKey}:${modesKey}`;
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