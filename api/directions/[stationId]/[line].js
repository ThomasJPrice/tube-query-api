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
    let response = await fetch(
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

    let arrivals = await response.json();

    // If no arrivals found, try to find alternative stop point IDs for this line at this station
    // This is especially important for Elizabeth line which uses different IDs
    if (arrivals.length === 0) {
      const stationInfoResponse = await fetch(
        `https://api.tfl.gov.uk/StopPoint/${encodeURIComponent(stationId)}`
      );
      
      if (stationInfoResponse.ok) {
        const stationInfo = await stationInfoResponse.json();
        
        // Look for child stop points or additional identifiers that serve this line
        const childStops = stationInfo.children || [];
        const additionalProps = stationInfo.additionalProperties || [];
        
        // Try to find a stop point that serves the requested line
        for (const child of childStops) {
          if (child.lines?.some(l => l.id === line)) {
            const childResponse = await fetch(
              `https://api.tfl.gov.uk/Line/${encodeURIComponent(line)}/Arrivals/${encodeURIComponent(child.id)}`
            );
            if (childResponse.ok) {
              const childArrivals = await childResponse.json();
              if (childArrivals.length > 0) {
                arrivals = childArrivals;
                break;
              }
            }
          }
        }
      }
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

    // Group arrivals by direction and extract relevant information
    const directionsMap = {};
    
    arrivals.forEach(arrival => {
      const platformName = arrival.platformName || 'Unknown';
      const direction = extractDirection(platformName, arrival.direction, arrival.towards);
      
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
