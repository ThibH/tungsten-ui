// Lucide loader
let lucideData = null;

// Fonction pour charger les données lucide si pas déjà fait
async function loadLucide() {
    if (!lucideData) {
        try {
            // Essayer plusieurs chemins possibles
            let response;
            const paths = [
                '/static/tungsten_ui/js/lucide.json',
                './static/tungsten_ui/js/lucide.json',
                '../static/tungsten_ui/js/lucide.json'
            ];
            
            for (const path of paths) {
                try {
                    response = await fetch(path);
                    if (response.ok) break;
                } catch (e) {
                    continue;
                }
            }
            
            if (!response || !response.ok) {
                throw new Error('Impossible de charger lucide.json');
            }
            
            lucideData = await response.json();
            console.log('Lucide chargé:', Object.keys(lucideData).length, 'icônes');
        } catch (error) {
            console.error('Erreur lors du chargement de lucide:', error);
            lucideData = {};
        }
    }
    return lucideData;
}

// Fonction pour obtenir un SVG lucide
window.getLucideIcon = async function(name) {
    const icons = await loadLucide();
    
    if (icons[name]) {
        return icons[name];
    }
    
    console.warn(`Icône Lucide "${name}" non trouvée`);
    return null;
};

// Fonction pour initialiser toutes les icônes lucide dans la page
window.initLucideIcons = async function() {
    console.log('Initialisation des icônes Lucide...');
    const lucideIcons = document.querySelectorAll('[data-lucide]');
    console.log('Trouvé', lucideIcons.length, 'éléments avec data-lucide');
    
    for (const element of lucideIcons) {
        const name = element.getAttribute('data-lucide');
        
        console.log(`Chargement icône: ${name}`);
        const svg = await getLucideIcon(name);
        if (svg) {
            // Créer un élément SVG temporaire pour le parser
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = svg;
            const svgElement = tempDiv.querySelector('svg');
            
            if (svgElement) {
                // Copier les classes CSS du conteneur vers le SVG
                const containerClasses = element.getAttribute('class');
                if (containerClasses) {
                    svgElement.setAttribute('class', containerClasses);
                }
                
                // Remplacer le contenu du conteneur par le SVG
                element.innerHTML = '';
                element.appendChild(svgElement);
                console.log(`Icône ${name} injectée avec succès`);
            }
        } else {
            console.warn(`Impossible de charger l'icône ${name}`);
        }
    }
};

// Auto-initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', initLucideIcons);

// Re-initialisation après les swaps HTMX
document.addEventListener('htmx:afterSwap', initLucideIcons);