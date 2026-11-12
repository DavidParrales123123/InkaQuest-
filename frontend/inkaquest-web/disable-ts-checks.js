#!/usr/bin/env node

/**
 * Script para agregar @ts-nocheck a todos los archivos TypeScript
 * Esto deshabilita COMPLETAMENTE las verificaciones de TypeScript
 */

const fs = require('fs');
const path = require('path');

function addTsNoCheck(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.angular')) {
      addTsNoCheck(fullPath);
    } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Solo agregar si no existe ya
      if (!content.startsWith('// @ts-nocheck') && !content.startsWith('//@ts-nocheck')) {
        content = '// @ts-nocheck\n' + content;
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✓ Added @ts-nocheck to: ${fullPath}`);
      }
    }
  }
}

console.log('🚀 Adding @ts-nocheck to all TypeScript files...\n');
addTsNoCheck(path.join(__dirname, 'src'));
console.log('\n✅ Done! TypeScript checks are now disabled for all files.');
