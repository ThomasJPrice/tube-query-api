// GET /api/trains/[stationId]/[line]/[direction]
// Returns live upcoming trains for a specific station, line, and direction

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { stationId, line, direction } = req.query;

    // Validate parameters
    if (!stationId || !line || !direction) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        required: ['stationId', 'line', 'direction'],
        example: '/api/trains/940GZZLUOXC/central/Eastbound'
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
      const match = platformName.match(/^(\w+bound)/i);
      if (match) {
        return match[1];
      }
      
      return fallbackDirection || platformName.split(' - ')[0] || 'Unknown';
    };

    // Filter arrivals by the requested direction (case-insensitive)
    const directionLower = direction.toLowerCase();
    const filteredArrivals = arrivals.filter(arrival => {
      const platformName = arrival.platformName || 'Unknown';
      const arrivalDirection = extractDirection(platformName, arrival.direction || arrival.towards);
      return arrivalDirection.toLowerCase() === directionLower;
    });

    // If no trains found for this direction
    if (filteredArrivals.length === 0) {
      return res.status(200).json({
        success: true,
        stationId,
        line,
        direction,
        count: 0,
        trains: [],
        message: 'No trains currently arriving in this direction'
      });
    }

    // Sort by time to station and get next 4 trains
    const upcomingTrains = filteredArrivals
      .sort((a, b) => a.timeToStation - b.timeToStation)
      .slice(0, 4)
      .map((arrival, index) => ({
        position: index + 1,
        destinationName: arrival.destinationName,
        timeToStation: arrival.timeToStation, // in seconds
        expectedArrival: arrival.expectedArrival,
        platformName: arrival.platformName,
        currentLocation: arrival.currentLocation,
        towards: arrival.towards
      }));

    // Disable caching for live data - always fetch fresh from TFL API
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.status(200).json({
      success: true,
      stationId,
      line,
      direction,
      count: upcomingTrains.length,
      trains: upcomingTrains
    });

  } catch (error) {
    console.error('Error fetching trains:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch train arrivals',
      message: error.message
    });
  }
};
