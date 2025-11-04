/**
 * Google Places Service
 * Google Places API kullanarak konum arama ve autocomplete
 */

import { Client, PlaceAutocompleteRequest, PlaceDetailsRequest } from '@googlemaps/google-maps-services-js';
import { googleConfig } from '../config/google';
import logger from '../utils/logger';
import { redisClient } from '../config/database';

const client = new Client({});

interface PlaceSearchRequest {
  input: string;
  location?: {
    lat: number;
    lng: number;
  };
  radius?: number;
  language?: string;
}

interface PlaceResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  internationalPhoneNumber?: string;
  website?: string;
  openingHours?: any;
}

export class GooglePlacesService {
  /**
   * Konum arama (autocomplete)
   */
  static async searchPlaces(request: PlaceSearchRequest): Promise<PlaceResult[]> {
    const { input, location, radius = 50000, language = 'tr' } = request;

    // Cache key oluştur
    const cacheKey = `places:autocomplete:${input}:${location?.lat || ''},${location?.lng || ''}`;

    try {
      // Cache'den kontrol et
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('Places autocomplete returned from cache');
        return JSON.parse(cached);
      }

      // Google Places Autocomplete API isteği
      const autocompleteRequest: PlaceAutocompleteRequest = {
        params: {
          input,
          key: googleConfig.apiKey,
          language,
          components: ['country:tr'], // Sadece Türkiye
        },
        timeout: googleConfig.timeout.places,
      };

      // Eğer location verilmişse, o bölgeye öncelik ver
      if (location) {
        autocompleteRequest.params.location = `${location.lat},${location.lng}`;
        autocompleteRequest.params.radius = radius;
      }

      logger.info('Requesting places autocomplete from Google', {
        input,
        location,
      });

      const response = await client.placeAutocomplete(autocompleteRequest);

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        logger.warn('Google Places API returned non-OK status', {
          status: response.data.status,
          errorMessage: response.data.error_message,
        });

        return [];
      }

