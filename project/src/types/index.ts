// API Response Types
export interface PropertyResponse {
  success: boolean;
  result: {
    resource_id: string;
    fields: Array<{
      type: string;
      id: string;
    }>;
    records: PropertyRecord[];
    total: number;
  };
}

export interface PropertyRecord {
  _id: number;
  month: string;
  town: string;
  flat_type: string;
  block: string;
  street_name: string;
  storey_range: string;
  floor_area_sqm: string;
  flat_model: string;
  lease_commence_date: string;
  remaining_lease: string;
  resale_price: string;
}

// Processed Data Types
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

// Filter Types
export interface PropertyFilters {
  flatType: string;
  minLeaseYears: number;
  maxLeaseYears: number;
  floorAreaRange: string;
  minStorey: number;
  maxStorey: number;
}