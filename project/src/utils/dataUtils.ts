import { PropertyRecord, ProcessedPropertyData } from '../types';

export const processPropertyData = (records: PropertyRecord[]): ProcessedPropertyData => {
  const towns: { [key: string]: any } = {};
  const flatTypes = new Set<string>();
  let minLeaseYears = 100;
  let maxLeaseYears = 0;
  
  // Process each record
  records.forEach(record => {
    const townName = record.town;
    const flatType = record.flat_type;
    
    // Parse lease years
    const leaseYearsMatch = record.remaining_lease.match(/(\d+)\s+years/);
    const leaseYears = leaseYearsMatch ? parseInt(leaseYearsMatch[1]) : 0;
    
    // Track min and max lease years
    minLeaseYears = Math.min(minLeaseYears, leaseYears);
    maxLeaseYears = Math.max(maxLeaseYears, leaseYears);
    
    // Add flat type to set
    flatTypes.add(flatType);
    
    // Initialize town data if it doesn't exist
    if (!towns[townName]) {
      towns[townName] = {
        averagePrice: 0,
        listingsCount: 0,
        listings: []
      };
    }
    
    // Add listing to town
    towns[townName].listings.push(record);
    
    // Update average price and count
    const price = parseInt(record.resale_price);
    const currentTotal = towns[townName].averagePrice * towns[townName].listingsCount;
    towns[townName].listingsCount++;
    towns[townName].averagePrice = (currentTotal + price) / towns[townName].listingsCount;
  });
  
  return {
    towns,
    flatTypes: Array.from(flatTypes),
    minLeaseYears,
    maxLeaseYears
  };
};

export const getTownColor = (averagePrice: number, colorScale: Function): string => {
  if (!averagePrice || isNaN(averagePrice)) {
    return '#d1d5db'; // Gray for no data
  }
  
  return colorScale(averagePrice);
};

export const extractLeaseYears = (remainingLease: string): number => {
  const match = remainingLease.match(/(\d+)\s+years/);
  return match ? parseInt(match[1]) : 0;
};