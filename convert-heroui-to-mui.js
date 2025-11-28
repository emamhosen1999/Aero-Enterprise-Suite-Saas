#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Configuration for component mappings
const COMPONENT_MAPPINGS = {
  // Input components
  'Input': {
    muiComponent: 'TextField',
    muiImport: 'TextField',
    additionalImports: ['InputAdornment'],
    propMappings: {
      'onValueChange': 'onChange',
      'startContent': 'InputProps.startAdornment',
      'endContent': 'InputProps.endAdornment',
      'isInvalid': 'error',
      'errorMessage': 'helperText',
      'isDisabled': 'disabled',
      'isRequired': 'required',
      'isClearable': null, // Remove this prop
      'variant': null, // Remove this prop (handled in sx)
      'classNames': null, // Remove this prop (handled in sx)
    }
  },
  
  // Select components
  'Select': {
    muiComponent: 'Select',
    muiImport: 'Select',
    additionalImports: ['MenuItem', 'FormControl', 'InputLabel'],
    propMappings: {
      'selectedKeys': 'value',
      'onSelectionChange': 'onChange',
      'isDisabled': 'disabled',
      'isRequired': 'required',
      'variant': null,
      'classNames': null,
    }
  },
  
  // Dropdown components
  'Dropdown': {
    muiComponent: 'Menu',
    muiImport: 'Menu',
    additionalImports: ['MenuItem', 'IconButton'],
    propMappings: {
      'isOpen': 'open',
      'onOpenChange': 'onClose',
    }
  },
  
  'DropdownTrigger': {
    muiComponent: 'IconButton',
    muiImport: 'IconButton',
    additionalImports: [],
    propMappings: {}
  },
  
  'DropdownMenu': {
    muiComponent: 'MenuList',
    muiImport: 'MenuList',
    additionalImports: [],
    propMappings: {}
  },
  
  'DropdownItem': {
    muiComponent: 'MenuItem',
    muiImport: 'MenuItem',
    additionalImports: [],
    propMappings: {}
  },
  
  'SelectItem': {
    muiComponent: 'MenuItem',
    muiImport: 'MenuItem',
    additionalImports: [],
    propMappings: {}
  }
};

// Find all JSX files
async function findJSXFiles() {
  const patterns = [
    'resources/js/**/*.jsx',
    'resources/js/**/*.js'
  ];
  
  let files = [];
  for (const pattern of patterns) {
    const foundFiles = await glob(pattern, { cwd: process.cwd() });
    files = files.concat(foundFiles);
  }
  
  return files.filter(file => !file.includes('node_modules'));
}

// Analyze a file for HeroUI components
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const results = {
    file: filePath,
    hasHeroUIComponents: false,
    components: {},
    imports: {
      heroui: [],
      mui: []
    }
  };
  
  // Check for HeroUI imports
  const heroUIImportRegex = /import\s*{([^}]+)}\s*from\s*['"]@heroui\/react['"];?/g;
  let match;
  while ((match = heroUIImportRegex.exec(content)) !== null) {
    const imports = match[1].split(',').map(imp => imp.trim());
    results.imports.heroui = results.imports.heroui.concat(imports);
    results.hasHeroUIComponents = true;
  }
  
  // Check for Material UI imports
  const muiImportRegex = /import\s*{([^}]+)}\s*from\s*['"]@mui\/material['"];?/g;
  while ((match = muiImportRegex.exec(content)) !== null) {
    const imports = match[1].split(',').map(imp => imp.trim());
    results.imports.mui = results.imports.mui.concat(imports);
  }
  
  // Count component usage
  Object.keys(COMPONENT_MAPPINGS).forEach(component => {
    const componentRegex = new RegExp(`<${component}[\\s>]`, 'g');
    const matches = content.match(componentRegex);
    if (matches) {
      results.components[component] = matches.length;
      results.hasHeroUIComponents = true;
    }
  });
  
  return results;
}

// Generate conversion report
async function generateReport() {
  console.log('🔍 Scanning for HeroUI components...\n');
  
  const files = await findJSXFiles();
  const results = files.map(analyzeFile).filter(result => result.hasHeroUIComponents);
  
  if (results.length === 0) {
    console.log('✅ No HeroUI components found! All conversions are complete.\n');
    return;
  }
  
  console.log(`📊 Found HeroUI components in ${results.length} files:\n`);
  
  let totalComponents = 0;
  const componentCounts = {};
  
  results.forEach(result => {
    console.log(`📄 ${result.file}`);
    
    // Show HeroUI imports
    if (result.imports.heroui.length > 0) {
      console.log(`   📥 HeroUI imports: ${result.imports.heroui.join(', ')}`);
    }
    
    // Show components found
    Object.entries(result.components).forEach(([component, count]) => {
      console.log(`   🔸 ${component}: ${count} instances`);
      totalComponents += count;
      componentCounts[component] = (componentCounts[component] || 0) + count;
    });
    
    console.log('');
  });
  
  console.log('📈 SUMMARY:');
  console.log(`   Total files with HeroUI components: ${results.length}`);
  console.log(`   Total component instances: ${totalComponents}`);
  console.log('');
  
  console.log('🔢 Component breakdown:');
  Object.entries(componentCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([component, count]) => {
      console.log(`   ${component}: ${count} instances`);
    });
  
  console.log('\n💡 Conversion recommendations:');
  Object.keys(componentCounts).forEach(component => {
    const mapping = COMPONENT_MAPPINGS[component];
    if (mapping) {
      console.log(`   ${component} → ${mapping.muiComponent}`);
    }
  });
  
  console.log('\n📝 Files that need conversion:');
  results.forEach(result => {
    console.log(`   - ${result.file}`);
  });
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await generateReport();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

export {
  findJSXFiles,
  analyzeFile,
  generateReport,
  COMPONENT_MAPPINGS
};
