// ============================================
// Temel Tipler
// ============================================

export interface Location {
  lat: number;
  lng: number;
}

export interface Address {
  formattedAddress: string;
  city: string;
  district?: string;
  street?: string;
  postalCode?: string;
}

// ============================================
// Ulaşım Modları
// ============================================

export enum TransportMode {
  BUS = 'BUS',
  METRO = 'METRO',
  TRAM = 'TRAM',
  ANKARAY = 'ANKARAY',
  TAXI = 'TAXI',
  UBER = 'UBER',
  BOLT = 'BOLT',
  WALKING = 'WALKING',
  BICYCLE = 'BICYCLE',
}

export const TransportModeLabels: Record<TransportMode, string> = {
  [TransportMode.BUS]: 'Otobüs',
  [TransportMode.METRO]: 'Metro',
  [TransportMode.TRAM]: 'Tramvay',
  [TransportMode.ANKARAY]: 'Ankaray',
  [TransportMode.TAXI]: 'Taksi',
  [TransportMode.UBER]: 'Uber',
  [TransportMode.BOLT]: 'Bolt',
  [TransportMode.WALKING]: 'Yürüyüş',
  [TransportMode.BICYCLE]: 'Bisiklet',
};

// ============================================
// Toplu Taşıma
// ============================================

export interface PublicTransportStop {
  id: string;
  name: string;
  location: Location;
  stopType: TransportMode;
  routes: string[];
}

export interface PublicTransportVehicle {
  id: string;
  routeId: string;
  routeName: string;
  currentLocation: Location;
  nextStopId: string;
  estimatedArrival: Date;
  vehicleType: TransportMode;
  occupancy?: 'LOW' | 'MEDIUM' | 'HIGH';
  isDelayed: boolean;
  delayMinutes?: number;
}

export interface PublicTransportRoute {
  id: string;
  name: string;
  transportMode: TransportMode;
  stops: PublicTransportStop[];
  operatingHours: {
    start: string;
    end: string;
  };
  frequency?: number; // dakika cinsinden
  color?: string;
}

// ============================================
// Rota Planlama
// ============================================

export interface RouteSegment {
  mode: TransportMode;
  from: Location & { name?: string };
  to: Location & { name?: string };
  distance: number; // metre
  duration: number; // dakika
  instructions: string;
  routeInfo?: {
    routeId?: string;
    routeName?: string;
    routeLongName?: string;
    routeColor?: string;
    routeTextColor?: string;
    vehicleType?: string;
    vehicleName?: string;
    vehicleIcon?: string;
    departureStop?: string;
    arrivalStop?: string;
    departureTime?: Date;
    arrivalTime?: Date;
    stops?: number;
    headsign?: string;
    agency?: string;
  };
  polyline?: string; // Encoded polyline
  transitStops?: Array<{ name: string; lat: number; lng: number }>; // Places API'den bulunan duraklar
}

export interface RouteOption {
  id: string;
  segments: RouteSegment[];
  totalDistance: number; // metre
  totalDuration: number; // dakika
  totalCost?: number; // TRY
  departureTime: Date;
  arrivalTime: Date;
  isFastest?: boolean;
  isCheapest?: boolean;
  isEcoFriendly?: boolean;
  carbonFootprint?: number; // kg CO2
}

export interface RouteRequest {
  origin: Location;
  destination: Location;
  modes: TransportMode[];
  departureTime?: Date;
  preferences?: {
    maxWalkingDistance?: number;
    maxTransfers?: number;
    preferFastest?: boolean;
    preferCheapest?: boolean;
    accessibilityRequired?: boolean;
  };
}

// ============================================
// Taksi ve Araç Paylaşımı
// ============================================

export interface TaxiFare {
  openingFee: number; // Açılış ücreti (TRY)
  perKmRate: number; // Kilometre başı ücret (TRY)
  minFare: number; // İndi bindi ücreti (TRY)
  waitingFeePerHour: number; // Bekleme ücreti/saat (TRY)
  nightSurcharge?: number; // Gece tarifesi ek ücreti
  airportSurcharge?: number; // Havaalanı ek ücreti
}

