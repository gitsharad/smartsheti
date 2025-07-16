const axios = require('axios');
const AGRO_API_KEY = process.env.AGRO_API_KEY;

// Register a field (lat/lon + radius)
exports.registerField = async (req, res) => {
  try {
    const { lat, lon, radius = 500, name = 'My Farm' } = req.body;
    if (
      typeof lat !== 'number' || typeof lon !== 'number' ||
      lat < -90 || lat > 90 || lon < -180 || lon > 180
    ) {
      return res.status(400).json({ error: 'Invalid lat/lon values' });
    }
    // Calculate delta in degrees based on radius (meters)
    const latDelta = radius / 111000;
    const lonDelta = radius / (111000 * Math.cos(lat * Math.PI / 180));
    const polygon = [
      [lon - lonDelta, lat - latDelta],
      [lon - lonDelta, lat + latDelta],
      [lon + lonDelta, lat + latDelta],
      [lon + lonDelta, lat - latDelta],
      [lon - lonDelta, lat - latDelta]
    ];
    const geo_json = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [polygon]
      }
    };
    console.log('Registering field with geo_json:', JSON.stringify(geo_json));
    const url = `https://api.agromonitoring.com/agro/1.0/polygons?appid=${AGRO_API_KEY}`;
    const body = {
      name,
      geo_json
    };
    const response = await axios.post(url, body);
    res.json({ fieldId: response.data.id, polygon: response.data });
  } catch (error) {
    console.error('NDVI registerField error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to register field', details: error.response?.data || error.message });
  }
};

// Fetch NDVI time series for a field (last 30 days)
exports.fetchNDVITimeSeries = async (req, res) => {
  try {
    const { fieldId } = req.query;
    if (!fieldId) return res.status(400).json({ error: 'fieldId required' });
    const now = Math.floor(Date.now() / 1000);
    const start = now - 30 * 24 * 60 * 60; // last 30 days
    const url = `https://api.agromonitoring.com/agro/1.0/image/search?appid=${AGRO_API_KEY}&polyid=${fieldId}&start=${start}&end=${now}`;
    const response = await axios.get(url);

    // For each image, fetch NDVI stats if available
    const ndviSeries = await Promise.all(
      response.data
        .filter(img => img.stats && img.stats.ndvi)
        .map(async img => {
          try {
            const statsRes = await axios.get(img.stats.ndvi);
            return {
              date: new Date(img.dt * 1000),
              ndvi: statsRes.data.mean // or .median if you prefer
            };
          } catch (err) {
            return null; // skip if stats fetch fails
          }
        })
    );

    // Filter out any nulls (failed fetches)
    res.json({ ndvi: ndviSeries.filter(Boolean) });
  } catch (error) {
    console.error('NDVI fetchNDVITimeSeries error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch NDVI time series' });
  }
}; 