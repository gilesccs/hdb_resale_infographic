import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';
import planningAreaToHdbTown from '../data/planning_area_to_hdb_town.ts';

interface SubzoneFeature extends Feature<Polygon | MultiPolygon> {
  properties: {
    Description: string;
    [key: string]: any;
  };
}

interface PlanningAreaFeature extends Feature<Polygon | MultiPolygon> {
  properties: {
    Name: string;
    HDBTownName: string | null;
    originalSubzones: string[];
    isTownBoundary: boolean;
    id: number;
    [key: string]: any;
  };
}

function extractPlanningArea(description: string): string | null {
  const match = description.match(/<th>PLN_AREA_N<\/th>\s*<td>(.*?)<\/td>/);
  return match ? match[1].toUpperCase() : null;
}

function extractSubzoneName(description: string): string | null {
  const match = description.match(/<th>SUBZONE_N<\/th>\s*<td>(.*?)<\/td>/);
  return match ? match[1].toUpperCase() : null;
}

export function mergeSubzonesToPlanningAreas(
  subzoneGeoJSON: FeatureCollection<Polygon | MultiPolygon>
): FeatureCollection<Polygon | MultiPolygon> {
  // Group features by planning area
  const planningAreaGroups = new Map<string, SubzoneFeature[]>();
  
  subzoneGeoJSON.features.forEach(feature => {
    const description = (feature as SubzoneFeature).properties?.Description;
    if (!description) return;

    const planningArea = extractPlanningArea(description);
    if (!planningArea) return;

    if (!planningAreaGroups.has(planningArea)) {
      planningAreaGroups.set(planningArea, []);
    }
    planningAreaGroups.get(planningArea)!.push(feature as SubzoneFeature);
  });

  // Process each planning area
  const townBoundaries: PlanningAreaFeature[] = [];
  let idCounter = 0;

  planningAreaGroups.forEach((features, planningArea) => {
    if (features.length === 0) return;

    try {
      const hdbTownName = planningAreaToHdbTown[planningArea] || null;
      if (!hdbTownName) return; // Skip if not an HDB town

      // Create a feature collection from the subzone features
      const collection = turf.featureCollection(features);
      
      // Combine the features
      const combined = turf.combine(collection);
      
      if (!combined || combined.features.length === 0) return;

      // Create the town boundary feature
      const townBoundaryFeature: PlanningAreaFeature = {
        type: 'Feature',
        properties: {
          Name: planningArea,
          HDBTownName: hdbTownName,
          originalSubzones: features.map(f => extractSubzoneName(f.properties.Description) || ''),
          isTownBoundary: true,
          id: idCounter++
        },
        geometry: combined.features[0].geometry
      };
      townBoundaries.push(townBoundaryFeature);

    } catch (error) {
      console.error(`Error processing features for ${planningArea}:`, error);
    }
  });

  return {
    type: 'FeatureCollection',
    features: townBoundaries
  };
} 