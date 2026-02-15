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

    // Fetch arrivals and line status from TFL API in parallel
    const [arrivalsResponse, statusResponse] = await Promise.all([
      fetch(`https://api.tfl.gov.uk/Line/${encodeURIComponent(line)}/Arrivals/${encodeURIComponent(stationId)}`),
      fetch(`https://api.tfl.gov.uk/Line/${encodeURIComponent(line)}/Status`)
    ]);
    
    if (arrivalsResponse.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Station or line not found',
        stationId,
        line
      });
    }

    if (!arrivalsResponse.ok) {
      throw new Error(`TFL API returned status ${arrivalsResponse.status}`);
    }

    const arrivals = await arrivalsResponse.json();
    const statusData = statusResponse.ok ? await statusResponse.json() : null;

    // Extract line status information
    let lineStatus = {
      statusSeverity: 10,
      statusSeverityDescription: 'Good Service',
      reason: null
    };

    if (statusData && statusData.length > 0 && statusData[0].lineStatuses && statusData[0].lineStatuses.length > 0) {
      const status = statusData[0].lineStatuses[0];
      lineStatus = {
        statusSeverity: status.statusSeverity || 10,
        statusSeverityDescription: status.statusSeverityDescription || 'Good Service',
        reason: status.reason || null
      };
    }

    // Helper function to extract direction from platform name
    const extractDirection = (platformName, fallbackDirection, towards) => {
      // Try platform name first
      if (platformName && platformName !== 'Unknown') {
        // Match "Eastbound - Platform 4" format
        let match = platformName.match(/^(\w+bound)/i);
        if (match) {
          return match[1];
        }
        
        // Match standalone directions like "Eastbound", "Westbound"
        match = platformName.match(/^(East|West|North|South)(?:bound)?/i);
        if (match) {
          return match[0];
        }
        
        // Elizabeth line and some others use "Platform 1 Westbound" or just platform numbers
        match = platformName.match(/(East|West|North|South)(?:bound)?/i);
        if (match) {
          return match[0];
        }
      }
      
      // Try using the 'towards' field to determine direction
      if (towards) {
        // Common terminal stations can indicate direction
        const easternTerminals = ['Shenfield', 'Abbey Wood', 'Epping', 'Hainault', 'Ealing Broadway', 'Barking'];
        const westernTerminals = ['Reading', 'Heathrow', 'West Ruislip', 'Uxbridge', 'Edgware'];
        const northernTerminals = ['High Barnet', 'Edgware', 'Mill Hill East', 'Cockfosters'];
        const southernTerminals = ['Morden', 'Wimbledon', 'Brixton'];
        
        if (easternTerminals.some(term => towards.includes(term))) return 'Eastbound';
        if (westernTerminals.some(term => towards.includes(term))) return 'Westbound';
        if (northernTerminals.some(term => towards.includes(term))) return 'Northbound';
        if (southernTerminals.some(term => towards.includes(term))) return 'Southbound';
      }
      
      // Use fallback direction or towards field
      if (fallbackDirection && fallbackDirection !== 'Unknown') {
        return fallbackDirection;
      }
      
      // Last resort: use towards or platform name as-is
      return towards || platformName?.split(' - ')[0] || 'Unknown';
    };

    // Filter arrivals by the requested direction (case-insensitive)
    const directionLower = direction.toLowerCase();
    const filteredArrivals = arrivals.filter(arrival => {
      const platformName = arrival.platformName || 'Unknown';
      const arrivalDirection = extractDirection(platformName, arrival.direction, arrival.towards);
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
      lineStatus,
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
