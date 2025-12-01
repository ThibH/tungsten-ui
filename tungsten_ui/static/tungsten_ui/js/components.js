// Django Components UI - Core JavaScript functionality

// Global command palette functionality
// Handles keyboard shortcuts and initialization
window.initGlobalCommandPalette = function(groups) {
    window.globalCommandPaletteGroups = groups;
};

// Global keyboard shortcuts for command palette
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+K or Cmd+K to open command palette
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const modal = document.getElementById('global_command_palette');
            if (modal) {
                modal.showModal();
            }
        }
        
        // Specific shortcuts (actions are now in data via onSelect)
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'h':
                    e.preventDefault();
                    window.location.href = "/";
                    break;
                case 'd':
                    e.preventDefault();
                    window.location.href = "/docs/";
                    break;
            }
        }
    });
});

// Theme controller setup after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupThemeControllers();
});

// Simple utility to change theme
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}


document.addEventListener('alpine:init', () => {
    Alpine.store('toaster', {
        notifications: [],
        add(e) {
            this.notifications.push({
                id: Date.now(),
                type: e.type || 'info',
                content: e.content,
            })
        },
        remove(notification) {
            this.notifications = this.notifications.filter(i => i.id !== notification.id)
        }
    });

    // Smart Navbar with scroll detection
    Alpine.data('smartNavbar', () => ({
        hasScrolled: false,
        isHidden: false,
        isInitialized: false,
        lastScrollY: 0,
        scrollThreshold: 50,

        init() {
            // Initialize state IMMEDIATELY based on current position
            const currentScrollY = window.scrollY;
            this.hasScrolled = currentScrollY > this.scrollThreshold;
            this.isHidden = currentScrollY > 200; // Hide if already scrolled down on refresh
            this.lastScrollY = currentScrollY;
            
            // Enable transitions after a short delay
            setTimeout(() => {
                this.isInitialized = true;
            }, 50);
            
            this.handleScroll = this.handleScroll.bind(this);
            window.addEventListener('scroll', this.handleScroll, { passive: true });
        },

        destroy() {
            window.removeEventListener('scroll', this.handleScroll);
        },

        handleScroll() {
            const currentScrollY = window.scrollY;
            const scrollDelta = Math.abs(currentScrollY - this.lastScrollY);
            
            // Add background if scrolled more than threshold
            this.hasScrolled = currentScrollY > this.scrollThreshold;
            
            // Hide/show logic based on scroll direction
            // Only if scrolled enough (avoids micro-movements)
            if (scrollDelta > 5) {
                if (currentScrollY > this.lastScrollY && currentScrollY > 200) {
                    // Scrolling down - hide navbar (higher threshold at 200px)
                    this.isHidden = true;
                } else if (currentScrollY < this.lastScrollY || currentScrollY <= 200) {
                    // Scrolling up OR near top - show navbar
                    this.isHidden = false;
                }
            }
            
            this.lastScrollY = currentScrollY;
        }
    }));
});

