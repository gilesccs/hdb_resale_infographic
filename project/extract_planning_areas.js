import fs from 'fs';

const geojson = JSON.parse(fs.readFileSync('src/data/singaporePlanningAreas.json', 'utf8'));

const planningAreas = new Set();

geojson.features.forEach(feature => {
  const desc = feature.properties.Description;
  // Extract PLN_AREA_N from the Description HTML
  const match = desc.match(/<th>PLN_AREA_N<\/th>\s*<td>(.*?)<\/td>/);
  if (match) {
    planningAreas.add(match[1].toUpperCase());
  }
});

[...planningAreas].forEach(area => console.log(area));