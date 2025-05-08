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

  const handleMinStoreyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMinStoreyInput(val);
    if (/^\d+$/.test(val) && Number(val) >= 1 && Number(val) <= filters.maxStorey) {
      onFiltersChange({ ...filters, minStorey: Number(val) });
    }
  };
  const handleMinStoreyBlur = () => {
    if (!/^\d+$/.test(minStoreyInput) || Number(minStoreyInput) < 1) {
      setMinStoreyInput(filters.minStorey.toString());
    }
  };
  const handleMaxStoreyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMaxStoreyInput(val);
    if (/^\d+$/.test(val) && Number(val) >= filters.minStorey && Number(val) <= 50) {
      onFiltersChange({ ...filters, maxStorey: Number(val) });
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
      className="w-full rounded-xl shadow-lg border border-border bg-white/60 backdrop-blur-md px-4 py-2 flex flex-col md:flex-row md:items-center md:gap-6 gap-2 transition-all"
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.85) 60%, rgba(230,244,255,0.7) 100%)',
        boxShadow: '0 4px 24px 0 rgba(36, 100, 170, 0.07)',
      }}
    >
      <div className="flex items-center gap-2 min-w-fit">
        <Filter className="h-5 w-5 text-primary" />
        <span className="font-medium text-foreground text-base">Filter Properties</span>
      </div>
      <div className="flex items-center gap-2 min-w-fit">
        <Label htmlFor="flatType" className="text-sm font-medium">Flat Type</Label>
        <Select
          value={filters.flatType}
          onValueChange={(value) => onFiltersChange({ ...filters, flatType: value })}
        >
          <SelectTrigger id="flatType" className="w-36 h-9 text-sm" >
            <SelectValue placeholder="Select flat type" />
          </SelectTrigger>
          <SelectContent>
            {FLAT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isExpanded && (
        <>
          <div className="flex items-center gap-2 min-w-fit">
            <Label htmlFor="minLeaseYears" className="text-sm font-medium whitespace-nowrap">Min Lease</Label>
            <Slider
              id="minLeaseYears"
              min={0}
              max={99}
              value={[filters.minLeaseYears]}
              onValueChange={([value]) => {
                onFiltersChange({
                  ...filters,
                  minLeaseYears: value > filters.maxLeaseYears ? filters.maxLeaseYears : value
                });
              }}
              className="w-28"
            />
            <span className="w-8 text-center text-xs font-medium">{filters.minLeaseYears}</span>
          </div>
          <div className="flex items-center gap-2 min-w-fit">
            <Label htmlFor="maxLeaseYears" className="text-sm font-medium whitespace-nowrap">Max Lease</Label>
            <Slider
              id="maxLeaseYears"
              min={0}
              max={99}
              value={[filters.maxLeaseYears]}
              onValueChange={([value]) => {
                onFiltersChange({
                  ...filters,
                  maxLeaseYears: value < filters.minLeaseYears ? filters.minLeaseYears : value
                });
              }}
              className="w-28"
            />
            <span className="w-8 text-center text-xs font-medium">{filters.maxLeaseYears}</span>
          </div>
          <div className="flex items-center gap-2 min-w-fit">
            <Label htmlFor="floorAreaRange" className="text-sm font-medium whitespace-nowrap">Floor Area</Label>
            <Select
              value={filters.floorAreaRange}
              onValueChange={value => onFiltersChange({ ...filters, floorAreaRange: value })}
            >
              <SelectTrigger id="floorAreaRange" className="w-40 h-9 text-sm">
                <SelectValue placeholder="Select floor area" />
              </SelectTrigger>
              <SelectContent>
                {FLOOR_AREA_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 min-w-fit">
            <Label htmlFor="minStorey" className="text-sm font-medium whitespace-nowrap">Min Storey</Label>
            <input
              type="number"
              id="minStorey"
              min={1}
              max={filters.maxStorey}
              value={minStoreyInput}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={handleMinStoreyChange}
              onBlur={handleMinStoreyBlur}
              className="w-12 px-2 py-1 rounded border border-border bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <Label htmlFor="maxStorey" className="text-sm font-medium whitespace-nowrap">Max Storey</Label>
            <input
              type="number"
              id="maxStorey"
              min={filters.minStorey}
              max={50}
              value={maxStoreyInput}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={handleMaxStoreyChange}
              onBlur={handleMaxStoreyBlur}
              className="w-12 px-2 py-1 rounded border border-border bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-2 min-w-fit">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs px-3 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors border border-transparent"
        >
          {isExpanded ? 'Simple View' : 'Advanced Filters'}
        </button>
        {isExpanded && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;