// Table sorting functionality
function sortTable(clickedHeader) {
    const table = clickedHeader.closest('table');
    const tbody = table.querySelector('tbody');
    const headerRow = clickedHeader.closest('tr');
    const headers = Array.from(headerRow.querySelectorAll('th'));
    const columnIndex = headers.indexOf(clickedHeader.closest('th'));
    const sortKey = clickedHeader.closest('th').dataset.sortKey;
    
    // Get current sort state
    const currentSort = clickedHeader.closest('th').dataset.sorted;
    const newDirection = currentSort === 'asc' ? 'desc' : 'asc';
    
    // Reset all other columns
    headers.forEach(header => {
        header.removeAttribute('data-sorted');
        const icon = header.querySelector('.lucide');
        if (icon && header !== clickedHeader.closest('th')) {
            // Reset to default chevrons-up-down icon
            icon.innerHTML = '<path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path>';
            icon.classList.remove('text-primary');
            icon.classList.add('opacity-50');
        }
    });
    
    // Set new sort state
    clickedHeader.closest('th').dataset.sorted = newDirection;
    
    // Update icon
    const icon = clickedHeader.querySelector('.lucide');
    if (icon) {
        if (newDirection === 'desc') {
            icon.innerHTML = '<path d="m7 10 5 5 5-5"></path>';
        } else {
            icon.innerHTML = '<path d="m7 15 5-5 5 5"></path>';
        }
        icon.classList.remove('opacity-50');
        icon.classList.add('text-primary');
    }
    
    // Get all rows
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Sort rows
    rows.sort((a, b) => {
        let aValue, bValue;
        
        if (sortKey) {
            // Use data attributes if available
            aValue = a.dataset[sortKey] || '';
            bValue = b.dataset[sortKey] || '';
        } else {
            // Use cell content
            const aCell = a.querySelectorAll('td')[columnIndex];
            const bCell = b.querySelectorAll('td')[columnIndex];
            
            aValue = getCellSortValue(aCell);
            bValue = getCellSortValue(bCell);
        }
        
        // Convert to numbers if possible
        const aNum = parseFloat(aValue.toString().replace(/[$,]/g, ''));
        const bNum = parseFloat(bValue.toString().replace(/[$,]/g, ''));
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return newDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        const aStr = aValue.toString().toLowerCase();
        const bStr = bValue.toString().toLowerCase();
        
        if (newDirection === 'asc') {
            return aStr.localeCompare(bStr);
        } else {
            return bStr.localeCompare(aStr);
        }
    });
    
    // Clear tbody and append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

function getCellSortValue(cell) {
    // Try to get a data-sort-value attribute first
    if (cell.dataset.sortValue) {
        return cell.dataset.sortValue;
    }
    
    // Look for specific elements that might contain the actual value
    const codeElement = cell.querySelector('code');
    if (codeElement) {
        return codeElement.textContent.trim();
    }
    
    const spanElement = cell.querySelector('span.font-mono, span.text-2xl');
    if (spanElement) {
        return spanElement.textContent.trim();
    }
    
    // For badges, get the text content
    const badgeElement = cell.querySelector('.badge');
    if (badgeElement) {
        return badgeElement.textContent.trim();
    }
    
    // Default to cell text content, but exclude hidden elements
    const clonedCell = cell.cloneNode(true);
    const elementsToRemove = clonedCell.querySelectorAll('.opacity-50, .text-sm.opacity-50');
    elementsToRemove.forEach(el => el.remove());
    
    return clonedCell.textContent.trim();
}

// Utility function to integrate range slider with filters
function setupRangeSliderIntegration(range, filterId, config, format, updateCallback) {
    const slider = range.querySelector('[data-filter-range-slider]');
    if (!slider) return null;
    
    // Set slider data attributes
    slider.dataset.min = config.min;
    slider.dataset.max = config.max;
    slider.dataset.valueMin = config.min;
    slider.dataset.valueMax = config.max;
    slider.dataset.format = format;
    
    // Initialize the slider
    const rangeSlider = new RangeSlider(slider);
    
    // Store reference on the slider element for later use
    slider.rangeSliderInstance = rangeSlider;
    
    // Flag to prevent infinite loops
    let isUpdatingFromSlider = false;
    
    // Listen to slider changes
    slider.addEventListener('rangechange', (e) => {
        const { min, max } = e.detail;
        const minInput = range.querySelector('[data-min-input]');
        const maxInput = range.querySelector('[data-max-input]');
        
        isUpdatingFromSlider = true;
        if (minInput) minInput.value = min;
        if (maxInput) maxInput.value = max;
        isUpdatingFromSlider = false;
        
        // Call the update callback
        updateCallback(min, max);
    });
    
    // Store the flag on the range element so it can be accessed by input listeners
    range._isUpdatingFromSlider = () => isUpdatingFromSlider;
    
    return rangeSlider;
}

// Table Filtering System - Vanilla JS
class TableFilter {
    constructor(tableContainer) {
        this.container = tableContainer;
        this.table = tableContainer.querySelector('table');
        this.filters = {
            text: '',
            dropdowns: {},
            ranges: {}
        };
        this.filterConfig = {};
        
        this.init();
    }
    
    init() {
        this.detectFilterableColumns();
        this.setupEventListeners();
        this.initializeFilterComponents();
        console.log('Table filter initialized:', this.filterConfig);
    }
    
    detectFilterableColumns() {
        if (!this.table) {
            console.warn('No table found');
            return;
        }
        
        const rows = Array.from(this.table.querySelectorAll('tbody tr'));
        const headers = Array.from(this.table.querySelectorAll('thead th[data-filter-id]'));
        
        console.log('Found headers with filter-id:', headers.length);
        console.log('Found data rows:', rows.length);
        
        headers.forEach((header) => {
            const filterId = header.dataset.filterId;
            const filterType = header.dataset.filterType || 'dropdown';
            
            const allHeaders = Array.from(this.table.querySelectorAll('thead th'));
            const columnIndex = allHeaders.indexOf(header);
            
            if (filterType === 'dropdown') {
                const uniqueValues = new Set();
                rows.forEach(row => {
                    const cell = row.querySelectorAll('td')[columnIndex];
                    if (cell) {
                        const filterValue = this.getCellFilterValue(cell, filterId);
                        if (filterValue && filterValue.trim()) {
                            uniqueValues.add(filterValue.trim());
                        }
                    }
                });
                
                this.filterConfig[filterId] = {
                    type: 'dropdown',
                    options: Array.from(uniqueValues).sort(),
                    columnIndex
                };
                
                this.filters.dropdowns[filterId] = [];
            }
            
            if (filterType === 'range') {
                let min = Infinity;
                let max = -Infinity;
                
                rows.forEach(row => {
                    const cell = row.querySelectorAll('td')[columnIndex];
                    if (cell) {
                        const filterValue = this.getCellFilterValue(cell, filterId);
                        const numValue = parseFloat(filterValue);
                        if (!isNaN(numValue)) {
                            min = Math.min(min, numValue);
                            max = Math.max(max, numValue);
                        }
                    }
                });
                
                this.filterConfig[filterId] = {
                    type: 'range',
                    min: min === Infinity ? 0 : min,
                    max: max === -Infinity ? 100 : max,
                    columnIndex
                };
                
                this.filters.ranges[filterId] = {
                    min: this.filterConfig[filterId].min,
                    max: this.filterConfig[filterId].max
                };
            }
        });
    }
    
    getCellFilterValue(cell, filterId) {
        const dataAttr = `data-filter-${filterId}`;
        const dataValue = cell.getAttribute(dataAttr);
        if (dataValue) {
            return dataValue;
        }
        
        const badge = cell.querySelector('.badge, [class*="badge"]');
        if (badge) {
            return badge.textContent.trim();
        }
        
        const span = cell.querySelector('span[class*="font-mono"], code');
        if (span) {
            const text = span.textContent.trim();
            return text.replace(/[$,€]/g, '');
        }
        
        return cell.textContent.trim();
    }
    
    setupEventListeners() {
        // Text search
        const textInput = this.container.querySelector('[data-filter-input="text"]');
        const clearButton = this.container.querySelector('[data-clear-search]');
        const resetButton = this.container.querySelector('[data-reset-filters]');
        
        if (textInput) {
            textInput.addEventListener('input', (e) => {
                this.filters.text = e.target.value;
                this.applyAllFilters();
                this.updateClearButton();
            });
        }
        
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.filters.text = '';
                textInput.value = '';
                this.applyAllFilters();
                this.updateClearButton();
            });
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetAllFilters();
            });
        }
    }
    
    updateClearButton() {
        const clearButton = this.container.querySelector('[data-clear-search]');
        if (clearButton) {
            clearButton.classList.toggle('hidden', !this.filters.text);
        }
    }
    
    initializeFilterComponents() {
        // Initialize dropdown filters
        this.container.querySelectorAll('[data-filter-dropdown]').forEach(dropdown => {
            this.initDropdownFilter(dropdown);
        });
        
        // Initialize range filters
        this.container.querySelectorAll('[data-filter-range]').forEach(range => {
            this.initRangeFilter(range);
        });
    }
    
    initDropdownFilter(dropdown) {
        const filterId = dropdown.dataset.filterDropdown;
        const config = this.filterConfig[filterId];

        if (!config) return;

        // Skip if already initialized (prevents duplicates on HTMX re-init)
        if (dropdown.dataset.filterInitialized === 'true') return;
        dropdown.dataset.filterInitialized = 'true';

        const toggle = dropdown.querySelector('[data-dropdown-toggle]');
        const optionsContainer = dropdown.querySelector('[data-options-container]');
        const noOptionsText = dropdown.querySelector('[data-no-options]');
        const clearSection = dropdown.querySelector('[data-clear-section]');
        const clearButton = dropdown.querySelector('[data-clear-filter]');
        const countBadge = dropdown.querySelector('[data-filter-count]');

        // Clear existing options before populating
        optionsContainer.innerHTML = '';

        // Populate options
        if (config.options.length === 0) {
            noOptionsText.classList.remove('hidden');
        } else {
            noOptionsText.classList.add('hidden');
            config.options.forEach(option => {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = `
                    <label class="label cursor-pointer justify-start gap-3 p-3 hover:bg-base-200 rounded transition-colors w-full">
                        <input type="checkbox" class="checkbox checkbox-sm" value="${option}">
                        <span class="label-text text-sm flex-1">${option}</span>
                    </label>
                `;
                optionsContainer.appendChild(wrapper);

                const checkbox = wrapper.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', () => {
                    this.updateDropdownFilter(filterId);
                });
            });
        }

        // Clear button
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearDropdownFilter(filterId);
            });
        }

        // Toggle dropdown - find the button inside the c-button
        if (toggle) {
            const button = toggle.querySelector('button') || toggle;
            button.addEventListener('click', () => {
                dropdown.classList.toggle('dropdown-open');
            });
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('dropdown-open');
            }
        });
    }

    initRangeFilter(range) {
        const filterId = range.dataset.filterRange;
        const format = range.dataset.format || 'number';
        const config = this.filterConfig[filterId];

        if (!config) return;

        const toggle = range.querySelector('[data-range-toggle]');
        const minInput = range.querySelector('[data-min-input]');
        const maxInput = range.querySelector('[data-max-input]');
        const resetButton = range.querySelector('[data-reset-range]');
        const rangeDisplay = range.querySelector('[data-range-display]');
        const activeIndicator = range.querySelector('[data-active-indicator]');
        
        // Initialize inputs
        minInput.min = config.min;
        minInput.max = config.max;
        minInput.value = config.min;
        maxInput.min = config.min;
        maxInput.max = config.max;
        maxInput.value = config.max;
        
        // Initialize slider integration
        const rangeSlider = setupRangeSliderIntegration(range, filterId, config, format, (min, max) => {
            this.filters.ranges[filterId] = { min, max };
            this.applyAllFilters();
            this.updateRangeDisplay(range, min, max, format);
            this.updateRangeIndicators(range, config, min, max);
        });
        
        this.updateRangeDisplay(range, config.min, config.max, format);
        
        // Event listeners
        [minInput, maxInput].forEach(input => {
            input.addEventListener('input', () => {
                // Skip if the input is being updated from the slider to avoid loops
                if (range._isUpdatingFromSlider && range._isUpdatingFromSlider()) {
                    return;
                }
                
                const min = parseFloat(minInput.value) || config.min;
                const max = parseFloat(maxInput.value) || config.max;
                
                // Update slider if present
                if (rangeSlider) {
                    rangeSlider.setRange(min, max);
                }
                
                this.filters.ranges[filterId] = { min, max };
                this.applyAllFilters();
                this.updateRangeDisplay(range, min, max, format);
                this.updateRangeIndicators(range, config, min, max);
            });
        });
        
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetRangeFilter(filterId);
            });
        }
        
        // Toggle range dropdown - find the button inside the c-button
        if (toggle) {
            const button = toggle.querySelector('button') || toggle;
            button.addEventListener('click', () => {
                range.classList.toggle('dropdown-open');
            });
        }
        
        document.addEventListener('click', (e) => {
            if (!range.contains(e.target)) {
                range.classList.remove('dropdown-open');
            }
        });
    }
    
    updateDropdownFilter(filterId) {
        const dropdown = this.container.querySelector(`[data-filter-dropdown="${filterId}"]`);
        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');
        const selectedValues = Array.from(checkboxes).map(cb => cb.value);
        
        this.filters.dropdowns[filterId] = selectedValues;
        this.applyAllFilters();
        
        // Update UI
        const countBadge = dropdown.querySelector('[data-filter-count]');
        const clearSection = dropdown.querySelector('[data-clear-section]');
        const toggle = dropdown.querySelector('[data-dropdown-toggle]');
        
        if (selectedValues.length > 0) {
            countBadge.textContent = selectedValues.length;
            countBadge.classList.remove('opacity-0');
            countBadge.classList.add('opacity-100');
            clearSection.classList.remove('hidden');
            
            // Handle classes for c-button (find the button inside)
            const button = toggle.querySelector('button') || toggle;
            button.classList.remove('btn-outline');
            button.classList.add('btn-primary');
        } else {
            countBadge.textContent = '0';
            countBadge.classList.add('opacity-0');
            countBadge.classList.remove('opacity-100');
            clearSection.classList.add('hidden');
            
            // Handle classes for c-button (find the button inside)
            const button = toggle.querySelector('button') || toggle;
            button.classList.add('btn-outline');
            button.classList.remove('btn-primary');
        }
    }
    
    clearDropdownFilter(filterId) {
        const dropdown = this.container.querySelector(`[data-filter-dropdown="${filterId}"]`);
        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        this.updateDropdownFilter(filterId);
    }
    
    updateRangeDisplay(range, min, max, format) {
        const rangeDisplay = range.querySelector('[data-range-display]');
        if (rangeDisplay) {
            if (format === 'currency') {
                const formatter = new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0
                });
                rangeDisplay.textContent = `${formatter.format(min)} - ${formatter.format(max)}`;
            } else {
                rangeDisplay.textContent = `${min} - ${max}`;
            }
        }
    }
    
    updateRangeIndicators(range, config, min, max) {
        const resetButton = range.querySelector('[data-reset-range]');
        const activeIndicator = range.querySelector('[data-active-indicator]');
        const toggle = range.querySelector('[data-range-toggle]');
        
        const hasActiveFilter = min !== config.min || max !== config.max;
        
        if (hasActiveFilter) {
            resetButton.classList.remove('hidden');
            activeIndicator.classList.remove('opacity-0');
            activeIndicator.classList.add('opacity-100');
            
            // Handle classes for c-button (find the button inside)
            const button = toggle.querySelector('button') || toggle;
            button.classList.remove('btn-outline');
            button.classList.add('btn-primary');
        } else {
            resetButton.classList.add('hidden');
            activeIndicator.classList.add('opacity-0');
            activeIndicator.classList.remove('opacity-100');
            
            // Handle classes for c-button (find the button inside)
            const button = toggle.querySelector('button') || toggle;
            button.classList.add('btn-outline');
            button.classList.remove('btn-primary');
        }
    }
    
    resetRangeFilter(filterId) {
        const config = this.filterConfig[filterId];
        const range = this.container.querySelector(`[data-filter-range="${filterId}"]`);
        const minInput = range.querySelector('[data-min-input]');
        const maxInput = range.querySelector('[data-max-input]');
        const format = range.dataset.format || 'number';
        
        minInput.value = config.min;
        maxInput.value = config.max;
        
        // Reset slider if present
        const slider = range.querySelector('[data-filter-range-slider]');
        if (slider && slider.rangeSliderInstance) {
            slider.rangeSliderInstance.setMinMax(config.min, config.max);
            slider.rangeSliderInstance.setRange(config.min, config.max);
        }
        
        this.filters.ranges[filterId] = { min: config.min, max: config.max };
        this.applyAllFilters();
        this.updateRangeDisplay(range, config.min, config.max, format);
        this.updateRangeIndicators(range, config, config.min, config.max);
    }
    
    applyAllFilters() {
        if (!this.table) return;
        
        const rows = Array.from(this.table.querySelectorAll('tbody tr'));
        let visibleCount = 0;
        
        rows.forEach(row => {
            let visible = true;
            
            // Text filter
            if (this.filters.text && this.filters.text.trim()) {
                const text = row.textContent.toLowerCase();
                visible = visible && text.includes(this.filters.text.toLowerCase());
            }
            
            // Dropdown filters
            Object.entries(this.filters.dropdowns).forEach(([filterId, selectedValues]) => {
                if (selectedValues.length > 0) {
                    const config = this.filterConfig[filterId];
                    if (config) {
                        const cell = row.querySelectorAll('td')[config.columnIndex];
                        if (cell) {
                            const cellValue = this.getCellFilterValue(cell, filterId);
                            visible = visible && selectedValues.includes(cellValue);
                        }
                    }
                }
            });
            
            // Range filters
            Object.entries(this.filters.ranges).forEach(([filterId, range]) => {
                const config = this.filterConfig[filterId];
                if (config && (range.min !== config.min || range.max !== config.max)) {
                    const cell = row.querySelectorAll('td')[config.columnIndex];
                    if (cell) {
                        const cellValue = parseFloat(this.getCellFilterValue(cell, filterId));
                        if (!isNaN(cellValue)) {
                            visible = visible && cellValue >= range.min && cellValue <= range.max;
                        }
                    }
                }
            });
            
            row.style.display = visible ? '' : 'none';
            if (visible) visibleCount++;
        });
        
        console.log(`Filtered: ${visibleCount}/${rows.length} rows visible`);
    }
    
    resetAllFilters() {
        // Reset text filter
        this.filters.text = '';
        const textInput = this.container.querySelector('[data-filter-input="text"]');
        if (textInput) textInput.value = '';
        
        // Reset ALL dropdown filters (not just active ones)
        this.container.querySelectorAll('[data-filter-dropdown]').forEach(dropdown => {
            const filterId = dropdown.dataset.filterDropdown;
            this.clearDropdownFilter(filterId);
        });
        
        // Reset ALL range filters (not just active ones)
        this.container.querySelectorAll('[data-filter-range]').forEach(range => {
            const filterId = range.dataset.filterRange;
            this.resetRangeFilter(filterId);
        });
        
        this.updateClearButton();
        this.applyAllFilters();
    }
}

