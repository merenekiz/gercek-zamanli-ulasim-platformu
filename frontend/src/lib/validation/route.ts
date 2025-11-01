import { z } from 'zod';

/**
 * Location Schema
 */
const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Address Schema
 */
const addressSchema = z.object({
  formatted: z.string().min(1, 'Adres gereklidir'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Transportation Mode Enum
 */
export const TransportModeEnum = z.enum([
  'BUS',
  'METRO',
  'ANKARAY',
  'WALKING',
  'TAXI',
  'RIDESHARE',
]);

export type TransportMode = z.infer<typeof TransportModeEnum>;

/**
 * Route Search Form Schema
 */
export const routeSearchSchema = z
  .object({
    origin: z.string().min(1, 'Nereden alanı zorunludur'),
    destination: z.string().min(1, 'Nereye alanı zorunludur'),
    modes: z
      .array(TransportModeEnum)
      .min(1, 'En az bir ulaşım modu seçmelisiniz')
      .default(['BUS', 'METRO', 'WALKING']),
    departureTime: z.string().optional(),
    arriveBy: z.boolean().default(false),
    maxWalkingDistance: z.number().min(100).max(5000).default(1000),
    wheelchair: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Origin and destination should not be the same
      return data.origin.toLowerCase() !== data.destination.toLowerCase();
    },
    {
      message: 'Başlangıç ve varış noktaları aynı olamaz',
      path: ['destination'],
    }
  );

export type RouteSearchFormData = z.infer<typeof routeSearchSchema>;

/**
 * Route Search API Schema (after geocoding)
 */
export const routeSearchAPISchema = z.object({
  origin: locationSchema,
  destination: locationSchema,
  modes: z.array(TransportModeEnum).min(1),
  departureTime: z.string().optional(),
  arriveBy: z.boolean().optional(),
  maxWalkingDistance: z.number().optional(),
  wheelchair: z.boolean().optional(),
});

export type RouteSearchAPIData = z.infer<typeof routeSearchAPISchema>;

/**
 * Save Favorite Route Schema
 */
export const saveFavoriteRouteSchema = z.object({
  name: z
    .string()
    .min(1, 'Rota adı zorunludur')
    .min(3, 'Rota adı en az 3 karakter olmalıdır')
    .max(100, 'Rota adı en fazla 100 karakter olabilir'),
  origin: addressSchema,
  destination: addressSchema,
  modes: z.array(TransportModeEnum).min(1),
});

export type SaveFavoriteRouteData = z.infer<typeof saveFavoriteRouteSchema>;

/**
 * Search Stops Schema
 */
export const searchStopsSchema = z.object({
  query: z.string().optional(),
  location: locationSchema.optional(),
  radius: z.number().min(100).max(5000).default(1000),
  types: z
    .array(z.enum(['BUS_STOP', 'METRO_STATION', 'ANKARAY_STATION']))
    .optional(),
});

export type SearchStopsData = z.infer<typeof searchStopsSchema>;

/**
 * Transportation Mode Labels (Turkish)
 */
export const transportModeLabels: Record<TransportMode, string> = {
  BUS: 'Otobüs',
  METRO: 'Metro',
  ANKARAY: 'Ankaray',
  WALKING: 'Yürüme',
  TAXI: 'Taksi',
  RIDESHARE: 'Araç Paylaşımı',
};

/**
 * Transportation Mode Icons (emoji)
 */
export const transportModeIcons: Record<TransportMode, string> = {
  BUS: '🚌',
  METRO: '🚇',
  ANKARAY: '🚊',
  WALKING: '🚶',
  TAXI: '🚕',
  RIDESHARE: '🚗',
};

/**
 * Transportation Mode Colors (Tailwind classes)
 */
export const transportModeColors: Record<TransportMode, string> = {
  BUS: 'bg-blue-500',
  METRO: 'bg-red-500',
  ANKARAY: 'bg-orange-500',
  WALKING: 'bg-green-500',
  TAXI: 'bg-yellow-500',
  RIDESHARE: 'bg-purple-500',
};
