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
    maxLeaseYears: 99,
    floorAreaRange: 'ANY',
    minStorey: 1,
    maxStorey: 50
  });
  const [allPropertyData, setAllPropertyData] = useState<PropertyRecord[]>([]);

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
        const response = await fetch('/propertyData.json');
        if (!response.ok) {
          throw new Error('Failed to fetch property data');
        }
        const { records } = await response.json();
        if (!Array.isArray(records)) {
          throw new Error('Invalid data format: expected an array of records');
        }
        setAllPropertyData(records);
        setError(null);
      } catch (err) {
        console.error('Error fetching property data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch property data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!allPropertyData.length) return;
    console.log('Total records fetched:', allPropertyData.length);
    const processed = processPropertyData(allPropertyData);
    setPropertyData(processed);
    // Debug: How many in Jurong West, Yishun, Woodlands?
    if (processed.towns['JURONG WEST']) {
      console.log('Jurong West total listings:', processed.towns['JURONG WEST'].listings.length);
    } else {
      console.log('Jurong West not found in processed data');
    }
    if (processed.towns['YISHUN']) {
      console.log('Yishun total listings:', processed.towns['YISHUN'].listings.length);
    } else {
      console.log('Yishun not found in processed data');
    }
    if (processed.towns['WOODLANDS']) {
      console.log('Woodlands total listings:', processed.towns['WOODLANDS'].listings.length);
    } else {
      console.log('Woodlands not found in processed data');
    }
  }, [filters, allPropertyData]);

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

    // Helper: parse storey range string (e.g., '10 TO 12') to [10, 12]
    const parseStoreyRange = (range: string) => {
      const match = range.match(/(\d+)\s*TO\s*(\d+)/);
      if (match) return [parseInt(match[1]), parseInt(match[2])];
      const single = range.match(/(\d+)/);
      if (single) return [parseInt(single[1]), parseInt(single[1])];
      return [1, 50];
    };

    // Helper: check if a value is in a range
    const inRange = (val: number, min: number, max: number) => val >= min && val <= max;

    // Helper: check if a floor area matches the selected range
    const matchesFloorArea = (area: number, range: string) => {
      switch (range) {
        case 'BELOW_60': return area < 60;
        case '60_79': return area >= 60 && area <= 79;
        case '80_99': return area >= 80 && area <= 99;
        case '100_119': return area >= 100 && area <= 119;
        case '120_PLUS': return area >= 120;
        default: return true;
      }
    };

    // Filter listings based on current filters
    const filteredListings = townData.listings.filter(listing => {
      const meetsTypeFilter = filters.flatType === 'ALL' || listing.flat_type === filters.flatType;
      const leaseYearsMatch = listing.remaining_lease.match(/(\d+)\s+years/);
      const leaseYears = leaseYearsMatch ? parseInt(leaseYearsMatch[1]) : 0;
      const meetsLeaseFilter = leaseYears >= filters.minLeaseYears && leaseYears <= filters.maxLeaseYears;
      // Floor area
      const area = parseFloat(listing.floor_area_sqm);
      const meetsFloorArea = matchesFloorArea(area, filters.floorAreaRange);
      // Storey range
      const [listingMinStorey, listingMaxStorey] = parseStoreyRange(listing.storey_range);
      const meetsStorey = listingMaxStorey >= filters.minStorey && listingMinStorey <= filters.maxStorey;
      return meetsTypeFilter && meetsLeaseFilter && meetsFloorArea && meetsStorey;
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
          } else {
            setSelectedArea({
              name: townName,
              data: {
                averagePrice: 0,
                listingsCount: 0,
                listings: []
              }
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
      <div className="p-2 sm:p-4 bg-white shadow-sm z-10">
        <FilterBar
          filters={filters}
          onFiltersChange={(newFilters: PropertyFilters) => {
            setFilters(newFilters);
          }}
        />
      </div>
      <div className="relative flex-1 min-h-0">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Info Panel - Responsive positioning */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 w-[calc(100%-1rem)] sm:w-auto sm:min-w-[220px] sm:max-w-[240px]">
          {selectedArea ? (
            <div
              className="rounded-xl border border-border bg-white/70 backdrop-blur-md shadow-xl px-3 sm:px-4 py-2 sm:py-3 flex flex-col gap-2 font-sans"
              style={{
                fontFamily: 'PT Root UI, ui-sans-serif, system-ui, sans-serif',
                boxShadow: '0 8px 32px rgba(77, 171, 247, 0.10)',
              }}
            >
              <div className="flex items-center mb-1">
                <span className="text-sm sm:text-base font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent tracking-tight">
                  {selectedArea.name}
                </span>
              </div>
              {selectedArea.data.listingsCount > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="bg-gradient-to-r from-blue-50/60 to-blue-100/30 p-2 rounded-md border border-blue-100">
                    <span className="block text-[10px] sm:text-[11px] uppercase font-semibold text-blue-700/70 mb-0.5 tracking-wide">Average Price</span>
                    <span className="text-[13px] sm:text-[15px] font-bold text-blue-700">${selectedArea.data.averagePrice.toLocaleString()}</span>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50/60 to-blue-100/30 p-2 rounded-md border border-blue-100">
                    <span className="block text-[10px] sm:text-[11px] uppercase font-semibold text-blue-700/70 mb-0.5 tracking-wide">Number of Listings</span>
                    <span className="text-[13px] sm:text-[15px] font-bold text-blue-700">{selectedArea.data.listingsCount}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-50/60 to-amber-100/30 p-2 sm:p-3 rounded-md border border-amber-100">
                  <span className="block text-[12px] sm:text-[13px] font-medium text-amber-700/80 mb-1">No properties found</span>
                  <span className="block text-[10px] sm:text-[11px] text-amber-600/70">Try adjusting your filters to see more listings in this area.</span>
                </div>
              )}
            </div>
          ) : (
            <div
              className="rounded-xl border border-border bg-white/70 backdrop-blur-md shadow-xl px-3 sm:px-4 py-2 sm:py-3 font-sans"
              style={{
                fontFamily: 'PT Root UI, ui-sans-serif, system-ui, sans-serif',
                boxShadow: '0 8px 32px rgba(77, 171, 247, 0.10)',
              }}
            >
              <span className="text-[10px] sm:text-xs text-blue-700/80 font-semibold">Hover over an area to see details</span>
            </div>
          )}
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white/90 px-4 py-2 rounded-lg shadow-lg text-sm sm:text-base font-medium text-gray-700">
              Loading...
            </div>
          </div>
        )}
        {error && (
          <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center text-sm sm:text-base">
            <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyMap;