// Client-side stops data loader
import { Stop, parseGeocodedStops } from '../utils/stopsParser';

let cachedStops: Stop[] | null = null;

/**
 * Load all stops from CSV files
 * This runs on the client side and caches the result
 */
export async function loadStops(): Promise<Stop[]> {
  // Return cached stops if already loaded
  if (cachedStops) {
    return cachedStops;
  }

  try {
    // Fetch geocoded CSV files (with coordinates)
    const [ankarayResponse, metroResponse] = await Promise.all([
      fetch('/data/geocoded/ankaray_stations_geocoded.csv'),
      fetch('/data/geocoded/metro_stations_geocoded.csv'),
    ]);

    const ankarayCsv = await ankarayResponse.text();
    const metroCsv = await metroResponse.text();

    // Parse geocoded stops (ankaray and metro only for now)
    cachedStops = parseGeocodedStops(ankarayCsv, metroCsv);

    console.log(`Loaded ${cachedStops.length} stops`);
    return cachedStops;
  } catch (error) {
    console.error('Error loading stops:', error);
    return [];
  }
}

/**
 * Get cached stops without reloading
 */
export function getCachedStops(): Stop[] {
  return cachedStops || [];
}

/**
 * Clear the cache (useful for testing or refreshing data)
 */
export function clearStopsCache(): void {
  cachedStops = null;
}
