/**
 * Advanced Geocoding Script using Google Maps API
 * - Cleans up invalid coordinates
 * - Uses Google Geocoding API for missing stops
 * - Only keeps stops with valid coordinates
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const GEOCODED_DIR = path.join(__dirname, '../public/data/geocoded');
const GOOGLE_API_KEY = 'AIzaSyAAuuEtefrQhdDrGR5RjwB_3nTX0lnJIZ8';
const DELAY_MS = 150; // Google allows ~10 requests/second, we'll be conservative
const DEFAULT_ANKARA_CENTER = { lat: 39.9334, lng: 32.8597 };
const COORDINATE_TOLERANCE = 0.001; // ~100m

/**
 * Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if coordinates are default/invalid
 */
function isDefaultCoordinate(lat, lng) {
  return (
    Math.abs(lat - DEFAULT_ANKARA_CENTER.lat) < COORDINATE_TOLERANCE &&
    Math.abs(lng - DEFAULT_ANKARA_CENTER.lng) < COORDINATE_TOLERANCE
  );
}

/**
 * Geocode using Google Maps API
 */
async function geocodeWithGoogle(address) {
  const cleanAddress = `${address}, Ankara, Turkey`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanAddress)}&key=${GOOGLE_API_KEY}&region=tr&language=tr`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);

          if (result.status === 'OK' && result.results.length > 0) {
            const location = result.results[0].geometry.location;
            resolve({
              lat: location.lat,
              lng: location.lng,
              success: true,
              formattedAddress: result.results[0].formatted_address
            });
          } else if (result.status === 'ZERO_RESULTS') {
            resolve({ success: false, error: 'No results found' });
          } else if (result.status === 'OVER_QUERY_LIMIT') {
            resolve({ success: false, error: 'API quota exceeded', retry: true });
          } else {
            resolve({ success: false, error: result.status });
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
 * Parse CSV line
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
  if (typeof field !== 'string') {
    return field;
  }
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Process a CSV file
 */
async function processCSVFile(filename, typeName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📁 Processing: ${filename}`);
  console.log(`${'='.repeat(60)}\n`);

  const inputPath = path.join(GEOCODED_DIR, filename);

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  File not found: ${inputPath}`);
    return;
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n');

  const validStops = [];
  const invalidStops = [];

  let totalProcessed = 0;
  let alreadyValid = 0;
  let fixed = 0;
  let removed = 0;

  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCSVLine(line);
    if (columns.length < 8) continue;

    totalProcessed++;

    const id = columns[0];
    const name = columns[1];
    const type = columns[2];
    const address = columns[3];
    const district = columns[4];
    let lat = parseFloat(columns[5]);
    let lng = parseFloat(columns[6]);
    const routes = columns[7];

    // Check if coordinates are valid
    if (isDefaultCoordinate(lat, lng) || isNaN(lat) || isNaN(lng)) {
      console.log(`[${totalProcessed}] ⚠️  ${name}`);
      console.log(`  📍 Invalid coordinates: ${lat}, ${lng}`);
      console.log(`  🔍 Trying Google Geocoding...`);

      // Try to geocode with Google
      const result = await geocodeWithGoogle(address);
      await sleep(DELAY_MS);

      if (result.success) {
        console.log(`  ✅ Found: ${result.lat}, ${result.lng}`);
        validStops.push([
          escapeCSV(id),
          escapeCSV(name),
          type,
          escapeCSV(address),
          escapeCSV(district),
          result.lat,
          result.lng,
          routes
        ]);
        fixed++;
      } else {
        console.log(`  ❌ Failed: ${result.error}`);
        invalidStops.push({ name, address, error: result.error });
        removed++;
      }
    } else {
      console.log(`[${totalProcessed}] ✅ ${name} - Already valid`);
      validStops.push([
        escapeCSV(id),
        escapeCSV(name),
        type,
        escapeCSV(address),
        escapeCSV(district),
        lat,
        lng,
        routes
      ]);
      alreadyValid++;
    }
  }

  // Write output
  const outputLines = ['id,name,type,address,district,lat,lng,routes'];
  validStops.forEach(stop => {
    outputLines.push(stop.join(','));
  });

  fs.writeFileSync(inputPath, outputLines.join('\n'), 'utf-8');

  // Summary
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 ${typeName} Summary:`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`Total processed:     ${totalProcessed}`);
  console.log(`Already valid:       ${alreadyValid} ✅`);
  console.log(`Fixed with Google:   ${fixed} 🔧`);
  console.log(`Removed (not found): ${removed} ❌`);
  console.log(`Final count:         ${validStops.length} stops`);
  console.log(`${'─'.repeat(60)}\n`);

  // Show removed stops if any
  if (invalidStops.length > 0) {
    console.log(`⚠️  Removed stops (${invalidStops.length}):`);
    invalidStops.forEach((stop, idx) => {
      console.log(`  ${idx + 1}. ${stop.name} - ${stop.error}`);
    });
    console.log();
  }

  return {
    total: totalProcessed,
    valid: validStops.length,
    fixed,
    removed,
    invalidStops
  };
}

/**
 * Main function
 */
async function main() {
  console.log('\n🗺️  Advanced Geocoding with Google Maps API');
  console.log('='.repeat(60));
  console.log('Mode: Clean & Fix');
  console.log('- Removes invalid coordinates');
  console.log('- Fixes with Google Geocoding API');
  console.log('- Only keeps valid stops');
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    // Process Ankaray
    const ankarayResults = await processCSVFile(
      'ankaray_stations_geocoded.csv',
      'ANKARAY'
    );

    // Process Metro
    const metroResults = await processCSVFile(
      'metro_stations_geocoded.csv',
      'METRO'
    );

    // Final summary
    const duration = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log('\n' + '='.repeat(60));
    console.log('🎉 GEOCODING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`⏱️  Total time: ${minutes}m ${seconds}s`);
    console.log();
    console.log('📊 Final Results:');
    console.log(`  Ankaray: ${ankarayResults.valid}/${ankarayResults.total} stops`);
    console.log(`  Metro:   ${metroResults.valid}/${metroResults.total} stops`);
    console.log(`  TOTAL:   ${ankarayResults.valid + metroResults.valid} stops with valid coordinates`);
    console.log();
    console.log('✅ All stops now have valid coordinates!');
    console.log('✅ Invalid/default coordinates removed');
    console.log('✅ CSV files updated');
    console.log('='.repeat(60));
    console.log();
    console.log('Next steps:');
    console.log('1. Restart frontend: docker-compose restart frontend');
    console.log('2. Visit http://localhost:3000/stops');
    console.log('3. Check map for properly placed stops');
    console.log();

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