// Generic Filter System - Vanilla JS (based on TableFilter)
class GenericFilter {
    constructor(container) {
        this.container = container;
        this.targetSelector = container.dataset.target;
        this.itemSelector = container.dataset.itemSelector || '.card';
        this.dataPrefix = container.dataset.dataPrefix || 'filter-';
        this.targetContainer = document.querySelector('#' + this.targetSelector);
        
        
        this.filters = {
            text: '',
            dropdowns: {},
            ranges: {}
        };
        this.filterConfig = {};
        
        this.init();
    }
    
    init() {
        if (!this.targetContainer) {
            console.warn('Target container not found:', this.targetSelector);
            return;
        }
        
        this.detectFilterableItems();
        this.setupEventListeners();
        this.initializeFilterComponents();
    }
    
    detectFilterableItems() {
        const items = Array.from(this.targetContainer.querySelectorAll(this.itemSelector));
        
        // Detect available filters from data attributes
        const filterIds = new Set();
        const prefixToFind = `data-${this.dataPrefix}`;
        
        items.forEach(item => {
            const attributes = item.attributes;
            for (let attr of attributes) {
                if (attr.name.startsWith(prefixToFind)) {
                    const filterId = attr.name.substring(prefixToFind.length);
                    filterIds.add(filterId);
                }
            }
        });
        
        // Configure filters based on detected attributes
        filterIds.forEach(filterId => {
            const attributeName = `data-${this.dataPrefix}${filterId}`;
            
            // Collect all values for this filter
            const values = items
                .map(item => item.getAttribute(attributeName))
                .filter(value => value && value.trim());
            
            // Determine if it's a range or dropdown filter
            const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
            const isNumeric = numericValues.length === values.length && values.length > 0;
            
            if (isNumeric) {
                // Range filter
                const min = Math.min(...numericValues);
                const max = Math.max(...numericValues);
                
                this.filterConfig[filterId] = {
                    type: 'range',
                    min: min,
                    max: max,
                    attributeName: attributeName
                };
                
                this.filters.ranges[filterId] = { min, max };
            } else {
                // Dropdown filter
                const uniqueValues = [...new Set(values)].sort();
                
                this.filterConfig[filterId] = {
                    type: 'dropdown',
                    options: uniqueValues,
                    attributeName: attributeName
                };
                
                this.filters.dropdowns[filterId] = [];
            }
        });
    }
    
    getItemFilterValue(item, filterId) {
        const config = this.filterConfig[filterId];
        if (!config) return null;
        
        return item.getAttribute(config.attributeName);
    }
    
