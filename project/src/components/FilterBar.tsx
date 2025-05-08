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