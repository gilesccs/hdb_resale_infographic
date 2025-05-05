import fs from 'fs';
import * as turf from '@turf/turf';
import planningAreaToHdbTown from './planning_area_to_hdb_town.js';

const geojson = JSON.parse(fs.readFileSync('src/data/singaporePlanningAreas.json', 'utf8'));

const townFeatures = {};
const planningAreaAssignments = {};

geojson.features.forEach(feature => {
  const desc = feature.properties.Description;
  const match = desc.match(/<th>PLN_AREA_N<\/th>\s*<td>(.*?)<\/td>/);
  if (!match) return;
  const planningArea = match[1].toUpperCase();
  const hdbTown = planningAreaToHdbTown[planningArea];
  if (!hdbTown) return; // skip non-HDB towns

  if (!townFeatures[hdbTown]) townFeatures[hdbTown] = [];
  townFeatures[hdbTown].push(feature);

  if (!planningAreaAssignments[hdbTown]) planningAreaAssignments[hdbTown] = [];
  planningAreaAssignments[hdbTown].push(planningArea);
});

console.log('Planning area assignments by HDB town:');
Object.entries(planningAreaAssignments).forEach(([town, areas]) => {
  console.log(`${town}: ${areas.join(', ')}`);
  console.log(`  Number of subzones for ${town}: ${areas.length}`);
});

const mergedFeatures = Object.entries(townFeatures).map(([town, features]) => {
  // Filter out features with missing or invalid geometry
  const validFeatures = features.filter(f => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));
  console.log(`Merging town: ${town}`);
  console.log(`  Total features: ${features.length}`);
  console.log(`  Valid features: ${validFeatures.length}`);

  let merged;
  if (validFeatures.length === 0) {
    console.warn(`No valid geometry for town: ${town}`);
    return null;
  } else if (validFeatures.length === 1) {
    merged = validFeatures[0];
  } else {
    merged = validFeatures[0];
    for (let i = 1; i < validFeatures.length; i++) {
      if (!validFeatures[i].geometry) continue;
      try {
        merged = turf.union(merged, validFeatures[i]);
      } catch (e) {
        console.warn(`Union failed for town: ${town}, skipping a feature.`, e);
      }
    }
  }
  merged.properties = { Name: town };
  // Print geometry info for the merged feature
  if (merged.geometry) {
    if (merged.geometry.type === 'Polygon') {
      console.log(`  Merged geometry type: Polygon, coordinates count: ${merged.geometry.coordinates.length}`);
    } else if (merged.geometry.type === 'MultiPolygon') {
      console.log(`  Merged geometry type: MultiPolygon, coordinates count: ${merged.geometry.coordinates.length}`);
    } else {
      console.log(`  Merged geometry type: ${merged.geometry.type}`);
    }
  }
  return merged;
});

const mergedTownNames = new Set(mergedFeatures.filter(f => f).map(f => f.properties.Name));
const allTownNames = new Set(Object.values(planningAreaToHdbTown).filter(Boolean));
const missingTowns = [...allTownNames].filter(town => !mergedTownNames.has(town));

console.log('---');
console.log('Towns missing from merged output:', missingTowns);

// Remove any nulls from failed merges
const mergedGeoJSON = {
  type: "FeatureCollection",
  features: mergedFeatures.filter(f => f)
};

fs.writeFileSync('src/data/hdbTownsMerged.json', JSON.stringify(mergedGeoJSON, null, 2));
console.log('Merged GeoJSON saved to src/data/hdbTownsMerged.json'); 