    setupEventListeners() {
        // Text search
        const textInput = this.container.querySelector('[data-filter-input="text"]');
        const clearButton = this.container.querySelector('[data-clear-search]');
        const resetButton = this.container.querySelector('[data-reset-filters]');
        
        if (textInput) {
            textInput.addEventListener('input', (e) => {
                this.filters.text = e.target.value;
                this.applyAllFilters();
                this.updateClearButton();
            });
        }
        
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.filters.text = '';
                textInput.value = '';
                this.applyAllFilters();
                this.updateClearButton();
            });
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetAllFilters();
            });
        }
    }
    
    updateClearButton() {
        const clearButton = this.container.querySelector('[data-clear-search]');
        if (clearButton) {
            clearButton.classList.toggle('hidden', !this.filters.text);
        }
    }
    
    initializeFilterComponents() {
        // Initialize dropdown filters
        this.container.querySelectorAll('[data-filter-dropdown]').forEach(dropdown => {
            this.initDropdownFilter(dropdown);
        });
        
        // Initialize range filters
        this.container.querySelectorAll('[data-filter-range]').forEach(range => {
            this.initRangeFilter(range);
        });
    }
    
    initDropdownFilter(dropdown) {
        const filterId = dropdown.dataset.filterDropdown;
        const config = this.filterConfig[filterId];

        if (!config) return;

        // Skip if already initialized (prevents duplicates on HTMX re-init)
        if (dropdown.dataset.filterInitialized === 'true') return;
        dropdown.dataset.filterInitialized = 'true';

        const toggle = dropdown.querySelector('[data-dropdown-toggle]');
        const optionsContainer = dropdown.querySelector('[data-options-container]');
        const noOptionsText = dropdown.querySelector('[data-no-options]');
        const clearSection = dropdown.querySelector('[data-clear-section]');
        const clearButton = dropdown.querySelector('[data-clear-filter]');
        const countBadge = dropdown.querySelector('[data-filter-count]');

        // Clear existing options before populating
        optionsContainer.innerHTML = '';

        // Populate options
        if (config.options.length === 0) {
            noOptionsText.classList.remove('hidden');
        } else {
            noOptionsText.classList.add('hidden');
            config.options.forEach(option => {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = `
                    <label class="label cursor-pointer justify-start gap-3 p-3 hover:bg-base-200 rounded transition-colors w-full">
                        <input type="checkbox" class="checkbox checkbox-sm" value="${option}">
                        <span class="label-text text-sm flex-1">${option}</span>
                    </label>
                `;
                optionsContainer.appendChild(wrapper);

                const checkbox = wrapper.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', () => {
                    this.updateDropdownFilter(filterId);
                });
            });
        }

        // Clear button
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearDropdownFilter(filterId);
            });
        }

        // Toggle dropdown
        if (toggle) {
            const button = toggle.querySelector('button') || toggle;
            button.addEventListener('click', () => {
                dropdown.classList.toggle('dropdown-open');
            });
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('dropdown-open');
            }
        });
    }

    initRangeFilter(range) {
        const filterId = range.dataset.filterRange;
        const format = range.dataset.format || 'number';
        const config = this.filterConfig[filterId];

        if (!config) return;

        const toggle = range.querySelector('[data-range-toggle]');
        const minInput = range.querySelector('[data-min-input]');
        const maxInput = range.querySelector('[data-max-input]');
        const resetButton = range.querySelector('[data-reset-range]');
        const rangeDisplay = range.querySelector('[data-range-display]');
        const activeIndicator = range.querySelector('[data-active-indicator]');

        // Initialize inputs
        minInput.min = config.min;
        minInput.max = config.max;
        minInput.value = config.min;
        maxInput.min = config.min;
        maxInput.max = config.max;
        maxInput.value = config.max;
        
        // Initialize slider integration
        const rangeSlider = setupRangeSliderIntegration(range, filterId, config, format, (min, max) => {
            this.filters.ranges[filterId] = { min, max };
            this.applyAllFilters();
            this.updateRangeDisplay(range, min, max, format);
            this.updateRangeIndicators(range, config, min, max);
        });
        
        this.updateRangeDisplay(range, config.min, config.max, format);
        
        // Event listeners
        [minInput, maxInput].forEach(input => {
            input.addEventListener('input', () => {
                // Skip if the input is being updated from the slider to avoid loops
                if (range._isUpdatingFromSlider && range._isUpdatingFromSlider()) {
                    return;
                }
                
                const min = parseFloat(minInput.value) || config.min;
                const max = parseFloat(maxInput.value) || config.max;
                
                // Update slider if present
                if (rangeSlider) {
                    rangeSlider.setRange(min, max);
                }
                
                this.filters.ranges[filterId] = { min, max };
                this.applyAllFilters();
                this.updateRangeDisplay(range, min, max, format);
                this.updateRangeIndicators(range, config, min, max);
            });
        });
        
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetRangeFilter(filterId);
            });
        }
        
        // Toggle range dropdown
        if (toggle) {
            const button = toggle.querySelector('button') || toggle;
            button.addEventListener('click', () => {
                range.classList.toggle('dropdown-open');
            });
        }
        
        document.addEventListener('click', (e) => {
            if (!range.contains(e.target)) {
                range.classList.remove('dropdown-open');
            }
        });
    }
    
    updateDropdownFilter(filterId) {
        const dropdown = this.container.querySelector(`[data-filter-dropdown="${filterId}"]`);
        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');
        const selectedValues = Array.from(checkboxes).map(cb => cb.value);
        
        this.filters.dropdowns[filterId] = selectedValues;
        this.applyAllFilters();
        
        // Update UI
        const countBadge = dropdown.querySelector('[data-filter-count]');
        const clearSection = dropdown.querySelector('[data-clear-section]');
        const toggle = dropdown.querySelector('[data-dropdown-toggle]');
        
        if (selectedValues.length > 0) {
            countBadge.textContent = selectedValues.length;
            countBadge.classList.remove('opacity-0');
            countBadge.classList.add('opacity-100');
            clearSection.classList.remove('hidden');
            
            const button = toggle.querySelector('button') || toggle;
            button.classList.remove('btn-outline');
            button.classList.add('btn-primary');
        } else {
            countBadge.textContent = '0';
            countBadge.classList.add('opacity-0');
            countBadge.classList.remove('opacity-100');
            clearSection.classList.add('hidden');
            
            const button = toggle.querySelector('button') || toggle;
            button.classList.add('btn-outline');
            button.classList.remove('btn-primary');
        }
    }
    
    clearDropdownFilter(filterId) {
        const dropdown = this.container.querySelector(`[data-filter-dropdown="${filterId}"]`);
        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        this.updateDropdownFilter(filterId);
    }
    
    updateRangeDisplay(range, min, max, format) {
        const rangeDisplay = range.querySelector('[data-range-display]');
        if (rangeDisplay) {
            if (format === 'currency') {
                const formatter = new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0
                });
                rangeDisplay.textContent = `${formatter.format(min)} - ${formatter.format(max)}`;
            } else {
                rangeDisplay.textContent = `${min} - ${max}`;
            }
        }
    }
    
    updateRangeIndicators(range, config, min, max) {
        const resetButton = range.querySelector('[data-reset-range]');
        const activeIndicator = range.querySelector('[data-active-indicator]');
        const toggle = range.querySelector('[data-range-toggle]');
        
        const hasActiveFilter = min !== config.min || max !== config.max;
        
        if (hasActiveFilter) {
            resetButton.classList.remove('hidden');
            activeIndicator.classList.remove('opacity-0');
            activeIndicator.classList.add('opacity-100');
            
            const button = toggle.querySelector('button') || toggle;
            button.classList.remove('btn-outline');
            button.classList.add('btn-primary');
        } else {
            resetButton.classList.add('hidden');
            activeIndicator.classList.add('opacity-0');
            activeIndicator.classList.remove('opacity-100');
            
            const button = toggle.querySelector('button') || toggle;
            button.classList.add('btn-outline');
            button.classList.remove('btn-primary');
        }
    }
    
    resetRangeFilter(filterId) {
        const config = this.filterConfig[filterId];
        const range = this.container.querySelector(`[data-filter-range="${filterId}"]`);
        const minInput = range.querySelector('[data-min-input]');
        const maxInput = range.querySelector('[data-max-input]');
        const format = range.dataset.format || 'number';
        
        minInput.value = config.min;
        maxInput.value = config.max;
        
        // Reset slider if present
        const slider = range.querySelector('[data-filter-range-slider]');
        if (slider && slider.rangeSliderInstance) {
            slider.rangeSliderInstance.setMinMax(config.min, config.max);
            slider.rangeSliderInstance.setRange(config.min, config.max);
        }
        
        this.filters.ranges[filterId] = { min: config.min, max: config.max };
        this.applyAllFilters();
        this.updateRangeDisplay(range, config.min, config.max, format);
        this.updateRangeIndicators(range, config, config.min, config.max);
    }
    
    applyAllFilters() {
        if (!this.targetContainer) return;
        
        const items = Array.from(this.targetContainer.querySelectorAll(this.itemSelector));
        let visibleCount = 0;
        
        items.forEach(item => {
            let visible = true;
            
            // Text filter
            if (this.filters.text && this.filters.text.trim()) {
                const text = item.textContent.toLowerCase();
                visible = visible && text.includes(this.filters.text.toLowerCase());
            }
            
            // Dropdown filters
            Object.entries(this.filters.dropdowns).forEach(([filterId, selectedValues]) => {
                if (selectedValues.length > 0) {
                    const itemValue = this.getItemFilterValue(item, filterId);
                    if (itemValue) {
                        visible = visible && selectedValues.includes(itemValue);
                    } else {
                        visible = false;
                    }
                }
            });
            
            // Range filters
            Object.entries(this.filters.ranges).forEach(([filterId, range]) => {
                const config = this.filterConfig[filterId];
                if (config && (range.min !== config.min || range.max !== config.max)) {
                    const itemValue = parseFloat(this.getItemFilterValue(item, filterId));
                    if (!isNaN(itemValue)) {
                        visible = visible && itemValue >= range.min && itemValue <= range.max;
                    } else {
                        visible = false;
                    }
                }
            });
            
            item.style.display = visible ? '' : 'none';
            if (visible) visibleCount++;
        });
        
    }
    
    resetAllFilters() {
        // Reset text filter
        this.filters.text = '';
        const textInput = this.container.querySelector('[data-filter-input="text"]');
        if (textInput) textInput.value = '';
        
        // Reset ALL dropdown filters (not just active ones)
        this.container.querySelectorAll('[data-filter-dropdown]').forEach(dropdown => {
            const filterId = dropdown.dataset.filterDropdown;
            this.clearDropdownFilter(filterId);
        });
        
        // Reset ALL range filters (not just active ones)
        this.container.querySelectorAll('[data-filter-range]').forEach(range => {
            const filterId = range.dataset.filterRange;
            this.resetRangeFilter(filterId);
        });
        
        this.updateClearButton();
        this.applyAllFilters();
    }
}

