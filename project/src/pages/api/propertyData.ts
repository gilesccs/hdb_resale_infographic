import { NextApiRequest, NextApiResponse } from 'next';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🚀 API Route: /api/propertyData called');
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if cache exists and is valid
    const cache = readCache();
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      console.log('✅ Serving from cache');
      return res.status(200).json(cache.data);
    }

    // Fetch fresh data
    console.log('🔄 Cache expired or not found, fetching fresh data...');
    const data = await getPropertyData();
    
    if (!data) {
      throw new Error('No data received from getPropertyData');
    }

    // Update cache
    writeCache(data);
    console.log('✅ Fresh data fetched and cached');

    return res.status(200).json(data);
  } catch (error) {
    console.error('❌ Error in propertyData API:', error);
    // Log the full error details
    if (error instanceof Error) {
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return res.status(500).json({ 
      error: 'Failed to fetch property data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 