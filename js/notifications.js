/**
 * Global Notification System
 * Used by all modules to display consistent notifications
 */
var NotificationSystem = (function () {
    let notificationContainer = null;

    /**
     * Initialize the notification container
     */
    function init() {
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
    }

    /**
     * Display a notification message
     * @param {string} message - The message to display
     * @param {string} type - The type of notification ('info', 'success', 'warning', 'error')
     * @param {number} duration - How long to show the notification in milliseconds (default: 3000)
     */
    function show(message, type = 'info', duration = 5000) {
        // Initialize container if it doesn't exist
        if (!notificationContainer) {
            init();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add to container
        notificationContainer.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remove after duration
        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('fade-out');

            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    /**
     * Show an info notification
     */
    function info(message, duration) {
        show(message, 'info', duration);
    }

    /**
     * Show a success notification
     */
    function success(message, duration) {
        show(message, 'success', duration);
    }

    /**
     * Show a warning notification
     */
    function warning(message, duration) {
        show(message, 'warning', duration);
    }

    /**
     * Show an error notification
     */
    function error(message, duration) {
        show(message, 'error', duration);
    }

    // Public API
    return {
        init: init,
        show: show,
        info: info,
        success: success,
        warning: warning,
        error: error
    };
})();

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        NotificationSystem.init();
    });
} else {
    NotificationSystem.init();
}