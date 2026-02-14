// Simple test file to verify the API structure
// You can run this with: node test.js (after installing node-fetch)

const fetch = require('node-fetch');

// Change this to your deployed URL or use http://localhost:3000 for local testing
const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Tube Tracker API...\n');

  try {
    // Test 1: Get all stations
    console.log('1️⃣ Testing /api/stations...');
    const stationsRes = await fetch(`${BASE_URL}/api/stations`);
    const stationsData = await stationsRes.json();
    console.log(`✅ Status: ${stationsRes.status}`);
    console.log(`✅ Found ${stationsData.count} stations`);
    
    if (stationsData.stations && stationsData.stations.length > 0) {
      const testStation = stationsData.stations.find(s => s.name.includes('Oxford'));
      if (testStation) {
        console.log(`✅ Sample: ${testStation.name} (ID: ${testStation.id})\n`);
        
        // Test 2: Get lines for a station
        console.log(`2️⃣ Testing /api/lines/${testStation.id}...`);
        const linesRes = await fetch(`${BASE_URL}/api/lines/${testStation.id}`);
        const linesData = await linesRes.json();
        console.log(linesData);
        
        console.log(`✅ Status: ${linesRes.status}`);
        console.log(`✅ Found ${linesData.count} lines at ${linesData.stationName}`);
        
        if (linesData.lines && linesData.lines.length > 0) {
          const testLine = linesData.lines[0];
          console.log(`✅ Sample line: ${testLine.name}\n`);
          
          // Test 3: Get directions
          console.log(`3️⃣ Testing /api/directions/${testStation.id}/${testLine.id}...`);
          const directionsRes = await fetch(`${BASE_URL}/api/directions/${testStation.id}/${testLine.id}`);
          const directionsData = await directionsRes.json();
          console.log(`✅ Status: ${directionsRes.status}`);
          console.log(`✅ Found ${directionsData.count} directions`);
          if (directionsData.directions && directionsData.directions.length > 0) {
            directionsData.directions.forEach(dir => {
              console.log(`   - ${dir.direction}: ${dir.nextTrains.length} trains`);
            });
          }
        }
      }
    }

    console.log('\n✨ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
