const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = '/tmp/propertyDataCache.json';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

exports.handler = async function(event, context) {
  try {
    // Try to read from cache
    if (fs.existsSync(CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      if (Date.now() - cache.timestamp < CACHE_DURATION) {
        // Cache is fresh, return cached data
        return {
          statusCode: 200,
          body: JSON.stringify(cache.data)
        };
      }
    }

    // Fetch fresh data from API
    const API_URL = 'https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc&limit=1000';
    const response = await fetch(API_URL);
    const data = await response.json();

    // Write to cache
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ data, timestamp: Date.now() }));

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch property data', details: error.message })
    };
  }
}; 