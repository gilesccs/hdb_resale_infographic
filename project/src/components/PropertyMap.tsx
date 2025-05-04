import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import * as d3 from 'd3';
import { Info } from 'lucide-react';
import FilterBar from './FilterBar';
import { getPropertyData } from '../services/apiService';
import { ProcessedPropertyData, PropertyFilters, TownData } from '../types';
import hdbTownsGeoJSON from '../data/hdbTownsMerged.json';
import { processPropertyData } from '../utils/dataUtils';
import 'maplibre-gl/dist/maplibre-gl.css';

const PropertyMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
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
    if (!mapContainer.current) return;

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

    return () => {
      map.current?.remove();
    };
  }, []);

  const initializeMapLayers = () => {
    if (!map.current || !map.current.loaded()) return;

    // Check if source already exists
    if (!map.current.getSource('hdb-towns')) {
      map.current.addSource('hdb-towns', {
        type: 'geojson',
        data: hdbTownsGeoJSON
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
          'fill-opacity': 0.7
        }
      });
    }

    if (!map.current.getLayer('region-borders')) {
      map.current.addLayer({
        id: 'region-borders',
        type: 'line',
        source: 'hdb-towns',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1
        }
      });
    }

    // Add hover effect only once
    if (!map.current.listens('mousemove', 'region-fills')) {
      map.current.on('mousemove', 'region-fills', (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          const townName = feature.properties.Name;
          const townData = getTownDataForTooltip(townName);

          if (townData) {
            new maplibregl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(
                `<div class="bg-white p-2 rounded shadow">
                  <h3 class="font-bold">${townName}</h3>
                  <p>Average Price: $${townData.averagePrice.toLocaleString()}</p>
                  <p>Listings: ${townData.listingsCount}</p>
                </div>`
              )
              .addTo(map.current!);
          }
        }
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getPropertyData();
        const processedData = processPropertyData(data);
        setPropertyData(processedData);

        if (map.current) {
          // Wait for map to be loaded before initializing layers
          if (map.current.loaded()) {
            initializeMapLayers();
          } else {
            map.current.once('load', initializeMapLayers);
          }
        }
      } catch (err) {
        setError('Failed to load property data. Please try again later.');
        console.error('Error fetching property data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTownDataForTooltip = (townName: string): TownData | null => {
    if (!propertyData || !propertyData.towns[townName]) return null;
    
    const townData = propertyData.towns[townName];
    const filteredListings = townData.listings.filter(listing => {
      const meetsTypeFilter = filters.flatType === 'ALL' || listing.flat_type === filters.flatType;
      
      const leaseYears = parseInt(listing.remaining_lease.split(' ')[0]);
      const meetsLeaseFilter = leaseYears >= filters.minLeaseYears && leaseYears <= filters.maxLeaseYears;
      
      return meetsTypeFilter && meetsLeaseFilter;
    });
    
    if (filteredListings.length === 0) return null;
    
    const totalPrice = filteredListings.reduce((sum, listing) => sum + parseInt(listing.resale_price), 0);
    const averagePrice = Math.round(totalPrice / filteredListings.length);
    
    return {
      ...townData,
      averagePrice,
      listingsCount: filteredListings.length
    };
  };

  const handleFilterChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters);
    updateMapColors();
  };

  const updateMapColors = () => {
    if (!map.current || !propertyData) return;

    const features = hdbTownsGeoJSON.features.map((feature: any) => {
      const townName = feature.properties.Name;
      const townData = getTownDataForTooltip(townName);
      return {
        ...feature,
        properties: {
          ...feature.properties,
          averagePrice: townData?.averagePrice || null
        }
      };
    });

    const source = map.current.getSource('hdb-towns') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-200">
        <FilterBar onFilterChange={handleFilterChange} />
      </div>
      
      <div className="relative">
        <div ref={mapContainer} className="h-[600px] w-full" />
        
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center text-red-500">
            <p>{error}</p>
          </div>
        )}
        
        <div className="absolute top-4 right-4 bg-white p-3 rounded-md shadow-md z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">Price Legend</h3>
            <Info className="h-4 w-4 text-gray-500" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: colorScale(1000000) }}></div>
              <span className="text-xs">Expensive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: colorScale(600000) }}></div>
              <span className="text-xs">Average</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: colorScale(200000) }}></div>
              <span className="text-xs">Affordable</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-sm bg-gray-300"></div>
              <span className="text-xs">No data/Filtered</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">
            This map shows the average resale prices of HDB flats across Singapore towns. 
            Use the filters above to narrow down by flat type and remaining lease years. 
            Towns are color-coded based on average prices, with red indicating more expensive areas and green showing more affordable options.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PropertyMap;