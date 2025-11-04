/**
 * Google Maps API Configuration
 *
 * Kullanılan API'ler:
 * - Directions API (Transit Mode) - Toplu taşıma rota planlama
 * - Geocoding API - Adres ↔ Koordinat dönüşümü
 * - Places API - Konum arama ve otomatik tamamlama
 */

export const googleConfig = {
  apiKey: process.env.GOOGLE_MAPS_API_KEY || '',

  // API Endpoints
  endpoints: {
    directions: 'https://maps.googleapis.com/maps/api/directions/json',
    geocoding: 'https://maps.googleapis.com/maps/api/geocode/json',
    places: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
    placeDetails: 'https://maps.googleapis.com/maps/api/place/details/json',
  },

  // Rate Limiting (Ücretsiz limitler için güvenli değerler)
  rateLimits: {
    // Directions API: 10,000 requests/month (Essential)
    // Günlük: ~333 request, Saatlik: ~14 request
    directionsPerHour: 14,
    directionsPerDay: 333,

    // Geocoding API: 10,000 requests/month (Essential)
    geocodingPerHour: 14,
    geocodingPerDay: 333,

    // Places API: 10,000 requests/month (Essential)
    placesPerHour: 14,
    placesPerDay: 333,
  },

  // Transit Mode Options (Sadece toplu taşıma)
  transitOptions: {
    mode: 'transit' as const,

    // Transit modes (Google destekli)
    transitModes: [
      'bus',       // Otobüs
      'rail',      // Şehir içi tren
      'subway',    // Metro
      'train',     // Banliyö treni
      'tram',      // Tramvay
    ],

    // Routing preferences
    routingPreference: {
      fewerTransfers: 'fewer_transfers',    // Daha az aktarma
      lessWalking: 'less_walking',         // Daha az yürüme
    },

    // Transit routing preference (default)
    defaultPreference: 'fewer_transfers' as const,
  },

  // Cache settings (Redis ile)
  cache: {
    // Route cache: 30 dakika (aynı rota için)
    routeTTL: 1800,

    // Geocoding cache: 7 gün (adresler değişmez)
    geocodingTTL: 604800,

    // Places cache: 1 gün
    placesTTL: 86400,
  },

  // Timeout settings (milliseconds)
  timeout: {
    directions: 10000,  // 10 saniye
    geocoding: 5000,    // 5 saniye
    places: 5000,       // 5 saniye
  },

  // Türkiye için default bounds (API aramalarını hızlandırır)
  turkey: {
    bounds: {
      northeast: {
        lat: 42.0,
        lng: 45.0,
      },
      southwest: {
        lat: 36.0,
        lng: 26.0,
      },
    },
    // Ankara center (default)
    ankaraCenter: {
      lat: 39.9334,
      lng: 32.8597,
    },
  },
};

// API key validation
export const validateGoogleApiKey = (): boolean => {
  if (!googleConfig.apiKey) {
    console.error('❌ GOOGLE_MAPS_API_KEY is not set in environment variables');
    return false;
  }

  if (googleConfig.apiKey.length < 30) {
    console.error('❌ GOOGLE_MAPS_API_KEY appears to be invalid (too short)');
    return false;
  }

  console.log('✅ Google Maps API key is configured');
  return true;
};

export default googleConfig;