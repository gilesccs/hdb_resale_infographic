import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { MapGeoJSONFeature, MapLayerMouseEvent, MapMouseEvent } from 'maplibre-gl';
import * as d3 from 'd3';
import { Info } from 'lucide-react';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import combine from '@turf/combine';
import { featureCollection } from '@turf/helpers';
import FilterBar from './FilterBar';
import { getPropertyData } from '../services/apiService';
import { ProcessedPropertyData, PropertyFilters, TownData, PropertyRecord } from '../types';
import { processPropertyData } from '../utils/dataUtils';
import planningAreasData from '../data/mergedPlanningAreas.json';
import 'maplibre-gl/dist/maplibre-gl.css';

interface PlanningAreaProperties {
  Name: string;
  HDBTownName: string | null;
  originalSubzones: string[];
  averagePrice?: number;
  listingsCount?: number;
  id?: number;
}

type PlanningAreaFeature = Feature<Polygon | MultiPolygon, PlanningAreaProperties>;
type PlanningAreaCollection = FeatureCollection<Polygon | MultiPolygon, PlanningAreaProperties>;

const PropertyMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const [planningAreas, setPlanningAreas] = useState<PlanningAreaCollection | null>(null);
  const [propertyData, setPropertyData] = useState<ProcessedPropertyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PropertyFilters>({
    flatType: 'ALL',
    minLeaseYears: 0,
    maxLeaseYears: 99
  });

  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlGn)
    .domain([1000000, 200000]); // Reversed domain for red=expensive, green=affordable

  useEffect(() => {
    console.log('Map container ref:', mapContainer.current);
    if (!mapContainer.current) return;

    console.log('Initializing map...');
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            paint: {
              'raster-opacity': 0.5
            }
          }
        ]
      },
      center: [103.8198, 1.3521],
      zoom: 11
    });

    console.log('Map initialized:', map.current);

    map.current.on('load', () => {
      console.log('Map loaded event fired');
    });

    map.current.on('error', (e) => {
      console.error('Map error:', e);
      setError('Error loading map: ' + e.error?.message || 'Unknown error');
    });

    return () => {
      console.log('Cleaning up map...');
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getPropertyData();
        const processed = processPropertyData(data);
        setPropertyData(processed);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch property data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  useEffect(() => {
    const loadPlanningAreas = async () => {
      try {
        console.log('Fetching planning areas data...');
        const response = await fetch('/mergedPlanningAreas.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Add unique IDs to each feature
        const dataWithIds = {
          type: 'FeatureCollection',
          features: data.features.map((feature: any, index: number) => ({
            ...feature,
            id: index
          }))
        };

        console.log('Planning areas data loaded:', dataWithIds);
        setPlanningAreas(dataWithIds as PlanningAreaCollection);
      } catch (err) {
        console.error('Error loading planning areas:', err);
        setError(err instanceof Error ? err.message : 'Failed to load planning areas data');
      }
    };
    loadPlanningAreas();
  }, []);

  useEffect(() => {
    if (!map.current || !propertyData || !planningAreas) return;

    initializeMapLayers();
    updateMapData();
  }, [map.current, propertyData, planningAreas]);

  const getTownDataForTooltip = (townName: string): TownData | null => {
    if (!propertyData) return null;

    const townData = propertyData.towns[townName];
    if (!townData) return null;

    // Filter listings based on current filters
    const filteredListings = townData.listings.filter(listing => {
      const meetsTypeFilter = filters.flatType === 'ALL' || listing.flat_type === filters.flatType;
      
      const leaseYearsMatch = listing.remaining_lease.match(/(\d+)\s+years/);
      const leaseYears = leaseYearsMatch ? parseInt(leaseYearsMatch[1]) : 0;
      const meetsLeaseFilter = leaseYears >= filters.minLeaseYears && leaseYears <= filters.maxLeaseYears;
      
      return meetsTypeFilter && meetsLeaseFilter;
    });

    if (filteredListings.length === 0) return null;

    // Calculate average price for filtered listings
    const totalPrice = filteredListings.reduce((sum, listing) => sum + parseInt(listing.resale_price), 0);
    const averagePrice = Math.round(totalPrice / filteredListings.length);

    return {
      averagePrice,
      listingsCount: filteredListings.length,
      listings: filteredListings
    };
  };

  const initializeMapLayers = () => {
    if (!map.current || !map.current.loaded()) return;

    // Check if source already exists
    if (!map.current.getSource('hdb-towns')) {
      map.current.addSource('hdb-towns', {
        type: 'geojson',
        data: planningAreas
      });
    }

    // Check if layers already exist before adding them
    if (!map.current.getLayer('region-fills')) {
      map.current.addLayer({
        id: 'region-fills',
        type: 'fill',
        source: 'hdb-towns',
        paint: {
          'fill-color': [
            'case',
            ['has', 'averagePrice'],
            ['interpolate', ['linear'], ['get', 'averagePrice'], 200000, '#2ecc71', 600000, '#f1c40f', 1000000, '#e74c3c'],
            '#d1d5db'
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.9,
            0.7
          ]
        }
      });
    }

    // Add thick white border underneath for glow effect
    if (!map.current.getLayer('region-borders-glow')) {
      map.current.addLayer({
        id: 'region-borders-glow',
        type: 'line',
        source: 'hdb-towns',
        layout: {
          'line-join': 'round'
        },
        filter: ['==', ['get', 'isTownBoundary'], true],
        paint: {
          'line-color': '#ffffff',
          'line-width': 4,
          'line-opacity': 1,
          'line-blur': 1
        }
      });
    }

    if (!map.current.getLayer('region-borders')) {
      map.current.addLayer({
        id: 'region-borders',
        type: 'line',
        source: 'hdb-towns',
        layout: {
          'line-join': 'round'
        },
        filter: ['==', ['get', 'isTownBoundary'], true],
        paint: {
          'line-color': '#34495e',
          'line-width': 2.5,
          'line-opacity': 1
        }
      });
    }

    // Add hover highlight layer
    if (!map.current.getLayer('region-hover')) {
      map.current.addLayer({
        id: 'region-hover',
        type: 'line',
        source: 'hdb-towns',
        paint: {
          'line-color': '#ffffff',
          'line-width': 3,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0
          ]
        }
      });
    }

    // Add hover effect
    if (map.current) {
      let hoveredStateId: number | undefined = undefined;

      // Remove any existing event handlers
      map.current.off('mousemove', 'region-fills', () => {});
      map.current.off('mouseleave', 'region-fills', () => {});

      const handleMouseMove = (e: MapLayerMouseEvent) => {
        console.log('Mousemove event:', e.features?.[0]);
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          const featureId = feature.properties.id;
          
          if (hoveredStateId !== undefined) {
            map.current!.setFeatureState(
              { source: 'hdb-towns', id: hoveredStateId },
              { hover: false }
            );
          }

          hoveredStateId = featureId;
          map.current!.setFeatureState(
            { source: 'hdb-towns', id: hoveredStateId },
            { hover: true }
          );

          const properties = feature.properties as PlanningAreaProperties;
          const townName = properties.HDBTownName || properties.Name;
          const townData = getTownDataForTooltip(townName);

          // Remove existing popup if it exists
          if (popup.current) {
            popup.current.remove();
          }

          if (townData && map.current) {
            // Create and store new popup
            popup.current = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'town-popup',
              offset: [0, -10]
            })
              .setLngLat(e.lngLat)
              .setHTML(
                `<div class="bg-white p-2 rounded shadow">
                  <h3 class="font-bold">${townName}</h3>
                  <p>Average Price: $${townData.averagePrice.toLocaleString()}</p>
                  <p>Listings: ${townData.listingsCount}</p>
                </div>`
              )
              .addTo(map.current);
          }
        }
      };

      const handleMouseLeave = () => {
        if (hoveredStateId !== undefined) {
          map.current!.setFeatureState(
            { source: 'hdb-towns', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = undefined;

        if (popup.current) {
          popup.current.remove();
          popup.current = null;
        }
      };

      map.current.on('mousemove', 'region-fills', handleMouseMove);
      map.current.on('mouseleave', 'region-fills', handleMouseLeave);
    }
  };

  const updateMapData = () => {
    if (!map.current || !propertyData || !planningAreas) return;

    const source = map.current.getSource('hdb-towns') as maplibregl.GeoJSONSource;
    if (!source) return;

    // Group features by town name
    const featuresByTown = new Map<string, PlanningAreaFeature[]>();
    planningAreas.features.forEach(feature => {
      const townName = feature.properties.HDBTownName || feature.properties.Name;
      if (!featuresByTown.has(townName)) {
        featuresByTown.set(townName, []);
      }
      featuresByTown.get(townName)!.push(feature as PlanningAreaFeature);
    });

    // Merge features for each town
    const mergedFeatures: PlanningAreaFeature[] = [];
    let idCounter = 0;  // Counter for generating unique IDs
    
    featuresByTown.forEach((features, townName) => {
      if (features.length === 0) return;

      // Get the town data
      const townData = getTownDataForTooltip(townName);

      if (features.length === 1) {
        // If there's only one feature, use it directly
        const feature = features[0];
        feature.properties = {
          Name: townName,
          HDBTownName: townName,
          originalSubzones: [],
          averagePrice: townData?.averagePrice,
          listingsCount: townData?.listingsCount,
          id: idCounter  // Store ID in properties as well
        };
        // Ensure the feature has a unique numeric ID
        feature.id = idCounter++;
        mergedFeatures.push(feature);
      } else {
        // For multiple features, combine them
        const collection = featureCollection(features);
        const combined = combine(collection);
        
        if (combined && combined.features.length > 0) {
          const mergedFeature = combined.features[0] as PlanningAreaFeature;
          mergedFeature.properties = {
            Name: townName,
            HDBTownName: townName,
            originalSubzones: [],
            averagePrice: townData?.averagePrice,
            listingsCount: townData?.listingsCount,
            id: idCounter  // Store ID in properties as well
          };
          // Ensure the feature has a unique numeric ID
          mergedFeature.id = idCounter++;
          mergedFeatures.push(mergedFeature);
        }
      }
    });

    // Update the source data with merged features
    const updatedData: PlanningAreaCollection = {
      type: 'FeatureCollection',
      features: mergedFeatures
    };

    // Update the source data
    source.setData(updatedData);

    // Add hover effect
    if (map.current) {
      let hoveredStateId: number | undefined = undefined;

      // Remove any existing event handlers
      map.current.off('mousemove', 'region-fills', () => {});
      map.current.off('mouseleave', 'region-fills', () => {});

      const handleMouseMove = (e: MapLayerMouseEvent) => {
        console.log('Mousemove event:', e.features?.[0]);
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          const featureId = feature.properties.id;
          
          if (hoveredStateId !== undefined) {
            map.current!.setFeatureState(
              { source: 'hdb-towns', id: hoveredStateId },
              { hover: false }
            );
          }

          hoveredStateId = featureId;
          map.current!.setFeatureState(
            { source: 'hdb-towns', id: hoveredStateId },
            { hover: true }
          );

          const properties = feature.properties as PlanningAreaProperties;
          const townName = properties.HDBTownName || properties.Name;
          const townData = getTownDataForTooltip(townName);

          // Remove existing popup if it exists
          if (popup.current) {
            popup.current.remove();
          }

          if (townData && map.current) {
            // Create and store new popup
            popup.current = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'town-popup',
              offset: [0, -10]
            })
              .setLngLat(e.lngLat)
              .setHTML(
                `<div class="bg-white p-2 rounded shadow">
                  <h3 class="font-bold">${townName}</h3>
                  <p>Average Price: $${townData.averagePrice.toLocaleString()}</p>
                  <p>Listings: ${townData.listingsCount}</p>
                </div>`
              )
              .addTo(map.current);
          }
        }
      };

      const handleMouseLeave = () => {
        if (hoveredStateId !== undefined) {
          map.current!.setFeatureState(
            { source: 'hdb-towns', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = undefined;

        if (popup.current) {
          popup.current.remove();
          popup.current = null;
        }
      };

      map.current.on('mousemove', 'region-fills', handleMouseMove);
      map.current.on('mouseleave', 'region-fills', handleMouseLeave);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="p-4 bg-white shadow-sm z-10">
        <FilterBar
          filters={filters}
          onFiltersChange={(newFilters: PropertyFilters) => {
            setFilters(newFilters);
          }}
        />
      </div>
      <div className="relative flex-1">
        <div ref={mapContainer} className="absolute inset-0" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white">Loading...</div>
          </div>
        )}
        {error && (
          <div className="absolute bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded flex items-center">
            <Info className="mr-2" size={20} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyMap;