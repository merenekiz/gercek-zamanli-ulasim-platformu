import { Request } from 'express';

// ============================================
// Express Extensions
// ============================================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// ============================================
// User Types
// ============================================

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface IUser {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPreferences {
  id: string;
  userId: string;
  defaultTransportModes: TransportMode[];
  maxWalkingDistance: number;
  accessibilityRequired: boolean;
  language: string;
  notificationSettings: {
    serviceAlerts: boolean;
    routeUpdates: boolean;
    promotions: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Transport Types
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

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  DELAYED = 'DELAYED',
}

export interface Location {
  lat: number;
  lng: number;
}

// ============================================
// City & Region
// ============================================

export interface ICity {
  id: string;
  name: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Taxi Fare Types
// ============================================

export interface ITaxiFare {
  id: string;
  cityId: string;
  openingFee: number; // Açılış ücreti
  perKmRate: number; // Kilometre başı ücret
  minFare: number; // İndi bindi ücreti (minimum)
  waitingFeePerHour: number; // Bekleme ücreti/saat
  nightSurchargeRate?: number; // Gece tarifesi ek yüzdesi
  airportSurcharge?: number; // Havaalanı ek ücreti
  validFrom: Date;
  validUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxiFareCalculationInput {
  distance: number; // metre
  duration: number; // dakika
  isNightTime?: boolean;
  isAirport?: boolean;
  waitingTime?: number; // dakika
}

export interface TaxiFareCalculationResult {
  baseFare: number;
  distanceFare: number;
  waitingFare: number;
  nightSurcharge: number;
  airportSurcharge: number;
  totalFare: number;
  currency: string;
  breakdown: {
    openingFee: number;
    distanceCharge: number;
    waitingCharge: number;
    surcharges: number;
  };
}

// ============================================
// Public Transport Types
// ============================================

export interface IPublicTransportRoute {
  id: string;
  cityId: string;
  routeId: string;
  routeName: string;
  transportMode: TransportMode;
  operatingHours: {
    start: string;
    end: string;
  };
  frequency?: number; // dakika
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPublicTransportStop {
  id: string;
  cityId: string;
  stopId: string;
  stopName: string;
  latitude: number;
  longitude: number;
  stopType: TransportMode;
  wheelchairAccessible: boolean;
  facilities?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPublicTransportVehicle {
  id: string;
  vehicleId: string;
  routeId: string;
  currentLatitude: number;
  currentLongitude: number;
  speed?: number;
  heading?: number;
  occupancy?: 'LOW' | 'MEDIUM' | 'HIGH';
  status: VehicleStatus;
  lastUpdated: Date;
}

// ============================================
// Route Planning Types
// ============================================

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

export interface RouteSegment {
  mode: TransportMode;
  from: Location & { name?: string };
  to: Location & { name?: string };
  distance: number;
  duration: number;
  instructions: string;
  routeInfo?: {
    routeId?: string;
    routeName?: string;
    departureTime?: Date;
    arrivalTime?: Date;
    stops?: number;
  };
  polyline?: string;
}

export interface RouteOption {
  id: string;
  segments: RouteSegment[];
  totalDistance: number;
  totalDuration: number;
  totalCost?: number;
  departureTime: Date;
  arrivalTime: Date;
  isFastest?: boolean;
  isCheapest?: boolean;
  isEcoFriendly?: boolean;
  carbonFootprint?: number;
}

// ============================================
// Places & POI Types
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

export interface IPlace {
  id: string;
  placeId: string; // Google Places ID
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  address: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  phone?: string;
  website?: string;
  openingHours?: any;
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Alerts & Notifications
// ============================================

export enum AlertType {
  SERVICE_DISRUPTION = 'SERVICE_DISRUPTION',
  DELAY = 'DELAY',
  ROUTE_CHANGE = 'ROUTE_CHANGE',
  WEATHER = 'WEATHER',
  TRAFFIC = 'TRAFFIC',
  MAINTENANCE = 'MAINTENANCE',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface IServiceAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  affectedRoutes?: string[];
  affectedModes?: TransportMode[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Trip History
// ============================================

export interface ITripHistory {
  id: string;
  userId: string;
  originLatitude: number;
  originLongitude: number;
  originName: string;
  destinationLatitude: number;
  destinationLongitude: number;
  destinationName: string;
  routeData: any; // JSON
  startTime: Date;
  endTime?: Date;
  cost?: number;
  rating?: number;
  feedback?: string;
  createdAt: Date;
}

// ============================================
// Favorite Routes
// ============================================

export interface IFavoriteRoute {
  id: string;
  userId: string;
  name: string;
  originLatitude: number;
  originLongitude: number;
  originName: string;
  destinationLatitude: number;
  destinationLongitude: number;
  destinationName: string;
  preferredModes: TransportMode[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp?: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// ============================================
// External API Types
// ============================================

export interface GoogleDirectionsRequest {
  origin: string | Location;
  destination: string | Location;
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
  departureTime?: Date;
  alternatives?: boolean;
}

export interface UberPriceEstimate {
  fare_id: string;
  product_id: string;
  currency_code: string;
  display_name: string;
  estimate: string;
  low_estimate?: number;
  high_estimate?: number;
  surge_multiplier: number;
  duration: number;
  distance: number;
}

export interface BoltPriceEstimate {
  product_id: string;
  display_name: string;
  price: {
    amount: number;
    currency: string;
  };
  estimated_time: number;
  distance_km: number;
}
