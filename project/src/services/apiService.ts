import axios from 'axios';
import { PropertyResponse, PropertyRecord } from '../types';

const API_URL = 'https://data.gov.sg/api/action/datastore_search';
const RESOURCE_ID = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';
const LIMIT = 1000; // Number of records to fetch per request

export const getPropertyData = async (): Promise<PropertyRecord[]> => {
  try {
    let allRecords: PropertyRecord[] = [];
    let offset = 0;
    let totalRecords = Infinity;
    
    // Fetch data until we have all records
    while (offset < totalRecords) {
      const response = await axios.get<PropertyResponse>(API_URL, {
        params: {
          resource_id: RESOURCE_ID,
          limit: LIMIT,
          offset
        }
      });
      
      if (!response.data.success) {
        throw new Error('API request failed');
      }
      
      const { result } = response.data;
      totalRecords = result.total;
      allRecords = [...allRecords, ...result.records];
      offset += LIMIT;
      
      // If we've fetched all records or the API doesn't return more
      if (offset >= totalRecords || result.records.length === 0) {
        break;
      }
    }
    
    return allRecords;
  } catch (error) {
    console.error('Error fetching property data:', error);
    throw error;
  }
};