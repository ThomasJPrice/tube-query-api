// GET /api/stations
// Returns a list of all London Underground tube stations

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all tube stations from TFL API
    const response = await fetch('https://api.tfl.gov.uk/StopPoint/Mode/tube');
    
    if (!response.ok) {
      throw new Error(`TFL API returned status ${response.status}`);
    }

    const data = await response.json();

    // Filter to only get actual tube stations (not individual platforms or entrance points)
    // stopType "NaptanMetroStation" represents actual Underground stations
    const tubeStations = data.stopPoints?.filter(station => 
      station.stopType === 'NaptanMetroStation'
    ) || [];

    // Extract and format relevant station information
    const stations = tubeStations.map(station => ({
      id: station.id || station.naptanId,
      name: station.commonName || station.name,
      lat: station.lat,
      lon: station.lon,
      modes: station.modes || [],
      lines: station.lines?.map(line => ({
        id: line.id,
        name: line.name
      })) || []
    }));

    // Set cache headers (cache for 1 hour)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    return res.status(200).json({
      success: true,
      count: stations.length,
      stations
    });

  } catch (error) {
    console.error('Error fetching stations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tube stations',
      message: error.message
    });
  }
};
