/**
 * Geocoding Script for Transit Stops
 * Converts addresses to coordinates using Nominatim (OpenStreetMap)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const DATA_DIR = path.join(__dirname, '../public/data');
const OUTPUT_DIR = path.join(__dirname, '../public/data/geocoded');
const DELAY_MS = 1100; // Nominatim requires 1 request per second
const MAX_RETRIES = 3;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Sleep function for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Geocode an address using Nominatim
 */
async function geocodeAddress(address, retries = 0) {
  // Clean and format address for better results
  const cleanAddress = `${address}, Ankara, Turkey`;
  const encodedAddress = encodeURIComponent(cleanAddress);

  const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=tr`;

  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Ankara-Transit-App/1.0'
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', async () => {
        try {
          const results = JSON.parse(data);

          if (results && results.length > 0) {
            resolve({
              lat: parseFloat(results[0].lat),
              lng: parseFloat(results[0].lon),
              success: true
            });
          } else {
            // Retry with simplified address
            if (retries < MAX_RETRIES) {
              console.log(`  ⚠️  No results, retrying with simplified address (attempt ${retries + 1}/${MAX_RETRIES})`);
              await sleep(DELAY_MS);

              // Try with just the street name and Ankara
              const simplifiedAddress = address.split(',')[0] + ', Ankara, Turkey';
              const encodedSimple = encodeURIComponent(simplifiedAddress);
              const simpleUrl = `https://nominatim.openstreetmap.org/search?q=${encodedSimple}&format=json&limit=1&countrycodes=tr`;

              https.get(simpleUrl, {
                headers: {
                  'User-Agent': 'Ankara-Transit-App/1.0'
                }
              }, (retryRes) => {
                let retryData = '';
                retryRes.on('data', (chunk) => { retryData += chunk; });
                retryRes.on('end', () => {
                  try {
                    const retryResults = JSON.parse(retryData);
                    if (retryResults && retryResults.length > 0) {
                      resolve({
                        lat: parseFloat(retryResults[0].lat),
                        lng: parseFloat(retryResults[0].lon),
                        success: true
                      });
                    } else {
                      resolve({ success: false, error: 'No results found' });
                    }
                  } catch (err) {
                    resolve({ success: false, error: err.message });
                  }
                });
              }).on('error', (err) => resolve({ success: false, error: err.message }));
            } else {
              resolve({ success: false, error: 'No results after retries' });
            }
          }
        } catch (err) {
          resolve({ success: false, error: err.message });
        }
      });
    }).on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Parse CSV line (handles quoted fields)
 */