/* 
 * Tab System - JavaScript-based implementation
 * Works with the custom tab components
 */
function initializeTabs() {
    const tabGroups = document.querySelectorAll('.tabs-group');
    
    tabGroups.forEach(group => {
        const radioInputs = group.querySelectorAll('input[type="radio"]');
        const tabContents = group.querySelectorAll('.tab-content');
        
        // Hide all content initially
        tabContents.forEach(content => {
            content.style.display = 'none';
        });
        
        // Show the first tab content or the checked one
        const checkedInput = group.querySelector('input[type="radio"]:checked');
        if (checkedInput) {
            showTabContent(group, checkedInput);
        } else if (radioInputs.length > 0) {
            // Check the first radio if none is checked
            radioInputs[0].checked = true;
            showTabContent(group, radioInputs[0]);
        }
        
        // Add event listeners to radio inputs
        radioInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    showTabContent(group, e.target);
                }
            });
        });
    });
}

function showTabContent(group, radioInput) {
    // Hide all tab contents in this group
    const tabContents = group.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });
    
    // Extract tab name from radio input ID
    // Format: tab-{group_name}-{tab_name}
    const inputId = radioInput.id;
    const parts = inputId.split('-');
    const tabName = parts[parts.length - 1]; // Last part is the tab name
    
    // Show the corresponding tab content
    const targetContent = group.querySelector(`[data-tab="${tabName}"]`);
    if (targetContent) {
        targetContent.style.display = 'block';
    }
    
    // Update animated underline for default tabs
    updateAnimatedUnderline(group, radioInput);
}

function updateAnimatedUnderline(group, activeRadio) {
    const tabsContainer = group.querySelector('.tabs');
    
    // Only apply to default tabs (not segmented or pill)
    if (!tabsContainer || tabsContainer.classList.contains('tabs-segmented') || tabsContainer.classList.contains('tabs-pill')) {
        return;
    }
    
    const activeTab = activeRadio.nextElementSibling; // The label that comes after the radio
    
    if (!activeTab || !activeTab.classList.contains('tab')) {
        return;
    }
    
    // Calculate position and dimensions
    const tabsRect = tabsContainer.getBoundingClientRect();
    const activeTabRect = activeTab.getBoundingClientRect();
    
    // Check if tabs are vertical
    const isVertical = tabsContainer.classList.contains('tabs-vertical');
    
    if (isVertical) {
        // Vertical tabs: animate top position and height
        const top = activeTabRect.top - tabsRect.top;
        const height = activeTabRect.height;
        
        // Update CSS custom properties for vertical animation
        tabsContainer.style.setProperty('--underline-top', `${top}px`);
        tabsContainer.style.setProperty('--underline-height', `${height}px`);
    } else {
        // Horizontal tabs: animate left position and width
        const left = activeTabRect.left - tabsRect.left;
        const width = activeTabRect.width;
        
        // Update CSS custom properties for horizontal animation
        tabsContainer.style.setProperty('--underline-left', `${left}px`);
        tabsContainer.style.setProperty('--underline-width', `${width}px`);
    }
}

// Initialize filters when DOM is ready
function initializeFilters() {
    // Initialize table filters
    const filterableTables = document.querySelectorAll('[data-table-filter="true"]');
    filterableTables.forEach(table => {
        new TableFilter(table);
    });
    
    // Initialize generic filters
    const genericFilters = document.querySelectorAll('[data-generic-filter="true"]');
    genericFilters.forEach(container => {
        new GenericFilter(container);
    });
}

// Range Slider Component
class RangeSlider {
    constructor(container) {
        this.container = container;
        this.min = parseFloat(container.dataset.min) || 0;
        this.max = parseFloat(container.dataset.max) || 100;
        this.step = parseFloat(container.dataset.step) || 1;
        this.format = container.dataset.format || 'number';
        this.valueMin = parseFloat(container.dataset.valueMin) || this.min;
        this.valueMax = parseFloat(container.dataset.valueMax) || this.max;
        
        this.track = container.querySelector('[data-selection-track]');
        this.handleMin = container.querySelector('[data-handle-min]');
        this.handleMax = container.querySelector('[data-handle-max]');
        this.displayMin = container.querySelector('[data-display-min]');
        this.displayMax = container.querySelector('[data-display-max]');
        this.inputMin = container.querySelector('[data-input-min]');
        this.inputMax = container.querySelector('[data-input-max]');
        
        this.isDragging = false;
        this.currentHandle = null;
        
        this.init();
    }
    
    init() {
        this.updateSlider();
        this.bindEvents();
    }
    
    bindEvents() {
        // Mouse events
        this.handleMin.addEventListener('mousedown', (e) => this.startDrag(e, 'min'));
        this.handleMax.addEventListener('mousedown', (e) => this.startDrag(e, 'max'));
        
        // Touch events
        this.handleMin.addEventListener('touchstart', (e) => this.startDrag(e, 'min'));
        this.handleMax.addEventListener('touchstart', (e) => this.startDrag(e, 'max'));
        
        // Keyboard events
        this.handleMin.addEventListener('keydown', (e) => this.handleKeydown(e, 'min'));
        this.handleMax.addEventListener('keydown', (e) => this.handleKeydown(e, 'max'));
        
        // Global mouse/touch events
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', (e) => this.stopDrag(e));
        document.addEventListener('touchmove', (e) => this.onDrag(e));
        document.addEventListener('touchend', (e) => this.stopDrag(e));
        
        // Track click
        this.container.addEventListener('click', (e) => this.onTrackClick(e));
    }
    
    startDrag(e, handle) {
        e.preventDefault();
        this.isDragging = true;
        this.currentHandle = handle;
        this.container.classList.add('dragging');
    }
    
    stopDrag(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.currentHandle = null;
        this.container.classList.remove('dragging');
        
        // Trigger change event
        this.triggerChange();
    }
    
    onDrag(e) {
        if (!this.isDragging || !this.currentHandle) return;
        
        e.preventDefault();
        
        const rect = this.container.querySelector('.relative').getBoundingClientRect();
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const value = this.min + (percent * (this.max - this.min));
        const snappedValue = Math.max(this.min, Math.min(this.max, Math.round(value / this.step) * this.step));
        
        if (this.currentHandle === 'min') {
            this.valueMin = Math.max(this.min, Math.min(snappedValue, this.valueMax - this.step));
        } else {
            this.valueMax = Math.min(this.max, Math.max(snappedValue, this.valueMin + this.step));
        }
        
        this.updateSlider();
    }
    
    onTrackClick(e) {
        if (this.isDragging) return;
        if (e.target === this.handleMin || e.target === this.handleMax) return;
        
        const rect = this.container.querySelector('.relative').getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const value = this.min + (percent * (this.max - this.min));
        const snappedValue = Math.round(value / this.step) * this.step;
        
        // Move the closest handle
        const distToMin = Math.abs(snappedValue - this.valueMin);
        const distToMax = Math.abs(snappedValue - this.valueMax);
        
        if (distToMin < distToMax) {
            this.valueMin = Math.min(snappedValue, this.valueMax);
        } else {
            this.valueMax = Math.max(snappedValue, this.valueMin);
        }
        
        this.updateSlider();
        this.triggerChange();
    }
    
