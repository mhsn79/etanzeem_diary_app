#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need default exports to prevent Expo Router warnings
const filesToFix = [
  'app/utils/apiNormalizer.ts',
  'app/utils/apiNormalizers.ts',
  'app/utils/useAuthErrorHandler.ts',
  'app/constants/api.ts',
  'app/constants/images.ts',
  'app/constants/navigation.ts',
  'app/constants/screens.ts',
  'app/constants/theme.ts',
  'app/constants/urduLocalization.ts',
  'app/features/qa/index.ts',
  'app/features/qa/types.ts',
  'app/features/qa/utils.ts',
  'app/models/Person.ts',
  'app/models/RukunData.ts',
  'app/models/TanzeemiUnit.ts',
  'app/screens/(tabs)/components/index.ts',
  'app/screens/(tabs)/components/types.ts',
  'app/services/expoPush.ts',
  'app/services/navigation.ts',
  'app/services/secureStorage.ts',
  'app/store/index.ts',
  'app/store/mmkvStorage.ts'
];

function addDefaultExport(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file already has a default export
    if (content.includes('export default')) {
      console.log(`File already has default export: ${filePath}`);
      return;
    }

    // Get all named exports
    const namedExports = [];
    const exportMatches = content.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g);
    
    if (exportMatches) {
      exportMatches.forEach(match => {
        const nameMatch = match.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/);
        if (nameMatch) {
          namedExports.push(nameMatch[1]);
        }
      });
    }

    // Add default export
    const defaultExport = `
// Default export to prevent Expo Router from treating this as a route
export default {
  ${namedExports.join(',\n  ')}
};`;

    fs.appendFileSync(filePath, defaultExport);
    console.log(`Added default export to: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Process all files
console.log('Adding default exports to prevent Expo Router warnings...');
filesToFix.forEach(addDefaultExport);
console.log('Done!'); 