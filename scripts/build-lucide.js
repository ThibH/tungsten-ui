#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Attributs par défaut pour les icônes Lucide
// Note: width et height sont omis pour permettre le sizing CSS
const defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};

const lucideIcons = {};

// Fonction pour convertir les données d'icône en SVG
function createSVG(iconData) {
  let svgContent = '';
  
  // Construire les attributs SVG
  const attrs = Object.entries(defaultAttributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  
  // Construire le contenu des paths/elements
  for (const element of iconData) {
    const [tagName, attributes = {}] = element;
    
    if (typeof attributes === 'object' && attributes !== null) {
      const elemAttrs = Object.entries(attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      svgContent += `<${tagName} ${elemAttrs}/>\n  `;
    } else {
      svgContent += `<${tagName}/>\n  `;
    }
  }
  
  return `<svg ${attrs}>\n  ${svgContent}</svg>`;
}

// Parcourir tous les fichiers d'icônes Lucide
const iconsDir = path.join(__dirname, '../node_modules/lucide/dist/esm/icons');

if (!fs.existsSync(iconsDir)) {
  console.error('❌ Dossier Lucide non trouvé:', iconsDir);
  process.exit(1);
}

const iconFiles = fs.readdirSync(iconsDir)
  .filter(file => file.endsWith('.js') && !file.endsWith('.map'));

console.log(`🔍 Trouvé ${iconFiles.length} fichiers d'icônes Lucide`);

for (const file of iconFiles) {
  try {
    const iconName = file.replace('.js', '');
    const filePath = path.join(iconsDir, file);
    
    // Lire et évaluer le fichier JavaScript
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Extraire les données de l'icône avec une regex
    const match = fileContent.match(/const\s+\w+\s*=\s*(\[[\s\S]*?\]);/);
    if (match) {
      try {
        // Évaluer les données de l'icône de façon sécurisée
        const iconData = eval(match[1]);
        const svgString = createSVG(iconData);
        
        lucideIcons[iconName] = svgString;
      } catch (evalError) {
        console.warn(`⚠️  Erreur d'évaluation pour ${iconName}:`, evalError.message);
      }
    }
    
  } catch (error) {
    console.warn(`⚠️  Erreur lors du traitement de ${file}:`, error.message);
  }
}

// Écrire le fichier JSON
const outputPath = path.join(__dirname, '../tungsten_ui/static/tungsten_ui/js/lucide.json');
fs.writeFileSync(outputPath, JSON.stringify(lucideIcons, null, 2));

console.log(`✅ Lucide JSON généré avec ${Object.keys(lucideIcons).length} icônes`);
console.log(`Fichier créé: ${outputPath}`);

// Afficher quelques exemples
const iconNames = Object.keys(lucideIcons);
console.log('\n📋 Exemples d\'icônes disponibles:');
iconNames.slice(0, 10).forEach(name => console.log(`  • ${name}`));
if (iconNames.length > 10) {
  console.log(`  ... et ${iconNames.length - 10} autres`);
}