    handleKeydown(e, handle) {
        let delta = 0;
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'ArrowDown':
                delta = -this.step;
                break;
            case 'ArrowRight':
            case 'ArrowUp':
                delta = this.step;
                break;
            case 'Home':
                if (handle === 'min') {
                    this.valueMin = this.min;
                } else {
                    this.valueMax = this.min;
                }
                break;
            case 'End':
                if (handle === 'min') {
                    this.valueMin = this.max;
                } else {
                    this.valueMax = this.max;
                }
                break;
            default:
                return;
        }
        
        e.preventDefault();
        
        if (delta !== 0) {
            if (handle === 'min') {
                this.valueMin = Math.max(this.min, Math.min(this.valueMax, this.valueMin + delta));
            } else {
                this.valueMax = Math.min(this.max, Math.max(this.valueMin, this.valueMax + delta));
            }
        }
        
        this.updateSlider();
        this.triggerChange();
    }
    
    updateSlider() {
        const minPercent = ((this.valueMin - this.min) / (this.max - this.min)) * 100;
        const maxPercent = ((this.valueMax - this.min) / (this.max - this.min)) * 100;
        
        // Update track selection
        this.track.style.left = `${minPercent}%`;
        this.track.style.width = `${maxPercent - minPercent}%`;
        
        // Update handles
        this.handleMin.style.left = `${minPercent}%`;
        this.handleMax.style.left = `${maxPercent}%`;
        
        // Update displays
        this.displayMin.textContent = this.formatValue(this.valueMin);
        this.displayMax.textContent = this.formatValue(this.valueMax);
        
        // Update hidden inputs
        this.inputMin.value = this.valueMin;
        this.inputMax.value = this.valueMax;
        
        // Update ARIA values
        this.handleMin.setAttribute('aria-valuenow', this.valueMin);
        this.handleMax.setAttribute('aria-valuenow', this.valueMax);
    }
    
    formatValue(value) {
        if (this.format === 'currency') {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        }
        return Math.round(value).toString();
    }
    
    triggerChange() {
        const event = new CustomEvent('rangechange', {
            detail: {
                min: this.valueMin,
                max: this.valueMax
            }
        });
        this.container.dispatchEvent(event);
    }
    
    // Public API
    setRange(min, max) {
        this.valueMin = Math.max(this.min, Math.min(this.max, min));
        this.valueMax = Math.min(this.max, Math.max(this.min, max));
        this.updateSlider();
        
        // Trigger change event to update filters
        const event = new CustomEvent('rangechange', {
            detail: { min: this.valueMin, max: this.valueMax }
        });
        this.container.dispatchEvent(event);
    }
    
    setMinMax(min, max) {
        this.min = min;
        this.max = max;
        this.valueMin = Math.max(min, Math.min(max, this.valueMin));
        this.valueMax = Math.min(max, Math.max(min, this.valueMax));
        this.updateSlider();
    }
}

function initializeRangeSliders() {
    const sliders = document.querySelectorAll('[data-range-slider]');
    sliders.forEach(slider => {
        new RangeSlider(slider);
    });
}

// Combobox Autocomplete Component
class ComboboxAutocomplete {
    constructor(container) {
        this.container = container;
        this.input = container.querySelector('input[type="text"]');
        this.optionsList = container.querySelector('[data-options-list]');
        this.hiddenInput = container.querySelector('[data-hidden-input]');
        this.dropdownArea = container.querySelector('[data-dropdown-area]');
        this.allOptions = Array.from(this.optionsList.querySelectorAll('li'));

        this.selectedIndex = -1;
        this.isOpen = false;
        this.originalOptions = [];

        // Portal state - move dropdown to body to escape modal overflow
        this.isPortaled = false;
        this.originalParent = this.optionsList.parentElement;

        this.init();
    }
    
