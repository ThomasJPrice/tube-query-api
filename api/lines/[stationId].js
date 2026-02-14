// GET /api/lines/[stationId]
// Returns a list of tube lines that serve a specific station

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { stationId } = req.query;

    // Validate stationId parameter
    if (!stationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing stationId parameter'
      });
    }

    // Fetch station details from TFL API
    const response = await fetch(`https://api.tfl.gov.uk/StopPoint/${encodeURIComponent(stationId)}`);
    
    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Station not found',
        stationId
      });
    }

    if (!response.ok) {
      throw new Error(`TFL API returned status ${response.status}`);
    }

    const data = await response.json();

    // Extract line information
    const lines = data.lines?.map(line => ({
      id: line.id,
      name: line.name,
      modeName: line.modeName
    })) || [];

    // Filter for tube lines only
    const tubeLines = lines

    // Set cache headers (cache for 1 hour)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    return res.status(200).json({
      success: true,
      stationId,
      stationName: data.commonName || data.name,
      count: tubeLines.length,
      lines: tubeLines
    });

  } catch (error) {
    console.error('Error fetching lines:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch lines for station',
      message: error.message
    });
  }
};
