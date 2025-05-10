const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    // Replace with your actual API URL and logic
    const API_URL = 'https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc&limit=1000';
    const response = await fetch(API_URL);
    const data = await response.json();

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