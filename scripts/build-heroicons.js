#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mapping des dossiers vers les noms de variants
const variants = {
  '24/outline': 'outline',
  '24/solid': 'solid', 
  '20/solid': 'micro',
  '16/solid': 'mini'
};

const heroicons = {};

// Fonction pour lire un fichier SVG et nettoyer son contenu
function readSvgFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Retourner le contenu SVG complet
  return content.trim();
}

// Parcourir chaque variant
Object.entries(variants).forEach(([folder, variantName]) => {
  const folderPath = path.join(__dirname, '../node_modules/heroicons', folder);
  
  if (fs.existsSync(folderPath)) {
    const files = fs.readdirSync(folderPath);
    
    files.forEach(file => {
      if (file.endsWith('.svg')) {
        const iconName = file.replace('.svg', '');
        const svgContent = readSvgFile(path.join(folderPath, file));
        
        // Initialiser l'icône si elle n'existe pas
        if (!heroicons[iconName]) {
          heroicons[iconName] = {};
        }
        
        // Ajouter le variant
        heroicons[iconName][variantName] = svgContent;
      }
    });
  }
});

// Écrire le fichier JSON dans le dossier static
const outputPath = path.join(__dirname, '../tungsten_ui/static/tungsten_ui/js/heroicons.json');
fs.writeFileSync(outputPath, JSON.stringify(heroicons, null, 2));

console.log(`✅ Heroicons JSON généré avec ${Object.keys(heroicons).length} icônes`);
console.log(`Fichier créé: ${outputPath}`);