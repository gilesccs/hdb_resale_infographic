import { Feature, FeatureCollection, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';
import union from '@turf/union';
import { featureCollection } from '@turf/helpers';

interface PlanningAreaProperties {
  Name: string;
  HDBTownName: string | null;
  originalSubzones: string[];
  averagePrice?: number;
  listingsCount?: number;
}

type PolygonFeature = Feature<Polygon | MultiPolygon, PlanningAreaProperties>;

export function mergeTownPolygons(geojson: FeatureCollection): FeatureCollection {
  // Group features by town name
  const townGroups = new Map<string, PolygonFeature[]>();
  
  geojson.features.forEach(feature => {
    // Only process polygon features
    if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') {
      return;
    }

    const properties = feature.properties as PlanningAreaProperties;
    const townName = properties.HDBTownName || properties.Name;
    
    if (!townGroups.has(townName)) {
      townGroups.set(townName, []);
    }
    townGroups.get(townName)!.push(feature as PolygonFeature);
  });

  // Merge polygons for each town
  const mergedFeatures: Feature[] = [];
  
  townGroups.forEach((features, townName) => {
    if (features.length === 0) return;

    // Get the properties from the first feature
    const baseProperties = features[0].properties;
    
    // If there's only one feature, no need to merge
    if (features.length === 1) {
      mergedFeatures.push(features[0]);
      return;
    }

    try {
      // Start with the first feature
      let mergedFeature = features[0];
      
      // Iteratively merge with remaining features
      for (let i = 1; i < features.length; i++) {
        const result = union(mergedFeature, features[i]);
        if (result) {
          mergedFeature = result;
        }
      }

      // Preserve the original properties
      mergedFeature.properties = {
        ...baseProperties,
        originalSubzones: features.map(f => f.properties.Name)
      };
      
      mergedFeatures.push(mergedFeature);
    } catch (error) {
      console.error(`Error merging polygons for ${townName}:`, error);
      // If merge fails, just use the original features
      mergedFeatures.push(...features);
    }
  });

  return {
    type: 'FeatureCollection',
    features: mergedFeatures
  };
}

// Helper function to calculate polygon area
function calculatePolygonArea(coordinates: number[][]): number {
  // Simple implementation of shoelace formula
  let area = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    area += coordinates[i][0] * coordinates[i + 1][1];
    area -= coordinates[i + 1][0] * coordinates[i][1];
  }
  
  return Math.abs(area / 2);
} 