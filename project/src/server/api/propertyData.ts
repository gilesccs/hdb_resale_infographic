import { getPropertyData } from '../../services/apiService';
import fs from 'fs';
import path from 'path';

// Create data directory if it doesn't exist
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  console.log('📁 Creating data directory...');
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CACHE_FILE = path.join(DATA_DIR, 'propertyDataCache.json');
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface CacheData {
  data: any;
  timestamp: number;
}

function readCache(): CacheData | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      console.log('📖 Cache file exists, reading...');
      const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
      const cache = JSON.parse(cacheContent);
      console.log('✅ Cache read successfully');
      return cache;
    } else {
      console.log('❌ No cache file found');
    }
  } catch (error) {
    console.error('❌ Error reading cache:', error);
  }
  return null;
}

function writeCache(data: any) {
  try {
    console.log('📝 Writing to cache file...');
    const cacheData: CacheData = {
      data,
      timestamp: Date.now()
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData));
    console.log('✅ Cache written successfully');
  } catch (error) {
    console.error('❌ Error writing cache:', error);
  }
}

export async function handlePropertyDataRequest() {
  console.log('🚀 API Route: /api/propertyData called');
  
  try {
    // Check if cache exists and is valid
    const cache = readCache();
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      console.log('✅ Serving from cache');
      return { data: cache.data };
    }

    // Fetch fresh data
    console.log('🔄 Cache expired or not found, fetching fresh data...');
    const data = await getPropertyData();
    
    if (!data) {
      throw new Error('No data received from getPropertyData');
    }

    // Debug log the data structure
    console.log('📊 Data structure:', {
      isArray: Array.isArray(data),
      type: typeof data,
      length: Array.isArray(data) ? data.length : 'not an array',
      firstItem: Array.isArray(data) ? data[0] : 'not an array'
    });

    // Update cache
    writeCache(data);
    console.log('✅ Fresh data fetched and cached');

    return { data };
  } catch (error) {
    console.error('❌ Error in propertyData API:', error);
    // Log the full error details
    if (error instanceof Error) {
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
} 