function parseCSVLine(line) {
  const result = [];
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

/**
 * Escape CSV field
 */
function escapeCSV(field) {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Geocode Ankaray stations
 */
async function geocodeAnkaray() {
  console.log('\n🚊 Processing Ankaray Stations...\n');

  const inputPath = path.join(DATA_DIR, 'ankaray durakları.csv');
  const outputPath = path.join(OUTPUT_DIR, 'ankaray_stations_geocoded.csv');

  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n');

  // Output header
  const outputLines = ['id,name,type,address,district,lat,lng,routes'];

  let processed = 0;
  let successful = 0;
  let failed = 0;

  // Start from line 3 (skip header and empty line)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCSVLine(line);
    if (columns.length < 4) continue;

    const id = `ANKARAY_${columns[0]}`;
    const name = columns[1];
    const address = columns[2];
    const district = columns[3];

    processed++;
    console.log(`[${processed}] ${name}`);
    console.log(`  📍 ${address}`);

    // Geocode
    const result = await geocodeAddress(address);
    await sleep(DELAY_MS); // Rate limiting

    if (result.success) {
      console.log(`  ✅ Coordinates: ${result.lat}, ${result.lng}`);
      outputLines.push([
        escapeCSV(id),
        escapeCSV(name),
        'ANKARAY_STATION',
        escapeCSV(address),
        escapeCSV(district),
        result.lat,
        result.lng,
        'ANKARAY'
      ].join(','));
      successful++;
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      // Add with default Ankara center coordinates
      outputLines.push([
        escapeCSV(id),
        escapeCSV(name),
        'ANKARAY_STATION',
        escapeCSV(address),
        escapeCSV(district),
        '39.9334',
        '32.8597',
        'ANKARAY'
      ].join(','));
      failed++;
    }
  }

  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf-8');
  console.log(`\n✅ Ankaray: ${successful}/${processed} successful, ${failed} failed`);
  console.log(`📄 Saved to: ${outputPath}\n`);
}

/**
 * Geocode Metro stations
 */
async function geocodeMetro() {
  console.log('\n🚇 Processing Metro Stations...\n');

  const inputPath = path.join(DATA_DIR, 'metro durakları.csv');
  const outputPath = path.join(OUTPUT_DIR, 'metro_stations_geocoded.csv');

  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n');

  // Output header
  const outputLines = ['id,name,type,address,district,lat,lng,routes'];

  let processed = 0;
  let successful = 0;
  let failed = 0;

  // Start from line 5 (skip multi-line header)
  for (let i = 5; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCSVLine(line);
    if (columns.length < 5) continue;

    const id = `METRO_${columns[0]}`;
    const routeInfo = columns[1]; // "ANKARA METROSU\nM1-M2-M3"
    const name = columns[2];
    const address = columns[3];
    const district = columns[4];

    // Extract routes from route info
    const routeMatch = routeInfo.match(/M\d+(?:-M\d+)*/);
    const routes = routeMatch ? routeMatch[0].split('-').join(';') : 'M1';

    processed++;
    console.log(`[${processed}] ${name}`);
    console.log(`  📍 ${address}`);

    // Geocode
    const result = await geocodeAddress(address);
    await sleep(DELAY_MS); // Rate limiting

    if (result.success) {
      console.log(`  ✅ Coordinates: ${result.lat}, ${result.lng}`);
      outputLines.push([
        escapeCSV(id),
        escapeCSV(name),
        'METRO_STATION',
        escapeCSV(address),
        escapeCSV(district),
        result.lat,
        result.lng,
        routes
      ].join(','));
      successful++;
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      // Add with default Ankara center coordinates
      outputLines.push([
        escapeCSV(id),
        escapeCSV(name),
        'METRO_STATION',
        escapeCSV(address),
        escapeCSV(district),
        '39.9334',
        '32.8597',
        routes
      ].join(','));
      failed++;
    }
  }

  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf-8');
  console.log(`\n✅ Metro: ${successful}/${processed} successful, ${failed} failed`);
  console.log(`📄 Saved to: ${outputPath}\n`);
}

/**
 * Geocode Bus stops (limited to first N stops for testing)
 */
async function geocodeBusStops(limit = 100) {
  console.log(`\n🚌 Processing Bus Stops (limited to first ${limit})...\n`);

  const inputPath = path.join(DATA_DIR, 'ego otobüs durakları.csv');
  const outputPath = path.join(OUTPUT_DIR, 'bus_stops_geocoded.csv');

  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n');

  // Output header
  const outputLines = ['id,name,type,address,district,lat,lng,routes'];

  let processed = 0;
  let successful = 0;
  let failed = 0;

  // Start from line 1 (skip header)
  for (let i = 1; i < lines.length && processed < limit; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCSVLine(line);
    if (columns.length < 4) continue;

    const id = `BUS_${columns[0]}`;
    const name = columns[1] || `Durak ${columns[2]}`;
    const stopNumber = columns[2];
    const address = columns[3];
    const district = columns[4] || 'Ankara';
    const routeNumbers = columns[7] || '';

    // Skip if no address
    if (!address || address.trim() === '') continue;

    processed++;
    console.log(`[${processed}/${limit}] ${name}`);
    console.log(`  📍 ${address}`);

    // Geocode
    const result = await geocodeAddress(address);
    await sleep(DELAY_MS); // Rate limiting

    if (result.success) {
      console.log(`  ✅ Coordinates: ${result.lat}, ${result.lng}`);
      outputLines.push([
        escapeCSV(id),
        escapeCSV(name),
        'BUS_STOP',
        escapeCSV(address),
        escapeCSV(district),
        result.lat,
        result.lng,
        escapeCSV(routeNumbers)
      ].join(','));
      successful++;
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      // Add with default Ankara center coordinates
      outputLines.push([
        escapeCSV(id),
        escapeCSV(name),
        'BUS_STOP',
        escapeCSV(address),
        escapeCSV(district),
        '39.9334',
        '32.8597',
        escapeCSV(routeNumbers)
      ].join(','));
      failed++;
    }
  }

  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf-8');
  console.log(`\n✅ Bus Stops: ${successful}/${processed} successful, ${failed} failed`);
  console.log(`📄 Saved to: ${outputPath}\n`);
}

/**
 * Main function
 */
async function main() {
  console.log('🗺️  Geocoding Transit Stops for Ankara');
  console.log('=====================================\n');
  console.log('Using Nominatim (OpenStreetMap) API');
  console.log('Rate limit: 1 request per second\n');

  const startTime = Date.now();

  try {
    // Process each type
    await geocodeAnkaray();
    await geocodeMetro();
    await geocodeBusStops(100); // Limit to first 100 bus stops for now

    const duration = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log('\n✅ Geocoding Complete!');
    console.log(`⏱️  Total time: ${minutes}m ${seconds}s`);
    console.log(`\n📂 Output files saved in: ${OUTPUT_DIR}`);
    console.log('\nNext steps:');
    console.log('1. Review the geocoded files');
    console.log('2. Replace original CSV files with geocoded versions');
    console.log('3. Update the stops page to use new data structure\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
