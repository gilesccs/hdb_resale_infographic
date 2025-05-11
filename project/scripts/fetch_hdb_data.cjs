const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://data.gov.sg/api/action/datastore_search';
const RESOURCE_ID = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';
const LIMIT = 1000;

async function fetchAllRecords() {
  let allRecords = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const url = `${API_URL}?resource_id=${RESOURCE_ID}&limit=${LIMIT}&offset=${offset}`;
    console.log(`Fetching records ${offset} to ${offset + LIMIT}...`);
    const response = await fetch(url);
    const data = await response.json();
    if (!data.result || !Array.isArray(data.result.records)) break;
    allRecords = allRecords.concat(data.result.records);
    total = data.result.total;
    offset += LIMIT;
  }
  return allRecords;
}

(async () => {
  const records = await fetchAllRecords();
  const outPath = path.join(__dirname, '../public/propertyData.json');
  fs.writeFileSync(outPath, JSON.stringify({ records }, null, 2));
  console.log(`Saved ${records.length} records to ${outPath}`);
})(); 