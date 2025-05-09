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
    
    console.log('🚀 Starting to fetch property data from data.gov.sg...');
    
    // Fetch data until we have all records
    while (offset < totalRecords) {
      console.log(`📥 Fetching records ${offset} to ${offset + LIMIT}...`);
      
      const response = await axios.get<PropertyResponse>(API_URL, {
        params: {
          resource_id: RESOURCE_ID,
          limit: LIMIT,
          offset
        }
      });
      
      // Log the response status and headers
      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', response.headers);
      
      // Debug log the response structure
      console.log('📊 Response structure:', {
        hasData: !!response.data,
        success: response.data?.success,
        hasResult: !!response.data?.result,
        resultKeys: response.data?.result ? Object.keys(response.data.result) : [],
        recordsType: response.data?.result?.records ? typeof response.data.result.records : 'no records',
        isRecordsArray: Array.isArray(response.data?.result?.records),
        recordsLength: Array.isArray(response.data?.result?.records) ? response.data.result.records.length : 'not an array'
      });
      
      if (!response.data.success) {
        console.error('❌ API response:', response.data);
        throw new Error('API request failed: ' + JSON.stringify(response.data));
      }
      
      const { result } = response.data;
      totalRecords = result.total;
      
      if (!Array.isArray(result.records)) {
        console.error('❌ Records is not an array:', result.records);
        throw new Error('Invalid response format: records is not an array');
      }
      
      allRecords = [...allRecords, ...result.records];
      offset += LIMIT;
      
      console.log(`✅ Fetched ${result.records.length} records. Total so far: ${allRecords.length}`);
      
      // If we've fetched all records or the API doesn't return more
      if (offset >= totalRecords || result.records.length === 0) {
        break;
      }
    }
    
    console.log(`🎉 Finished fetching data. Total records: ${allRecords.length}`);
    return allRecords;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw new Error(`API request failed: ${error.response?.status} ${error.response?.statusText}`);
    }
    console.error('❌ Error fetching property data:', error);
    throw error;
  }
};