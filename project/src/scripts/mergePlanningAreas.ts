import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { mergeSubzonesToPlanningAreas } from '../utils/mergeSubzones.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the subzone GeoJSON data
const subzoneDataPath = path.join(__dirname, '../data/singaporePlanningAreas.json');
const subzoneData = JSON.parse(fs.readFileSync(subzoneDataPath, 'utf-8'));

// Merge subzones into planning areas
const mergedData = mergeSubzonesToPlanningAreas(subzoneData);

// Save the merged data
const outputPath = path.join(__dirname, '../data/mergedPlanningAreas.json');
fs.writeFileSync(outputPath, JSON.stringify(mergedData, null, 2));

console.log('Successfully merged subzones into planning areas');
console.log(`Output saved to: ${outputPath}`); 