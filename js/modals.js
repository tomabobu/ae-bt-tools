/**
 * Global Modal System
 * Used by all modules to display consistent modals
 */
var ModalSystem = (function () {
    let modalContainer = null;
    let activeModal = null;

    /**
     * Initialize the modal container
     */
    function init() {
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'global-modal-container';
            document.body.appendChild(modalContainer);
        }
    }

    /**
     * Create and show a modal
     * @param {Object} config - Modal configuration
     */
    function show(config) {
        init();

        // Close any existing modal
        if (activeModal) {
            close();
        }

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-dialog';

        // Create modal content based on type
        let content = '';
        switch (config.type) {
            case 'confirm':
                content = createConfirmModal(config);
                break;
            case 'prompt':
                content = createPromptModal(config);
                break;
            case 'alert':
                content = createAlertModal(config);
                break;
            case 'custom':
                content = config.content || '';
                break;
            default:
                content = createAlertModal(config);
        }

        modal.innerHTML = content;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        activeModal = overlay;

        // Setup event listeners based on type
        setupModalEventListeners(config, overlay);

        // Show with animation
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);

        // Focus on input if prompt
        if (config.type === 'prompt') {
            const input = modal.querySelector('input');
            if (input) {
                input.focus();
                input.select();
            }
        }

        return overlay;
    }

    /**
     * Create confirm modal content
     */
    function createConfirmModal(config) {
        return `
            <div class="modal-header">
                <h3>${config.title || 'Confirm'}</h3>
            </div>
            <div class="modal-body">
                <p>${config.message || 'Are you sure?'}</p>
            </div>
            <div class="modal-footer">
                <button class="modal-btn modal-btn-secondary" data-action="cancel">
                    ${config.cancelText || 'Cancel'}
                </button>
                <button class="modal-btn modal-btn-primary" data-action="confirm">
                    ${config.confirmText || 'OK'}
                </button>
            </div>
        `;
    }

    /**
     * Create prompt modal content
     */
    function createPromptModal(config) {
        const inputType = config.inputType || 'text';
        const placeholder = config.placeholder || '';
        const defaultValue = config.defaultValue || '';

        return `
            <div class="modal-header">
                <h3>${config.title || 'Input'}</h3>
            </div>
            <div class="modal-body">
                ${config.message ? `<p>${config.message}</p>` : ''}
                <input 
                    type="${inputType}" 
                    class="modal-input" 
                    placeholder="${placeholder}" 
                    value="${defaultValue}"
                    ${config.pattern ? `pattern="${config.pattern}"` : ''}
                >
                ${config.helperText ? `<small class="modal-helper">${config.helperText}</small>` : ''}
            </div>
            <div class="modal-footer">
                <button class="modal-btn modal-btn-secondary" data-action="cancel">
                    ${config.cancelText || 'Cancel'}
                </button>
                <button class="modal-btn modal-btn-primary" data-action="confirm">
                    ${config.confirmText || 'OK'}
                </button>
            </div>
        `;
    }

    /**
     * Create alert modal content
     */
    function createAlertModal(config) {
        return `
            <div class="modal-header">
                <h3>${config.title || 'Alert'}</h3>
            </div>
            <div class="modal-body">
                <p>${config.message || ''}</p>
            </div>
            <div class="modal-footer">
                <button class="modal-btn modal-btn-primary" data-action="confirm">
                    ${config.confirmText || 'OK'}
                </button>
            </div>
        `;
    }

    /**
     * Setup event listeners for modal buttons
     */
    function setupModalEventListeners(config, overlay) {
        const modal = overlay.querySelector('.modal-dialog');
        const confirmBtn = modal.querySelector('[data-action="confirm"]');
        const cancelBtn = modal.querySelector('[data-action="cancel"]');
        const input = modal.querySelector('.modal-input');

        // Confirm button
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (config.type === 'prompt') {
                    const value = input ? input.value : null;

                    // Validate if validator provided
                    if (config.validator && typeof config.validator === 'function') {
                        const validation = config.validator(value);
                        if (validation !== true) {
                            NotificationSystem.warning(validation || 'Invalid input');
                            return;
                        }
                    }

                    if (config.onConfirm) {
                        config.onConfirm(value);
                    }
                } else {
                    if (config.onConfirm) {
                        config.onConfirm();
                    }
                }
                close();
            });
        }

        // Cancel button
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (config.onCancel) {
                    config.onCancel();
                }
                close();
            });
        }

        // Enter key for confirm
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    confirmBtn.click();
                }
            });
        }

        // ESC key to cancel
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                if (cancelBtn) {
                    cancelBtn.click();
                } else {
                    close();
                }
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Click outside to close (optional)
        if (config.closeOnOverlayClick !== false) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    if (cancelBtn) {
                        cancelBtn.click();
                    } else {
                        close();
                    }
                }
            });
        }
    }

    /**
     * Close the active modal
     */
    function close() {
        if (activeModal) {
            activeModal.classList.remove('show');
            setTimeout(() => {
                if (activeModal && activeModal.parentNode) {
                    activeModal.parentNode.removeChild(activeModal);
                }
                activeModal = null;
            }, 300);
        }
    }

    /**
     * Show a confirm dialog (replaces window.confirm)
     * @param {string} message - The confirmation message
     * @param {Object} options - Optional configuration
     * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
     */
    function confirm(message, options = {}) {
        return new Promise((resolve) => {
            show({
                type: 'confirm',
                title: options.title || 'Confirm',
                message: message,
                confirmText: options.confirmText || 'OK',
                cancelText: options.cancelText || 'Cancel',
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            });
        });
    }

    /**
     * Show a prompt dialog (replaces window.prompt)
     * @param {string} message - The prompt message
     * @param {string} defaultValue - Default input value
     * @param {Object} options - Optional configuration
     * @returns {Promise<string|null>} - Resolves to input value or null if cancelled
     */
    function prompt(message, defaultValue = '', options = {}) {
        return new Promise((resolve) => {
            show({
                type: 'prompt',
                title: options.title || 'Input',
                message: message,
                defaultValue: defaultValue,
                placeholder: options.placeholder || '',
                inputType: options.inputType || 'text',
                pattern: options.pattern,
                helperText: options.helperText,
                validator: options.validator,
                confirmText: options.confirmText || 'OK',
                cancelText: options.cancelText || 'Cancel',
                onConfirm: (value) => resolve(value),
                onCancel: () => resolve(null)
            });
        });
    }

    /**
     * Show an alert dialog (replaces window.alert)
     * @param {string} message - The alert message
     * @param {Object} options - Optional configuration
     * @returns {Promise<void>}
     */
    function alert(message, options = {}) {
        return new Promise((resolve) => {
            show({
                type: 'alert',
                title: options.title || 'Alert',
                message: message,
                confirmText: options.confirmText || 'OK',
                onConfirm: () => resolve()
            });
        });
    }

    // Public API
    return {
        init: init,
        show: show,
        close: close,
        confirm: confirm,
        prompt: prompt,
        alert: alert
    };
})();

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        ModalSystem.init();
    });
} else {
    ModalSystem.init();
}