    init() {
        // Store original options data
        this.originalOptions = this.allOptions.map(option => ({
            element: option,
            value: option.dataset.value,
            text: option.dataset.text,
            textLower: option.dataset.text.toLowerCase()
        }));
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Handle input focus
        this.input.addEventListener('focus', () => {
            this.showAllOptions();
            this.openDropdown();
        });
        
        // Handle input typing
        this.input.addEventListener('input', () => {
            const query = this.input.value.toLowerCase();
            this.filterOptions(query);
            this.selectedIndex = -1;
            this.updateSelectedOption();
            
            if (query === '') {
                this.hiddenInput.value = '';
            }
        });
        
        // Handle keyboard navigation
        this.input.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
            const visibleOptions = this.optionsList.querySelectorAll('li:not(.hidden)');
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectedIndex = Math.min(this.selectedIndex + 1, visibleOptions.length - 1);
                    this.updateSelectedOption();
                    this.scrollToSelected();
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                    this.updateSelectedOption();
                    this.scrollToSelected();
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (this.selectedIndex >= 0) {
                        this.selectOption(visibleOptions[this.selectedIndex]);
                    }
                    break;
                    
                case 'Escape':
                    this.closeDropdown();
                    this.input.blur();
                    break;
            }
        });
        
        // Handle option clicks
        this.optionsList.addEventListener('click', (e) => {
            const option = e.target.closest('li');
            if (option && !option.classList.contains('hidden')) {
                this.selectOption(option);
            }
        });
        
        // Close dropdown when clicking outside (check dropdown area and the portaled options list)
        document.addEventListener('click', (e) => {
            if (!this.dropdownArea.contains(e.target) && !this.optionsList.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    filterOptions(query) {
        if (query === '') {
            this.showAllOptions();
            return;
        }
        
        this.originalOptions.forEach(option => {
            if (option.textLower.includes(query)) {
                option.element.classList.remove('hidden');
            } else {
                option.element.classList.add('hidden');
            }
        });
        
        // Show message if no results
        const visibleOptions = this.optionsList.querySelectorAll('li:not(.hidden)');
        if (visibleOptions.length === 0 && !this.optionsList.querySelector('.no-results')) {
            const noResults = document.createElement('li');
            noResults.className = 'px-3 py-2 text-base-content/50 no-results';
            noResults.textContent = 'No results found';
            this.optionsList.appendChild(noResults);
        } else if (visibleOptions.length > 0) {
            const noResults = this.optionsList.querySelector('.no-results');
            if (noResults) {
                noResults.remove();
            }
        }
    }
    
    showAllOptions() {
        this.originalOptions.forEach(option => {
            option.element.classList.remove('hidden');
        });
        
        const noResults = this.optionsList.querySelector('.no-results');
        if (noResults) {
            noResults.remove();
        }
    }
    
    selectOption(option) {
        const value = option.dataset.value;
        const text = option.dataset.text;
        
        this.input.value = text;
        this.hiddenInput.value = value;
        
        this.closeDropdown();
        
        // Emit a custom event
        this.container.dispatchEvent(new CustomEvent('combobox-change', {
            detail: { value: value, text: text }
        }));
    }
    
    updateSelectedOption() {
        const visibleOptions = this.optionsList.querySelectorAll('li:not(.hidden):not(.no-results)');
        
        // Remove selected class from all options
        this.allOptions.forEach(option => {
            option.classList.remove('bg-neutral', 'text-neutral-content');
        });
        
        // Add selected class to the selected option
        if (this.selectedIndex >= 0 && this.selectedIndex < visibleOptions.length) {
            const selected = visibleOptions[this.selectedIndex];
            selected.classList.add('bg-neutral', 'text-neutral-content');
        }
    }
    
    scrollToSelected() {
        const visibleOptions = this.optionsList.querySelectorAll('li:not(.hidden):not(.no-results)');
        if (this.selectedIndex >= 0 && this.selectedIndex < visibleOptions.length) {
            const selected = visibleOptions[this.selectedIndex];
            selected.scrollIntoView({ block: 'nearest' });
        }
    }
    
    openDropdown() {
        // Portal the dropdown to body to escape modal overflow constraints
        this.portalDropdown();

        this.optionsList.classList.remove('hidden');
        this.isOpen = true;
    }

    closeDropdown() {
        this.optionsList.classList.add('hidden');
        this.isOpen = false;
        this.selectedIndex = -1;
        this.updateSelectedOption();

        // Return the dropdown to its original parent
        this.unportalDropdown();
    }

    portalDropdown() {
        if (this.isPortaled) return;

        // Calculate position relative to viewport
        const rect = this.input.getBoundingClientRect();

        // Check if we're inside a dialog (modal) - dialogs use the browser's top layer
        const dialog = this.container.closest('dialog');
        if (dialog) {
            // If inside a dialog, append to the dialog element itself (not modal-box)
            // and use absolute positioning relative to viewport
            dialog.appendChild(this.optionsList);
        } else {
            // Otherwise append to body
            document.body.appendChild(this.optionsList);
        }
        this.isPortaled = true;
        this.portalTarget = dialog || document.body;

        // Apply fixed positioning
        this.optionsList.style.position = 'fixed';
        this.optionsList.style.top = `${rect.bottom + 4}px`; // 4px gap (mt-1 equivalent)
        this.optionsList.style.left = `${rect.left}px`;
        this.optionsList.style.width = `${rect.width}px`;
        this.optionsList.style.zIndex = '99999';

        // Store reference for repositioning on scroll/resize
        this.updatePositionBound = this.updateDropdownPosition.bind(this);
        window.addEventListener('scroll', this.updatePositionBound, true);
        window.addEventListener('resize', this.updatePositionBound);
    }

    unportalDropdown() {
        if (!this.isPortaled) return;

        // Remove event listeners
        if (this.updatePositionBound) {
            window.removeEventListener('scroll', this.updatePositionBound, true);
            window.removeEventListener('resize', this.updatePositionBound);
        }

        // Return to original parent
        this.originalParent.appendChild(this.optionsList);
        this.isPortaled = false;
        this.portalTarget = null;

        // Reset styles
        this.optionsList.style.position = '';
        this.optionsList.style.top = '';
        this.optionsList.style.left = '';
        this.optionsList.style.width = '';
        this.optionsList.style.zIndex = '';
    }

    updateDropdownPosition() {
        if (!this.isPortaled || !this.isOpen) return;

        const rect = this.input.getBoundingClientRect();

        this.optionsList.style.top = `${rect.bottom + 4}px`;
        this.optionsList.style.left = `${rect.left}px`;
        this.optionsList.style.width = `${rect.width}px`;
    }
}

function initializeComboboxAutocomplete() {
    const comboboxes = document.querySelectorAll('[data-combobox-autocomplete]');
    comboboxes.forEach(combobox => {
        new ComboboxAutocomplete(combobox);
    });
}

// Combobox Multi-Select Component
class ComboboxMultiSelect {
    constructor(container) {
        this.container = container;
        this.name = container.dataset.name;
        this.max = parseInt(container.dataset.max) || Infinity;

        // DOM elements
        this.toggle = container.querySelector('[data-multi-toggle]');
        this.chevron = container.querySelector('[data-chevron]');
        this.placeholder = container.querySelector('[data-placeholder]');
        this.optionsList = container.querySelector('[data-options-list]');
        this.badgesContainer = container.querySelector('[data-badges-container]');
        this.hiddenInputsContainer = container.querySelector('[data-hidden-inputs]');
        this.dropdownArea = container.querySelector('[data-dropdown-area]');

        // For autocomplete version
        this.input = container.querySelector('[data-multi-input]');
        this.isAutocomplete = !!this.input;

        // State
        this.selectedValues = new Map(); // value -> text
        this.allOptions = [];
        this.isOpen = false;
        this.selectedIndex = -1;

        // Badge styling from data attributes
        this.badgeVariant = container.dataset.badgeVariant || 'neutral';
        this.badgeSize = container.dataset.badgeSize || 'sm';

        // Portal state - move dropdown to body to escape modal overflow
        this.isPortaled = false;
        this.originalParent = this.optionsList.parentElement;

        this.init();
    }

    init() {
        // Store all options data
        this.allOptions = Array.from(this.optionsList.querySelectorAll('li[data-value]')).map(option => ({
            element: option,
            value: option.dataset.value,
            text: option.dataset.text,
            textLower: option.dataset.text.toLowerCase()
        }));

        // Initialize selected values from existing hidden inputs (skip empty values)
        const existingInputs = this.hiddenInputsContainer.querySelectorAll('input[type="hidden"]');
        existingInputs.forEach(input => {
            if (input.value && input.value.trim() !== '') {
                const option = this.allOptions.find(opt => opt.value === input.value);
                if (option) {
                    this.selectedValues.set(option.value, option.text);
                }
            }
        });

        this.bindEvents();
        this.updateBadges();
        this.updateHiddenInputs();
        this.updateOptionsState();
        this.updatePlaceholder();

        // Clear any pre-filled value in autocomplete input (value attr might leak from template)
        if (this.input) {
            this.input.value = '';
        }
    }

    bindEvents() {
        // Toggle dropdown
        const triggerElement = this.isAutocomplete ? this.input : this.toggle;

        if (this.toggle) {
            this.toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleDropdown();
            });
        }

        if (this.input) {
            this.input.addEventListener('focus', () => {
                this.openDropdown();
                this.showAllOptions();
            });

            this.input.addEventListener('input', () => {
                this.filterOptions(this.input.value.toLowerCase());
                this.selectedIndex = -1;
                this.updateSelectedOption();
            });
        }

        // Keyboard navigation
        const keyboardTarget = this.input || this.toggle;
        if (keyboardTarget) {
            keyboardTarget.addEventListener('keydown', (e) => this.handleKeydown(e));
        }

        // Option clicks (event delegation)
        this.optionsList.addEventListener('click', (e) => {
            const option = e.target.closest('li[data-value]');
            if (option) {
                this.toggleSelection(option.dataset.value, option.dataset.text);
            }
        });

        // Badge removal (event delegation)
        this.badgesContainer.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-remove-badge]');
            if (removeBtn) {
                const badge = removeBtn.closest('[data-badge-value]');
                if (badge) {
                    this.removeSelection(badge.dataset.badgeValue);
                }
            }
        });

        // Close on outside click (check dropdown area and the portaled options list)
        document.addEventListener('click', (e) => {
            if (!this.dropdownArea.contains(e.target) && !this.optionsList.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    handleKeydown(e) {
        const visibleOptions = this.optionsList.querySelectorAll('li[data-value]:not(.hidden)');

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!this.isOpen) {
                    this.openDropdown();
                } else {
                    this.selectedIndex = Math.min(this.selectedIndex + 1, visibleOptions.length - 1);
                    this.updateSelectedOption();
                    this.scrollToSelected();
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelectedOption();
                this.scrollToSelected();
                break;

            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && visibleOptions[this.selectedIndex]) {
                    // Select the highlighted option
                    const option = visibleOptions[this.selectedIndex];
                    this.toggleSelection(option.dataset.value, option.dataset.text);
                } else if (visibleOptions.length === 1) {
                    // Auto-select if only one option visible
                    const option = visibleOptions[0];
                    this.toggleSelection(option.dataset.value, option.dataset.text);
                }
                break;

            case 'Escape':
                this.closeDropdown();
                break;

            case 'Backspace':
                // Remove last badge if input is empty (autocomplete only)
                if (this.isAutocomplete && this.input.value === '' && this.selectedValues.size > 0) {
                    const lastValue = Array.from(this.selectedValues.keys()).pop();
                    if (lastValue) {
                        this.removeSelection(lastValue);
                    }
                }
                break;
        }
    }

    toggleSelection(value, text) {
        if (this.selectedValues.has(value)) {
            this.removeSelection(value);
        } else {
            this.addSelection(value, text);
        }
    }

    addSelection(value, text) {
        // Check max limit
        if (this.selectedValues.size >= this.max) {
            return;
        }

        this.selectedValues.set(value, text);
        this.updateBadges();
        this.updateHiddenInputs();
        this.updateOptionsState();
        this.updatePlaceholder();

        // Clear autocomplete input
        if (this.input) {
            this.input.value = '';
            this.showAllOptions();
        }

        // Emit change event
        this.emitChange();
    }

    removeSelection(value) {
        this.selectedValues.delete(value);
        this.updateBadges();
        this.updateHiddenInputs();
        this.updateOptionsState();
        this.updatePlaceholder();

        // Emit change event
        this.emitChange();
    }

    updateBadges() {
        // Clear existing badges
        this.badgesContainer.innerHTML = '';

        // Create badges for each selected value
        this.selectedValues.forEach((text, value) => {
            const badge = document.createElement('span');
            badge.className = `badge badge-${this.badgeVariant} ${this.badgeSize !== 'md' ? 'badge-' + this.badgeSize : ''} gap-1`;
            badge.dataset.badgeValue = value;

            const iconSize = this.getIconSize();
            badge.innerHTML = `
                ${text}
                <button type="button" class="hover:text-error cursor-pointer" data-remove-badge>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${iconSize}"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            `;

            this.badgesContainer.appendChild(badge);
        });
    }

    getIconSize() {
        switch(this.badgeSize) {
            case 'xs': return 'size-2.5';
            case 'sm': return 'size-3';
            case 'lg': return 'size-4';
            default: return 'size-3.5';
        }
    }

    updateHiddenInputs() {
        // Clear existing inputs
        this.hiddenInputsContainer.innerHTML = '';

        // Create hidden input for each selected value (skip empty values)
        this.selectedValues.forEach((text, value) => {
            if (value && value.trim() !== '') {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = this.name;
                input.value = value;
                this.hiddenInputsContainer.appendChild(input);
            }
        });
    }

    updateOptionsState() {
        this.allOptions.forEach(option => {
            const checkIcon = option.element.querySelector('[data-check-icon]');
            if (this.selectedValues.has(option.value)) {
                option.element.classList.add('bg-base-200');
                if (checkIcon) {
                    checkIcon.classList.remove('opacity-0');
                    checkIcon.classList.add('opacity-100');
                }
            } else {
                option.element.classList.remove('bg-base-200');
                if (checkIcon) {
                    checkIcon.classList.add('opacity-0');
                    checkIcon.classList.remove('opacity-100');
                }
            }
        });
    }

    updatePlaceholder() {
        // For non-autocomplete version (has a placeholder span)
        if (this.placeholder) {
            if (this.selectedValues.size > 0) {
                this.placeholder.textContent = `${this.selectedValues.size} selected`;
                this.placeholder.classList.remove('text-base-content/50');
                this.placeholder.classList.add('text-base-content');
            } else {
                this.placeholder.textContent = this.container.dataset.placeholder || 'Select options...';
                this.placeholder.classList.add('text-base-content/50');
                this.placeholder.classList.remove('text-base-content');
            }
        }

        // For autocomplete version (update input placeholder attribute)
        if (this.input) {
            const defaultPlaceholder = this.container.dataset.placeholder || 'Type to search...';
            if (this.selectedValues.size > 0) {
                this.input.placeholder = `${this.selectedValues.size} selected - ${defaultPlaceholder}`;
            } else {
                this.input.placeholder = defaultPlaceholder;
            }
        }
    }

    updateSelectedOption() {
        const visibleOptions = this.optionsList.querySelectorAll('li[data-value]:not(.hidden)');

        // Remove highlight from all options
        this.allOptions.forEach(option => {
            option.element.classList.remove('bg-primary', 'text-primary-content');
        });

        // Add highlight to selected option
        if (this.selectedIndex >= 0 && this.selectedIndex < visibleOptions.length) {
            const selected = visibleOptions[this.selectedIndex];
            selected.classList.add('bg-primary', 'text-primary-content');
        }
    }

    scrollToSelected() {
        const visibleOptions = this.optionsList.querySelectorAll('li[data-value]:not(.hidden)');
        if (this.selectedIndex >= 0 && this.selectedIndex < visibleOptions.length) {
            visibleOptions[this.selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    filterOptions(query) {
        if (!query) {
            this.showAllOptions();
            return;
        }

        let hasVisible = false;
        this.allOptions.forEach(option => {
            if (option.textLower.includes(query)) {
                option.element.classList.remove('hidden');
                hasVisible = true;
            } else {
                option.element.classList.add('hidden');
            }
        });

        // Show/hide no results message
        let noResults = this.optionsList.querySelector('.no-results');
        if (!hasVisible) {
            if (!noResults) {
                noResults = document.createElement('li');
                noResults.className = 'px-3 py-2 text-base-content/50 no-results';
                noResults.textContent = 'No results found';
                this.optionsList.appendChild(noResults);
            }
        } else if (noResults) {
            noResults.remove();
        }
    }

    showAllOptions() {
        this.allOptions.forEach(option => {
            option.element.classList.remove('hidden');
        });

        const noResults = this.optionsList.querySelector('.no-results');
        if (noResults) {
            noResults.remove();
        }
    }

    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        // Portal the dropdown to body to escape modal overflow constraints
        this.portalDropdown();

        this.optionsList.classList.remove('hidden');
        this.isOpen = true;
        if (this.toggle) {
            this.toggle.setAttribute('aria-expanded', 'true');
        }
        if (this.chevron) {
            this.chevron.classList.add('rotate-180');
        }
    }

    closeDropdown() {
        this.optionsList.classList.add('hidden');
        this.isOpen = false;
        this.selectedIndex = -1;
        this.updateSelectedOption();
        if (this.toggle) {
            this.toggle.setAttribute('aria-expanded', 'false');
        }
        if (this.chevron) {
            this.chevron.classList.remove('rotate-180');
        }

        // Return the dropdown to its original parent
        this.unportalDropdown();
    }

    portalDropdown() {
        if (this.isPortaled) return;

        // Get the reference element (input or toggle)
        const referenceElement = this.input || this.toggle;
        if (!referenceElement) return;

        // Calculate position relative to viewport
        const rect = referenceElement.getBoundingClientRect();

        // Check if we're inside a dialog (modal) - dialogs use the browser's top layer
        const dialog = this.container.closest('dialog');
        if (dialog) {
            // If inside a dialog, append to the dialog element itself (not modal-box)
            dialog.appendChild(this.optionsList);
        } else {
            // Otherwise append to body
            document.body.appendChild(this.optionsList);
        }
        this.isPortaled = true;
        this.portalTarget = dialog || document.body;

        // Apply fixed positioning
        this.optionsList.style.position = 'fixed';
        this.optionsList.style.top = `${rect.bottom + 4}px`; // 4px gap (mt-1 equivalent)
        this.optionsList.style.left = `${rect.left}px`;
        this.optionsList.style.width = `${rect.width}px`;
        this.optionsList.style.zIndex = '99999';

        // Store reference for repositioning on scroll/resize
        this.updatePositionBound = this.updateDropdownPosition.bind(this);
        window.addEventListener('scroll', this.updatePositionBound, true);
        window.addEventListener('resize', this.updatePositionBound);
    }

    unportalDropdown() {
        if (!this.isPortaled) return;

        // Remove event listeners
        if (this.updatePositionBound) {
            window.removeEventListener('scroll', this.updatePositionBound, true);
            window.removeEventListener('resize', this.updatePositionBound);
        }

        // Return to original parent
        this.originalParent.appendChild(this.optionsList);
        this.isPortaled = false;
        this.portalTarget = null;

        // Reset styles
        this.optionsList.style.position = '';
        this.optionsList.style.top = '';
        this.optionsList.style.left = '';
        this.optionsList.style.width = '';
        this.optionsList.style.zIndex = '';
    }

    updateDropdownPosition() {
        if (!this.isPortaled || !this.isOpen) return;

        const referenceElement = this.input || this.toggle;
        if (!referenceElement) return;

        const rect = referenceElement.getBoundingClientRect();

        this.optionsList.style.top = `${rect.bottom + 4}px`;
        this.optionsList.style.left = `${rect.left}px`;
        this.optionsList.style.width = `${rect.width}px`;
    }

    emitChange() {
        const event = new CustomEvent('combobox-multi-change', {
            detail: {
                values: Array.from(this.selectedValues.keys()),
                items: Array.from(this.selectedValues.entries()).map(([value, text]) => ({ value, text }))
            }
        });
        this.container.dispatchEvent(event);
    }

    // Public API
    getValues() {
        return Array.from(this.selectedValues.keys());
    }

    setValues(values) {
        this.selectedValues.clear();
        values.forEach(value => {
            const option = this.allOptions.find(opt => opt.value === value);
            if (option) {
                this.selectedValues.set(option.value, option.text);
            }
        });
        this.updateBadges();
        this.updateHiddenInputs();
        this.updateOptionsState();
        this.updatePlaceholder();
    }

    clear() {
        this.selectedValues.clear();
        this.updateBadges();
        this.updateHiddenInputs();
        this.updateOptionsState();
        this.updatePlaceholder();
        this.emitChange();
    }
}

function initializeComboboxMultiSelect() {
    const comboboxes = document.querySelectorAll('[data-combobox-multi]');
    comboboxes.forEach(combobox => {
        // Skip if already initialized
        if (combobox.comboboxMultiInstance) return;
        combobox.comboboxMultiInstance = new ComboboxMultiSelect(combobox);
    });
}

// Initialize all components
function initializeComponents() {
    initializeFilters();
    initializeTabs();
    initializeRangeSliders();
    initializeComboboxAutocomplete();
    initializeComboboxMultiSelect();
}

document.addEventListener('DOMContentLoaded', initializeComponents);

// Setup theme controllers
function setupThemeControllers() {
    const savedTheme = localStorage.getItem('theme') || 'default';
    
    // Set the correct radio button as checked
    const themeController = document.querySelector(`input[name="theme-buttons"][value="${savedTheme}"]`);
    if (themeController) {
        themeController.checked = true;
    }
    
    // Listen for theme changes from DaisyUI theme controllers
    const themeControllers = document.querySelectorAll('input[name="theme-buttons"]');
    themeControllers.forEach(controller => {
        // Remove existing listeners to avoid duplicates
        controller.removeEventListener('change', handleThemeChange);
        controller.addEventListener('change', handleThemeChange);
    });
}

function handleThemeChange(e) {
    if (e.target.checked) {
        const theme = e.target.value;
        setTheme(theme);
    }
}

