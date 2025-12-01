// Tungsten UI - tg-confirm Extension
// Replaces hx-confirm with a styled DaisyUI modal
// Requires: HTMX loaded before this script

(function() {
    'use strict';

    // Modal element references
    let modal, titleEl, messageEl, cancelBtn, confirmBtn;
    let pendingEvent = null;

    /**
     * Initialize modal references and event listeners
     * @returns {boolean} True if initialization successful
     */
    function initModal() {
        modal = document.getElementById('tg-confirm-modal');
        titleEl = document.getElementById('tg-confirm-title');
        messageEl = document.getElementById('tg-confirm-message');
        cancelBtn = document.getElementById('tg-confirm-cancel');
        confirmBtn = document.getElementById('tg-confirm-ok');

        if (!modal) {
            console.error('tg-confirm: Modal #tg-confirm-modal not found. Include <c-confirm-modal /> in your base template.');
            return false;
        }

        // Cancel button handler
        cancelBtn.addEventListener('click', () => {
            modal.close();
            pendingEvent = null;
        });

        // Confirm button handler
        confirmBtn.addEventListener('click', () => {
            modal.close();
            if (pendingEvent) {
                pendingEvent.detail.issueRequest(true);
                pendingEvent = null;
            }
        });

        // Handle backdrop click and Escape key (both trigger 'close' event)
        modal.addEventListener('close', () => {
            pendingEvent = null;
        });

        return true;
    }

    /**
     * Handle htmx:confirm event for elements with tg-confirm attribute
     */
    function handleConfirm(evt) {
        const elt = evt.detail.elt;
        const message = elt.getAttribute('tg-confirm');

        // No tg-confirm attribute, let HTMX handle normally
        if (!message) return;

        // Initialize modal if not already done
        if (!modal && !initModal()) return;

        // Prevent HTMX from continuing
        evt.preventDefault();

        // Get configuration from attributes
        const title = elt.getAttribute('tg-confirm-title') || 'Confirmation';
        const variant = elt.getAttribute('tg-confirm-variant') || 'primary';
        const confirmText = elt.getAttribute('tg-confirm-confirm-text') || 'Confirmer';
        const cancelText = elt.getAttribute('tg-confirm-cancel-text') || 'Annuler';

        // Configure modal content
        titleEl.textContent = title;
        messageEl.textContent = message;
        cancelBtn.textContent = cancelText;
        confirmBtn.textContent = confirmText;

        // Apply variant to confirm button
        confirmBtn.className = 'btn btn-' + variant;

        // Store pending event for later resolution
        pendingEvent = evt;

        // Show modal
        modal.showModal();
    }

    // Register event listener
    document.addEventListener('htmx:confirm', handleConfirm);

    // Initialize modal on DOMContentLoaded (optional, will also init lazily)
    document.addEventListener('DOMContentLoaded', initModal);

    // Re-initialize after HTMX swaps (in case modal is swapped in)
    document.addEventListener('htmx:afterSwap', function() {
        // Reset modal reference to force re-initialization
        if (!document.getElementById('tg-confirm-modal')) {
            modal = null;
        }
    });
})();