export interface TaxiEstimate {
  provider: 'TAXI' | 'UBER' | 'BOLT';
  estimatedFare: number;
  currency: 'TRY';
  distance: number;
  duration: number;
  fareBreakdown: {
    baseFare: number;
    distanceFare: number;
    waitingFare?: number;
    surcharges?: number;
  };
  availableVehicles?: number;
  estimatedArrival?: number; // dakika
}

export interface RideShareDriver {
  id: string;
  name: string;
  rating: number;
  vehicleInfo: {
    model: string;
    color: string;
    licensePlate: string;
  };
  currentLocation: Location;
  estimatedArrival: number; // dakika
}

// ============================================
// Yerler ve POI
// ============================================

export enum PlaceCategory {
  RESTAURANT = 'RESTAURANT',
  CAFE = 'CAFE',
  SHOPPING = 'SHOPPING',
  TOURISM = 'TOURISM',
  CULTURE = 'CULTURE',
  NATURE = 'NATURE',
  HEALTH = 'HEALTH',
  EDUCATION = 'EDUCATION',
  ACCOMMODATION = 'ACCOMMODATION',
  ENTERTAINMENT = 'ENTERTAINMENT',
}

export const PlaceCategoryLabels: Record<PlaceCategory, string> = {
  [PlaceCategory.RESTAURANT]: 'Restoran',
  [PlaceCategory.CAFE]: 'Kafe',
  [PlaceCategory.SHOPPING]: 'Alışveriş',
  [PlaceCategory.TOURISM]: 'Turistik Yerler',
  [PlaceCategory.CULTURE]: 'Kültür',
  [PlaceCategory.NATURE]: 'Doğa',
  [PlaceCategory.HEALTH]: 'Sağlık',
  [PlaceCategory.EDUCATION]: 'Eğitim',
  [PlaceCategory.ACCOMMODATION]: 'Konaklama',
  [PlaceCategory.ENTERTAINMENT]: 'Eğlence',
};

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  location: Location;
  address: Address;
  rating?: number;
  reviewCount?: number;
  photos?: string[];
  description?: string;
  openingHours?: {
    weekday: string;
    hours: string;
  }[];
  phone?: string;
  website?: string;
  priceLevel?: 1 | 2 | 3 | 4 | 5;
  distance?: number; // metre - kullanıcıya göre
}

// ============================================
// Kullanıcı
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  preferences: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  defaultTransportModes: TransportMode[];
  maxWalkingDistance: number;
  accessibilityRequired: boolean;
  language: 'tr';
  notifications: {
    serviceAlerts: boolean;
    routeUpdates: boolean;
    promotions: boolean;
  };
}

export interface FavoriteRoute {
  id: string;
  userId: string;
  name: string;
  origin: Location & { name: string };
  destination: Location & { name: string };
  preferredModes: TransportMode[];
  createdAt: Date;
  usageCount: number;
}

export interface TripHistory {
  id: string;
  userId: string;
  origin: Location & { name: string };
  destination: Location & { name: string };
  route: RouteOption;
  startTime: Date;
  endTime?: Date;
  cost?: number;
  rating?: number;
  feedback?: string;
}

// ============================================
// Bildirimler ve Uyarılar
// ============================================

export enum AlertType {
  SERVICE_DISRUPTION = 'SERVICE_DISRUPTION',
  DELAY = 'DELAY',
  ROUTE_CHANGE = 'ROUTE_CHANGE',
  WEATHER = 'WEATHER',
  TRAFFIC = 'TRAFFIC',
  MAINTENANCE = 'MAINTENANCE',
}

export interface ServiceAlert {
  id: string;
  type: AlertType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  affectedRoutes?: string[];
  affectedModes?: TransportMode[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
