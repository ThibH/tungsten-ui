// Tungsten UI - HTMX Event Handlers
// This file contains all HTMX-specific functionality
// Load this file only when using HTMX with Tungsten UI

// =============================================================================
// HTMX Configuration
// =============================================================================

// Add CSRF token automatically to HTMX requests
document.addEventListener('htmx:configRequest', (event) => {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfToken) {
        event.detail.headers['X-CSRFToken'] = csrfToken.value;
    }
});

// =============================================================================
// HTMX Trigger Event Handlers
// =============================================================================

// Handle modalClose trigger from server
// Usage in Django: return ModalClose("myModal") or ModalClose("myModal", reset_form=True)
document.body.addEventListener('modalClose', function(event) {
    const modalId = event.detail.id;
    const resetForm = event.detail.resetForm;
    if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Reset form if requested
            if (resetForm) {
                const form = modal.querySelector('form');
                if (form) {
                    form.reset();
                }
            }
            // Close modal
            if (typeof modal.close === 'function') {
                modal.close();
            }
        }
    }
});

// =============================================================================
// HTMX Lifecycle Hooks
// =============================================================================

// Reinitialize components after HTMX swap
document.addEventListener('htmx:afterSwap', function(event) {
    // Wait for DOM to be fully updated
    setTimeout(() => {
        if (typeof initializeComponents === 'function') {
            initializeComponents();
        }
        if (typeof setupThemeControllers === 'function') {
            setupThemeControllers();
        }
    }, 100);
});
