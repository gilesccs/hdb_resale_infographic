const fetch = require('node-fetch');
const fs = require('fs');

const CACHE_FILE = '/tmp/propertyDataCache.json';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_URL = 'https://data.gov.sg/api/action/datastore_search';
const RESOURCE_ID = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';
const LIMIT = 1000;

async function fetchAllRecords() {
  let allRecords = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const url = `${API_URL}?resource_id=${RESOURCE_ID}&limit=${LIMIT}&offset=${offset}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.result || !Array.isArray(data.result.records)) break;
    allRecords = allRecords.concat(data.result.records);
    total = data.result.total;
    offset += LIMIT;
  }
  return allRecords;
}

exports.handler = async function(event, context) {
  try {
    // Try to read from cache
    if (fs.existsSync(CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      if (Date.now() - cache.timestamp < CACHE_DURATION) {
        return {
          statusCode: 200,
          body: JSON.stringify({ result: { records: cache.data } })
        };
      }
    }

    // Fetch all records from API
    const allRecords = await fetchAllRecords();

    // Write to cache
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ data: allRecords, timestamp: Date.now() }));

    return {
      statusCode: 200,
      body: JSON.stringify({ result: { records: allRecords } })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch property data', details: error.message })
    };
  }
}; 