// Utility to parse CSV stop data

export interface Stop {
  id: string;
  name: string;
  type: 'BUS_STOP' | 'METRO_STATION' | 'ANKARAY_STATION';
  location: {
    lat: number;
    lng: number;
  };
  routes: string[];
  address?: string;
  district?: string;
  distance?: number;
}

// Default Ankara center coordinates (will be used as placeholder)
const ANKARA_CENTER = { lat: 39.9334, lng: 32.8597 };

/**
 * Parse Ankaray stations CSV
 */
export function parseAnkarayStations(csvContent: string): Stop[] {
  const lines = csvContent.split('\n');
  const stops: Stop[] = [];

  // Skip header (line 0) and start from line 2 (data starts at line 3 in the file)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCSVLine(line);
    if (columns.length < 4) continue;

    const id = `ANKARAY_${columns[0]}`;
    const name = columns[1];
    const address = columns[2];
    const district = columns[3];

    stops.push({
      id,
      name,
      type: 'ANKARAY_STATION',
      location: { ...ANKARA_CENTER }, // Placeholder coordinates
      routes: ['ANKARAY'], // All Ankaray stations are on the same line
      address,
      district,
    });
  }

  return stops;
}

/**
 * Parse Metro stations CSV
 */
export function parseMetroStations(csvContent: string): Stop[] {
  const lines = csvContent.split('\n');
  const stops: Stop[] = [];

  // Skip header rows (lines 0-4) and start from line 5
  for (let i = 5; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCSVLine(line);
    if (columns.length < 5) continue;

    const id = `METRO_${columns[0]}`;
    const routeInfo = columns[1]; // e.g., "ANKARA METROSU\nM1-M2-M3"
    const name = columns[2];
    const address = columns[3];
    const district = columns[4];

    // Extract route numbers from route info (M1, M2, M3, M4, etc.)
    const routes = extractMetroRoutes(routeInfo);

    stops.push({
      id,
      name,
      type: 'METRO_STATION',
      location: { ...ANKARA_CENTER }, // Placeholder coordinates
      routes,
      address,
      district,
    });
  }

  return stops;
}

/**
 * Parse bus stops CSV
 */
export function parseBusStops(csvContent: string): Stop[] {
  const lines = csvContent.split('\n');
  const stops: Stop[] = [];

  // Skip header and start from line 1
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCSVLine(line);
    if (columns.length < 4) continue;

    const id = `BUS_${columns[0]}`;
    const name = columns[1] || `Durak ${columns[2]}`; // Use durak numarası as fallback
    const stopNumber = columns[2];
    const address = columns[3];
    const district = columns[4];
    const routeNumbers = columns[7]; // DURAKTAN GECEN HAT NUMARALARI

    // Parse route numbers if available
    const routes = routeNumbers
      ? routeNumbers.split(/[,;\s]+/).filter(Boolean)
      : [];

    stops.push({
      id,
      name: name || `Durak ${stopNumber}`,
      type: 'BUS_STOP',
      location: { ...ANKARA_CENTER }, // Placeholder coordinates
      routes,
      address,
      district,
    });
  }

  return stops;
}

/**
 * Parse all stops from CSV data
 */
export function parseAllStops(
  ankarayCsv: string,
  metroCsv: string,
  busCsv: string
): Stop[] {
  const ankarayStops = parseAnkarayStations(ankarayCsv);
  const metroStops = parseMetroStations(metroCsv);
  const busStops = parseBusStops(busCsv);

  return [...ankarayStops, ...metroStops, ...busStops];
}

/**
 * Parse geocoded stops (CSV files that already have lat/lng columns)
 * Format: id,name,type,address,district,lat,lng,routes
 */
export function parseGeocodedStops(...csvFiles: string[]): Stop[] {
  const stops: Stop[] = [];

  for (const csvContent of csvFiles) {
    const lines = csvContent.split('\n');

    // Skip header (line 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = parseCSVLine(line);
      if (columns.length < 8) continue;

      const id = columns[0];
      const name = columns[1];
      const type = columns[2] as 'BUS_STOP' | 'METRO_STATION' | 'ANKARAY_STATION';
      const address = columns[3];
      const district = columns[4];
      const lat = parseFloat(columns[5]);
      const lng = parseFloat(columns[6]);
      const routesStr = columns[7];

      // Parse routes (semicolon-separated)
      const routes = routesStr ? routesStr.split(';').filter(Boolean) : [];

      stops.push({
        id,
        name,
        type,
        location: { lat, lng },
        routes,
        address,
        district,
      });
    }
  }

  return stops;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get nearby stops sorted by distance from user location
 */
export function getNearbyStops(
  stops: Stop[],
  userLat: number,
  userLng: number,
  maxDistance?: number
): Stop[] {
  const stopsWithDistance = stops.map((stop) => ({
    ...stop,
    distance: calculateDistance(
      userLat,
      userLng,
      stop.location.lat,
      stop.location.lng
    ),
  }));

  let filtered = stopsWithDistance;
  if (maxDistance) {
    filtered = stopsWithDistance.filter((stop) => stop.distance! <= maxDistance);
  }

  return filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

/**
 * Search stops by name
 */
export function searchStops(stops: Stop[], query: string): Stop[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return stops;

  return stops.filter((stop) =>
    stop.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter stops by type
 */
export function filterStopsByType(
  stops: Stop[],
  types: Array<'BUS_STOP' | 'METRO_STATION' | 'ANKARAY_STATION'>
): Stop[] {
  if (types.length === 0) return stops;
  return stops.filter((stop) => types.includes(stop.type));
}

/**
 * Get stops that serve a specific route
 */
export function getStopsForRoute(stops: Stop[], routeNumber: string): Stop[] {
  return stops.filter((stop) =>
    stop.routes.some((route) => route === routeNumber)
  );
}

// Helper function to parse CSV line (handles quoted fields)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Helper function to extract metro routes from route info string
function extractMetroRoutes(routeInfo: string): string[] {
  const match = routeInfo.match(/M\d+(?:-M\d+)*/g);
  if (!match) return [];

  // Split "M1-M2-M3" into ["M1", "M2", "M3"]
  const routeStr = match[0];
  return routeStr.split('-');
}
