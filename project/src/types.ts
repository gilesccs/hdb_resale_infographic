export interface PropertyRecord {
  town: string;
  flat_type: string;
  remaining_lease: string;
  resale_price: string;
  floor_area_sqm: string;
  storey_range: string;
}

export interface PropertyFilters {
  flatType: string;
  minLeaseYears: number;
  maxLeaseYears: number;
  floorAreaRange: string;
  minStorey: number;
  maxStorey: number;
}

export interface TownData {
  averagePrice: number;
  listingsCount: number;
  listings: PropertyRecord[];
}

export interface ProcessedPropertyData {
  towns: {
    [townName: string]: TownData;
  };
  flatTypes: string[];
  minLeaseYears: number;
  maxLeaseYears: number;
}

export interface FilterBarProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
} 