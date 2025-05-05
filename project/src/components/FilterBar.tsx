import React, { useState, useEffect } from 'react';
import { Filter, RefreshCcw } from 'lucide-react';
import { PropertyFilters } from '../types';

interface FilterBarProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
}

const FLAT_TYPES = [
  'ALL',
  '1 ROOM',
  '2 ROOM',
  '3 ROOM',
  '4 ROOM',
  '5 ROOM',
  'EXECUTIVE',
  'MULTI-GENERATION'
];

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const resetFilters = () => {
    onFiltersChange({
      flatType: 'ALL',
      minLeaseYears: 0,
      maxLeaseYears: 99
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-600" />
          <h2 className="font-medium text-gray-800">Filter Properties</h2>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {isExpanded ? 'Simple View' : 'Advanced Filters'}
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="flatType" className="block text-sm font-medium text-gray-700 mb-1">
            Flat Type
          </label>
          <select
            id="flatType"
            value={filters.flatType}
            onChange={(e) => onFiltersChange({ ...filters, flatType: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {FLAT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        
        {isExpanded && (
          <>
            <div>
              <label htmlFor="minLeaseYears" className="block text-sm font-medium text-gray-700 mb-1">
                Min Lease Years Remaining
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  id="minLeaseYears"
                  min="0"
                  max="99"
                  value={filters.minLeaseYears}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    onFiltersChange({
                      ...filters,
                      minLeaseYears: value > filters.maxLeaseYears ? filters.maxLeaseYears : value
                    });
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="w-8 text-center text-sm font-medium">{filters.minLeaseYears}</span>
              </div>
            </div>
            
            <div>
              <label htmlFor="maxLeaseYears" className="block text-sm font-medium text-gray-700 mb-1">
                Max Lease Years Remaining
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  id="maxLeaseYears"
                  min="0"
                  max="99"
                  value={filters.maxLeaseYears}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    onFiltersChange({
                      ...filters,
                      maxLeaseYears: value < filters.minLeaseYears ? filters.minLeaseYears : value
                    });
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="w-8 text-center text-sm font-medium">{filters.maxLeaseYears}</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {isExpanded && (
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;