// GET /api/directions/[stationId]/[line]
// Returns arrival predictions (directions) for a specific station and line

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { stationId, line } = req.query;

    // Validate parameters
    if (!stationId || !line) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        required: ['stationId', 'line']
      });
    }

    // Fetch arrivals for the station and line from TFL API
    const response = await fetch(
      `https://api.tfl.gov.uk/Line/${encodeURIComponent(line)}/Arrivals/${encodeURIComponent(stationId)}`
    );
    
    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Station or line not found',
        stationId,
        line
      });
    }

    if (!response.ok) {
      throw new Error(`TFL API returned status ${response.status}`);
    }

    const arrivals = await response.json();

    // Helper function to extract direction from platform name
    const extractDirection = (platformName, fallbackDirection) => {
      if (!platformName || platformName === 'Unknown') {
        return fallbackDirection || 'Unknown';
      }
      
      // Platform names are typically "Northbound - Platform 4", "Eastbound - Platform 1", etc.
      // Extract the first word (the direction)
      const match = platformName.match(/^(\w+bound)/i);
      if (match) {
        return match[1];
      }
      
      // If no direction found in platform name, use fallback
      return fallbackDirection || platformName.split(' - ')[0] || 'Unknown';
    };

    // Group arrivals by direction and extract relevant information
    const directionsMap = {};
    
    arrivals.forEach(arrival => {
      const platformName = arrival.platformName || 'Unknown';
      const direction = extractDirection(platformName, arrival.direction || arrival.towards);
      
      if (!directionsMap[direction]) {
        directionsMap[direction] = {
          direction,
          platforms: new Set(),
          destinations: new Set(),
          nextTrains: []
        };
      }

      directionsMap[direction].platforms.add(platformName);
      if (arrival.destinationName) {
        directionsMap[direction].destinations.add(arrival.destinationName);
      }

      directionsMap[direction].nextTrains.push({
        vehicleId: arrival.vehicleId,
        destinationName: arrival.destinationName,
        towards: arrival.towards,
        expectedArrival: arrival.expectedArrival,
        timeToStation: arrival.timeToStation,
        currentLocation: arrival.currentLocation,
        platformName: arrival.platformName
      });
    });

    // Convert to array and sort trains by arrival time
    const directions = Object.values(directionsMap).map(dir => ({
      direction: dir.direction,
      platforms: Array.from(dir.platforms),
      destinations: Array.from(dir.destinations),
      nextTrains: dir.nextTrains
        .sort((a, b) => a.timeToStation - b.timeToStation)
        .slice(0, 5) // Limit to next 5 trains
    }));

    // Set cache headers (cache for 30 seconds for real-time data)
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    
    return res.status(200).json({
      success: true,
      stationId,
      line,
      count: directions.length,
      directions,
      totalArrivals: arrivals.length
    });

  } catch (error) {
    console.error('Error fetching directions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch directions',
      message: error.message
    });
  }
};
