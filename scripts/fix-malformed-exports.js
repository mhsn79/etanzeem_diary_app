#!/usr/bin/env node

const fs = require('fs');

// Files that need to be fixed (remove malformed default exports)
const filesToFix = [
  'app/screens/(tabs)/components/index.ts',
  'app/screens/(tabs)/components/types.ts',
  'app/services/expoPush.ts',
  'app/services/navigation.ts',
  'app/services/secureStorage.ts',
  'app/store/mmkvStorage.ts'
];

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Remove the malformed default export that was added
    const lines = content.split('\n');
    const newLines = [];
    let skipNextLines = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip the malformed default export section
      if (line.includes('// Default export to prevent Expo Router from treating this as a route')) {
        skipNextLines = 3; // Skip the comment and the export default block
        continue;
      }
      
      if (skipNextLines > 0) {
        skipNextLines--;
        continue;
      }
      
      newLines.push(line);
    }
    
    // Write the fixed content back
    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Process all files
console.log('Fixing malformed default exports...');
filesToFix.forEach(fixFile);
console.log('Done!'); 