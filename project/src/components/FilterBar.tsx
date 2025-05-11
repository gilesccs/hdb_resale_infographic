import React, { useState } from 'react';
import { Filter, RefreshCcw } from 'lucide-react';
import { PropertyFilters } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Slider } from './ui/slider';
import { Label } from './ui/label';

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

const FLOOR_AREA_OPTIONS = [
  { label: 'Any', value: 'ANY' },
  { label: 'Below 60 m²', value: 'BELOW_60' },
  { label: '60-79 m²', value: '60_79' },
  { label: '80-99 m²', value: '80_99' },
  { label: '100-119 m²', value: '100_119' },
  { label: '120 m² and above', value: '120_PLUS' },
];

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [minStoreyInput, setMinStoreyInput] = useState(filters.minStorey.toString());
  const [maxStoreyInput, setMaxStoreyInput] = useState(filters.maxStorey.toString());

  React.useEffect(() => {
    setMinStoreyInput(filters.minStorey.toString());
    setMaxStoreyInput(filters.maxStorey.toString());
  }, [filters.minStorey, filters.maxStorey]);

  // Storey input handlers: allow empty string, remove leading zeros, only update filter when valid
  const handleMinStoreyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/^0+(?!$)/, ''); // Remove leading zeros
    if (val === '' || /^\d+$/.test(val)) {
      setMinStoreyInput(val);
      if (val !== '' && Number(val) >= 1 && Number(val) <= filters.maxStorey) {
        onFiltersChange({ ...filters, minStorey: Number(val) });
      }
    }
  };
  const handleMinStoreyBlur = () => {
    if (!/^\d+$/.test(minStoreyInput) || Number(minStoreyInput) < 1) {
      setMinStoreyInput(filters.minStorey.toString());
    }
  };
  const handleMaxStoreyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/^0+(?!$)/, ''); // Remove leading zeros
    if (val === '' || /^\d+$/.test(val)) {
      setMaxStoreyInput(val);
      if (val !== '' && Number(val) >= filters.minStorey && Number(val) <= 50) {
        onFiltersChange({ ...filters, maxStorey: Number(val) });
      }
    }
  };
  const handleMaxStoreyBlur = () => {
    if (!/^\d+$/.test(maxStoreyInput) || Number(maxStoreyInput) > 50) {
      setMaxStoreyInput(filters.maxStorey.toString());
    }
  };

  const resetFilters = () => {
    onFiltersChange({
      flatType: 'ALL',
      minLeaseYears: 0,
      maxLeaseYears: 99,
      floorAreaRange: 'ANY',
      minStorey: 1,
      maxStorey: 50,
    });
  };

  return (
    <div
      className="flex overflow-x-auto flex-nowrap sm:flex-row gap-1 sm:gap-4 items-center bg-white/70 backdrop-blur-md rounded-2xl border border-border px-2 sm:px-4 py-1 sm:py-2 shadow-md w-full"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="flex items-center gap-1 mb-1 sm:mb-0 min-w-[120px] flex-shrink-0">
        <Filter className="h-4 w-4 text-blue-500" />
        <span className="font-semibold text-xs sm:text-base">Filter Properties</span>
      </div>
      <div className="flex flex-nowrap gap-1 sm:gap-2 flex-1 min-w-[200px] items-center">
        {/* Flat Type - always shown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 min-w-[100px] flex-shrink-0">
          <Label className="text-xs">Flat Type</Label>
          <Select value={filters.flatType} onValueChange={v => onFiltersChange({ ...filters, flatType: v })}>
            <SelectTrigger className="w-full sm:w-[100px] h-7 sm:h-8 text-xs">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {FLAT_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Advanced filters: only show when isExpanded is true */}
        {isExpanded && <>
          {/* Min Lease */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 min-w-[100px] flex-shrink-0">
            <Label className="text-xs">Min Lease</Label>
            <Slider
              min={0}
              max={99}
              value={[filters.minLeaseYears]}
              onValueChange={([v]) => onFiltersChange({ ...filters, minLeaseYears: v })}
              className="w-[70px] sm:w-[120px]"
            />
            <span className="text-xs w-6 text-center">{filters.minLeaseYears}</span>
          </div>
          {/* Max Lease */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 min-w-[100px] flex-shrink-0">
            <Label className="text-xs">Max Lease</Label>
            <Slider
              min={0}
              max={99}
              value={[filters.maxLeaseYears]}
              onValueChange={([v]) => onFiltersChange({ ...filters, maxLeaseYears: v })}
              className="w-[70px] sm:w-[120px]"
            />
            <span className="text-xs w-6 text-center">{filters.maxLeaseYears}</span>
          </div>
          {/* Floor Area */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 min-w-[100px] flex-shrink-0">
            <Label className="text-xs">Floor Area</Label>
            <Select value={filters.floorAreaRange} onValueChange={v => onFiltersChange({ ...filters, floorAreaRange: v })}>
              <SelectTrigger className="w-full sm:w-[100px] h-7 sm:h-8 text-xs">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {FLOOR_AREA_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Min Storey */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 min-w-[70px] flex-shrink-0">
            <Label className="text-xs">Min Storey</Label>
            <input
              type="number"
              min={1}
              max={50}
              value={minStoreyInput}
              onChange={handleMinStoreyChange}
              onBlur={handleMinStoreyBlur}
              className="w-10 sm:w-16 h-7 sm:h-8 rounded border border-gray-200 px-2 text-xs"
            />
          </div>
          {/* Max Storey */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 min-w-[70px] flex-shrink-0">
            <Label className="text-xs">Max Storey</Label>
            <input
              type="number"
              min={1}
              max={50}
              value={maxStoreyInput}
              onChange={handleMaxStoreyChange}
              onBlur={handleMaxStoreyBlur}
              className="w-10 sm:w-16 h-7 sm:h-8 rounded border border-gray-200 px-2 text-xs"
            />
          </div>
        </>}
      </div>
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="ml-auto mt-1 sm:mt-0 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs sm:text-sm font-semibold hover:bg-blue-200 transition flex-shrink-0"
      >
        {isExpanded ? 'Simple View' : 'Advanced Filters'}
      </button>
      {/* Reset button: only when expanded */}
      {isExpanded && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border transition-colors flex-shrink-0"
        >
          <RefreshCcw className="h-3 w-3 sm:h-4 sm:w-4" />
          Reset
        </button>
      )}
    </div>
  );
};

export default FilterBar;