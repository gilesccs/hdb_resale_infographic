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
    [key: string]: any;
  };
}

function extractPlanningArea(description: string): string | null {
  const match = description.match(/<th>PLN_AREA_N<\/th>\s*<td>(.*?)<\/td>/);
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

  // Merge geometries for each planning area
  const mergedFeatures: PlanningAreaFeature[] = [];

  planningAreaGroups.forEach((features, planningArea) => {
    // Skip if no features
    if (features.length === 0) return;

    try {
      // Create a feature collection from the subzone features
      const collection = turf.featureCollection(features);
      
      // Merge using combine
      const combined = turf.combine(collection);
      
      if (!combined || combined.features.length === 0) return;

      // Get corresponding HDB town name
      const hdbTownName = planningAreaToHdbTown[planningArea] || null;

      // Create merged feature
      const mergedFeature: PlanningAreaFeature = {
        type: 'Feature',
        properties: {
          Name: planningArea,
          HDBTownName: hdbTownName,
          originalSubzones: features.map(f => extractPlanningArea(f.properties.Description) || '')
        },
        geometry: combined.features[0].geometry
      };

      // Only include features that map to an HDB town
      if (hdbTownName) {
        mergedFeatures.push(mergedFeature);
      }
    } catch (error) {
      console.error(`Error merging features for ${planningArea}:`, error);
    }
  });

  return {
    type: 'FeatureCollection',
    features: mergedFeatures
  };
} 