// ===== EXAMPLES OF OTHER MODAL TYPES YOU CAN USE =====

// // Simple confirm dialog
// ModalSystem.confirm('Are you sure?').then((result) => {
//     if (result) {
//         console.log('User confirmed');
//     }
// });

// // Confirm with custom text
// ModalSystem.confirm('Delete this item?', {
//     title: 'Delete Confirmation',
//     confirmText: 'Delete',
//     cancelText: 'Keep'
// }).then((result) => {
//     // handle result
// });

// // Simple prompt
// ModalSystem.prompt('Enter a name:').then((value) => {
//     if (value !== null) {
//         console.log('User entered:', value);
//     }
// });

// // Prompt with validation
// ModalSystem.prompt('Enter an email:', '', {
//     title: 'Email Input',
//     placeholder: 'user@example.com',
//     inputType: 'email',
//     helperText: 'We will never share your email',
//     validator: (value) => {
//         if (!value) return 'Email is required';
//         if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
//         return true;
//     }
// }).then((email) => {
//     if (email) {
//         console.log('Valid email:', email);
//     }
// });

// // Simple alert
// ModalSystem.alert('Operation completed!');

// // Alert with custom title
// ModalSystem.alert('File saved successfully!', {
//     title: 'Success',
//     confirmText: 'Great!'
// });

// // Custom modal with HTML content
// ModalSystem.show({
//     type: 'custom',
//     content: `
//         <div class="modal-header">
//             <h3>Custom Content</h3>
//         </div>
//         <div class="modal-body">
//             <p>Any custom HTML here</p>
//             <div>Your custom UI elements</div>
//         </div>
//         <div class="modal-footer">
//             <button class="modal-btn modal-btn-primary" data-action="confirm">Close</button>
//         </div>
//     `,
//     onConfirm: () => {
//         console.log('Custom modal closed');
//     }
// });