      // Sonuçları formatla
      const results: PlaceResult[] = response.data.predictions.map((prediction) => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting.main_text,
        secondaryText: prediction.structured_formatting.secondary_text || '',
        types: prediction.types || [],
      }));

      // Cache'e kaydet (1 gün)
      await redisClient.setex(cacheKey, googleConfig.cache.placesTTL, JSON.stringify(results));

      logger.info('Places autocomplete completed', {
        resultCount: results.length,
      });

      return results;
    } catch (error: any) {
      logger.error('Error searching places', {
        error: error.message,
        input,
      });

      throw new Error(`Places search failed: ${error.message}`);
    }
  }

  /**
   * Yer detaylarını al (placeId ile)
   */
  static async getPlaceDetails(placeId: string, language: string = 'tr'): Promise<PlaceDetails | null> {
    // Cache key oluştur
    const cacheKey = `places:details:${placeId}`;

    try {
      // Cache'den kontrol et
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('Place details returned from cache');
        return JSON.parse(cached);
      }

      // Google Place Details API isteği
      const detailsRequest: PlaceDetailsRequest = {
        params: {
          place_id: placeId,
          key: googleConfig.apiKey,
          language: language as any,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'geometry',
            'types',
            'rating',
            'user_ratings_total',
            'international_phone_number',
            'website',
            'opening_hours',
          ],
        },
        timeout: googleConfig.timeout.places,
      };

      logger.info('Requesting place details from Google', {
        placeId,
      });

      const response = await client.placeDetails(detailsRequest);

      if (response.data.status !== 'OK') {
        logger.warn('Google Place Details API returned non-OK status', {
          status: response.data.status,
          errorMessage: response.data.error_message,
        });

        return null;
      }

      const place = response.data.result;

      const details: PlaceDetails = {
        placeId: place.place_id!,
        name: place.name!,
        formattedAddress: place.formatted_address!,
        location: {
          lat: place.geometry!.location.lat,
          lng: place.geometry!.location.lng,
        },
        types: place.types || [],
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        internationalPhoneNumber: place.international_phone_number,
        website: place.website,
        openingHours: place.opening_hours,
      };

      // Cache'e kaydet (7 gün - yer bilgileri değişmez)
      await redisClient.setex(cacheKey, googleConfig.cache.geocodingTTL, JSON.stringify(details));

      logger.info('Place details fetched successfully', {
        placeId,
        name: details.name,
      });

      return details;
    } catch (error: any) {
      logger.error('Error getting place details', {
        error: error.message,
        placeId,
      });

      throw new Error(`Place details fetch failed: ${error.message}`);
    }
  }

  /**
   * Geocoding: Adres → Koordinat
   */
  static async geocodeAddress(address: string, language: string = 'tr'): Promise<{ lat: number; lng: number } | null> {
    // Cache key oluştur
    const cacheKey = `geocode:address:${address}`;

    try {
      // Cache'den kontrol et
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('Geocoding result returned from cache');
        return JSON.parse(cached);
      }

      logger.info('Geocoding address', { address });

      const response = await client.geocode({
        params: {
          address,
          key: googleConfig.apiKey,
          language: language as any,
          components: { country: 'TR' }, // Sadece Türkiye
        },
        timeout: googleConfig.timeout.geocoding,
      });

      if (response.data.status !== 'OK' || !response.data.results.length) {
        logger.warn('Geocoding returned no results', {
          status: response.data.status,
          address,
        });

        return null;
      }

      const location = {
        lat: response.data.results[0].geometry.location.lat,
        lng: response.data.results[0].geometry.location.lng,
      };

      // Cache'e kaydet (7 gün)
      await redisClient.setex(cacheKey, googleConfig.cache.geocodingTTL, JSON.stringify(location));

      logger.info('Geocoding completed', {
        address,
        location,
      });

      return location;
    } catch (error: any) {
      logger.error('Error geocoding address', {
        error: error.message,
        address,
      });

      throw new Error(`Geocoding failed: ${error.message}`);
    }
  }

  /**
   * Reverse Geocoding: Koordinat → Adres
   */
  static async reverseGeocode(lat: number, lng: number, language: string = 'tr'): Promise<string | null> {
    // Cache key oluştur
    const cacheKey = `geocode:reverse:${lat},${lng}`;

    try {
      // Cache'den kontrol et
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('Reverse geocoding result returned from cache');
        return cached;
      }

      logger.info('Reverse geocoding coordinates', { lat, lng });

      const response = await client.reverseGeocode({
        params: {
          latlng: `${lat},${lng}`,
          key: googleConfig.apiKey,
          language: language as any,
        },
        timeout: googleConfig.timeout.geocoding,
      });

      if (response.data.status !== 'OK' || !response.data.results.length) {
        logger.warn('Reverse geocoding returned no results', {
          status: response.data.status,
          lat,
          lng,
        });

        return null;
      }

      const address = response.data.results[0].formatted_address;

      // Cache'e kaydet (7 gün)
      await redisClient.setex(cacheKey, googleConfig.cache.geocodingTTL, address);

      logger.info('Reverse geocoding completed', {
        lat,
        lng,
        address,
      });

      return address;
    } catch (error: any) {
      logger.error('Error reverse geocoding', {
        error: error.message,
        lat,
        lng,
      });

      throw new Error(`Reverse geocoding failed: ${error.message}`);
    }
  }

  /**
   * Rate limit kontrolü (Places API için)
   */
  static async checkRateLimit(userId: string): Promise<boolean> {
    const hourKey = `ratelimit:places:hour:${userId}`;
    const dayKey = `ratelimit:places:day:${userId}`;

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
    if (hourCount > googleConfig.rateLimits.placesPerHour) {
      logger.warn('Hourly rate limit exceeded (Places)', { userId, hourCount });
      return false;
    }

    if (dayCount > googleConfig.rateLimits.placesPerDay) {
      logger.warn('Daily rate limit exceeded (Places)', { userId, dayCount });
      return false;
    }

    return true;
  }
}

export default GooglePlacesService;
