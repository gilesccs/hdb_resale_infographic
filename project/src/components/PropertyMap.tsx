import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { MapGeoJSONFeature, MapLayerMouseEvent, MapMouseEvent } from 'maplibre-gl';
import * as d3 from 'd3';
import { Info } from 'lucide-react';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import combine from '@turf/combine';
import { featureCollection } from '@turf/helpers';
import { Paper, Text, Title, Group, Stack } from '@mantine/core';
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
  isTownBoundary?: boolean;
}

type PlanningAreaFeature = Feature<Polygon | MultiPolygon, PlanningAreaProperties>;
type PlanningAreaCollection = FeatureCollection<Polygon | MultiPolygon, PlanningAreaProperties>;

const PropertyMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [planningAreas, setPlanningAreas] = useState<PlanningAreaCollection | null>(null);
  const [propertyData, setPropertyData] = useState<ProcessedPropertyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<{
    name: string;
    data: TownData;
  } | null>(null);
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
              'raster-opacity': 0.3
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

    // Add base map with reduced opacity
    if (!map.current.getLayer('osm')) {
      map.current.addLayer({
        id: 'osm',
        type: 'raster',
        source: 'osm',
        paint: {
          'raster-opacity': 0.3
        }
      });
    }

    // Add region fills with enhanced hover effect
    if (!map.current.getLayer('region-fills')) {
      map.current.addLayer({
        id: 'region-fills',
        type: 'fill-extrusion',
        source: 'hdb-towns',
        paint: {
          'fill-extrusion-color': [
            'case',
            ['has', 'averagePrice'],
            ['interpolate', ['linear'], ['get', 'averagePrice'], 200000, '#2ecc71', 600000, '#f1c40f', 1000000, '#e74c3c'],
            '#d1d5db'
          ],
          'fill-extrusion-height': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1000,
            0
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.95
        }
      });
    }

    // Add base fill layer for better visibility
    if (!map.current.getLayer('region-base')) {
      map.current.addLayer({
        id: 'region-base',
        type: 'fill',
        source: 'hdb-towns',
        paint: {
          'fill-color': [
            'case',
            ['has', 'averagePrice'],
            ['interpolate', ['linear'], ['get', 'averagePrice'], 200000, '#2ecc71', 600000, '#f1c40f', 1000000, '#e74c3c'],
            '#d1d5db'
          ],
          'fill-opacity': 1
        }
      }, 'region-fills');  // Insert before the extrusion layer
    }

    // Add border layer
    if (!map.current.getLayer('region-borders')) {
      map.current.addLayer({
        id: 'region-borders',
        type: 'line',
        source: 'hdb-towns',
        paint: {
          'line-color': '#ffffff',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            2,
            1
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.8,
            0.3
          ]
        }
      });
    }

    // Add highlight border for hovered state
    if (!map.current.getLayer('region-hover-borders')) {
      map.current.addLayer({
        id: 'region-hover-borders',
        type: 'line',
        source: 'hdb-towns',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.8,
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

          if (townData) {
            setSelectedArea({
              name: townName,
              data: townData
            });
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
        setSelectedArea(null);
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

    // Create two separate feature collections: one for town boundaries and one for subzones
    const townBoundaries: PlanningAreaFeature[] = [];
    let idCounter = 0;
    
    featuresByTown.forEach((features, townName) => {
      if (features.length === 0) return;

      // Get the town data
      const townData = getTownDataForTooltip(townName);

      // Create a merged feature for the town boundary
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
          id: idCounter,
          isTownBoundary: true  // Mark this as a town boundary
        };
        mergedFeature.id = idCounter++;
        townBoundaries.push(mergedFeature);
      }
    });

    // Update the source data with town boundaries only
    const updatedData: PlanningAreaCollection = {
      type: 'FeatureCollection',
      features: townBoundaries
    };

    // Update the source data
    source.setData(updatedData);

    // Update the layer styles
    if (map.current) {
      // Update fill layer if needed
      if (!map.current.getLayer('region-fills')) {
        map.current.addLayer({
          id: 'region-fills',
          type: 'fill-extrusion',
          source: 'hdb-towns',
          paint: {
            'fill-extrusion-color': [
              'case',
              ['has', 'averagePrice'],
              ['interpolate', ['linear'], ['get', 'averagePrice'], 200000, '#2ecc71', 600000, '#f1c40f', 1000000, '#e74c3c'],
              '#d1d5db'
            ],
            'fill-extrusion-height': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              1000,
              0
            ],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.95
          }
        });
      }
    }
    
    // Rest of the hover effect code...
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
        
        {/* Info Panel */}
        <div className="absolute top-4 right-4 z-20" style={{ minWidth: '220px', maxWidth: '240px' }}>
          {selectedArea ? (
            <Paper 
              shadow="sm" 
              p="xs" 
              radius="md" 
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(231, 245, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(77, 171, 247, 0.1)'
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center">
                  <Title order={4} style={{ 
                    fontSize: '1.1rem',
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(135deg, #2188ff, #0366d6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 600
                  }}>
                    {selectedArea.name}
                  </Title>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{
                    background: 'linear-gradient(to right, rgba(231, 245, 255, 0.5), rgba(231, 245, 255, 0.3))',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(231, 245, 255, 0.5)'
                  }}>
                    <Text c="dimmed" size="xs" style={{ 
                      marginBottom: '1px',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      fontWeight: 500
                    }}>
                      Average Price
                    </Text>
                    <Text size="md" fw={600} style={{ 
                      color: '#0366d6',
                      letterSpacing: '-0.01em'
                    }}>
                      ${selectedArea.data.averagePrice.toLocaleString()}
                    </Text>
                  </div>
                  <div style={{
                    background: 'linear-gradient(to right, rgba(231, 245, 255, 0.5), rgba(231, 245, 255, 0.3))',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(231, 245, 255, 0.5)'
                  }}>
                    <Text c="dimmed" size="xs" style={{ 
                      marginBottom: '1px',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      fontWeight: 500
                    }}>
                      Number of Listings
                    </Text>
                    <Text size="md" fw={600} style={{ 
                      color: '#0366d6',
                      letterSpacing: '-0.01em'
                    }}>
                      {selectedArea.data.listingsCount}
                    </Text>
                  </div>
                </div>
              </div>
            </Paper>
          ) : (
            <Paper 
              shadow="sm" 
              p="xs" 
              radius="md" 
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(231, 245, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(77, 171, 247, 0.1)'
              }}
            >
              <Text c="dimmed" size="xs" style={{ 
                color: '#0366d6',
                letterSpacing: '0.02em',
                fontWeight: 500
              }}>
                Hover over an area to see details
              </Text>
            </Paper>
          )}
        </div>

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