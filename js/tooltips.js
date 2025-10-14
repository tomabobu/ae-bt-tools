/**
 * Global Tooltip System
 * Used by all modules to display consistent tooltips
 */
var TooltipSystem = (function () {
    let activeTooltip = null;
    let showTimeout = null;
    let currentTarget = null;

    /**
     * Initialize the tooltip system
     */
    function init() {
        // Set up event delegation for all elements with tooltip-message attribute
        document.addEventListener('mouseenter', handleMouseEnter, true);
        document.addEventListener('mouseleave', handleMouseLeave, true);
        document.addEventListener('mousemove', handleMouseMove, true);
    }

    /**
 * Handle mouse enter on elements with tooltip
 */
    function handleMouseEnter(e) {
        const target = findTooltipTarget(e.target);
        if (!target) return;

        // If we're already showing tooltip for this target, don't restart
        if (currentTarget === target) {
            return;
        }

        currentTarget = target;
        const message = target.getAttribute('tooltip-message');
        const delay = parseInt(target.getAttribute('tooltip-delay')) || 0;

        // Clear any existing timeout
        if (showTimeout) {
            clearTimeout(showTimeout);
        }

        // Set timeout to show tooltip
        showTimeout = setTimeout(() => {
            showTooltip(message, target);
        }, delay);
    }

    /**
    * Handle mouse leave
    */
    function handleMouseLeave(e) {
        const target = findTooltipTarget(e.target);
        if (!target) return;

        // Only hide if we're actually leaving the tooltip target element
        // Check if the related target (where mouse is going) is still within the tooltip target
        const relatedTarget = e.relatedTarget;
        if (relatedTarget && target.contains(relatedTarget)) {
            // Mouse is still within the tooltip target (moved to a child element)
            return;
        }

        // Clear timeout if mouse leaves before tooltip shows
        if (showTimeout) {
            clearTimeout(showTimeout);
            showTimeout = null;
        }

        // Hide tooltip
        hideTooltip();
        currentTarget = null;
    }

    /**
     * Handle mouse move to update tooltip position
     */
    function handleMouseMove(e) {
        if (!activeTooltip || !currentTarget) return;

        // Check if mouse is still over the target or tooltip
        const target = findTooltipTarget(e.target);
        if (target !== currentTarget) {
            hideTooltip();
            currentTarget = null;
        }
    }

    /**
     * Find closest element with tooltip-message attribute (polyfill for closest)
     */
    function findTooltipTarget(element) {
        while (element && element !== document) {
            if (element.getAttribute && element.getAttribute('tooltip-message')) {
                return element;
            }
            element = element.parentElement;
        }
        return null;
    }




    /**
    * Show tooltip
    */
    function showTooltip(message, target) {
        // Remove any existing tooltip immediately (don't wait for animation)
        if (activeTooltip && activeTooltip.parentNode) {
            activeTooltip.parentNode.removeChild(activeTooltip);
            activeTooltip = null;
        }

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'global-tooltip';
        tooltip.textContent = message;
        document.body.appendChild(tooltip);

        activeTooltip = tooltip;

        // Position tooltip
        positionTooltip(tooltip, target);

        // Trigger animation
        setTimeout(() => {
            if (tooltip === activeTooltip) {
                tooltip.classList.add('show');
            }
        }, 10);
    }

    /**
 * Position tooltip relative to target element
 */
    function positionTooltip(tooltip, target) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        // Calculate center of target element
        const targetCenterX = targetRect.left + (targetRect.width / 2);

        // Check available space above and below
        const spaceAbove = targetRect.top;
        const spaceBelow = window.innerHeight - targetRect.bottom;
        const tooltipHeight = tooltipRect.height;

        // Prefer positioning above if there's enough space
        let top;
        let positionAbove = false;

        if (spaceAbove >= tooltipHeight + 8) {
            // Enough space above - position above (preferred)
            top = targetRect.top - tooltipHeight - 8;
            positionAbove = true;
        } else if (spaceBelow >= tooltipHeight + 8) {
            // Not enough space above but enough below - position below
            top = targetRect.bottom + 8;
            positionAbove = false;
        } else {
            // Not enough space in either direction - use the side with more space
            if (spaceAbove > spaceBelow) {
                top = targetRect.top - tooltipHeight - 8;
                positionAbove = true;
            } else {
                top = targetRect.bottom + 8;
                positionAbove = false;
            }
        }

        // Horizontal positioning - centered on target
        let left = targetCenterX - (tooltipRect.width / 2);

        // Check if tooltip goes off right edge
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }

        // Check if tooltip goes off left edge
        if (left < 10) {
            left = 10;
        }

        // Calculate arrow position relative to tooltip
        const arrowOffset = targetCenterX - left;
        tooltip.style.setProperty('--arrow-offset', arrowOffset + 'px');

        // Add class if positioned above
        if (positionAbove) {
            tooltip.classList.add('tooltip-above');
        }

        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    }

    /**
     * Hide tooltip
     */
    function hideTooltip() {
        if (!activeTooltip) return;

        const tooltipToRemove = activeTooltip;
        activeTooltip = null;

        tooltipToRemove.classList.remove('show');

        // Remove after animation completes
        setTimeout(() => {
            if (tooltipToRemove && tooltipToRemove.parentNode) {
                tooltipToRemove.parentNode.removeChild(tooltipToRemove);
            }
        }, 200);
    }

    /**
     * Manually show a tooltip at specific coordinates
     */
    function showAt(message, x, y, delay = 0) {
        if (showTimeout) {
            clearTimeout(showTimeout);
        }

        showTimeout = setTimeout(() => {
            hideTooltip();

            const tooltip = document.createElement('div');
            tooltip.className = 'global-tooltip';
            tooltip.textContent = message;
            document.body.appendChild(tooltip);

            activeTooltip = tooltip;

            // Position at specified coordinates
            const tooltipRect = tooltip.getBoundingClientRect();
            let finalX = x - (tooltipRect.width / 2);
            let finalY = y + 8;

            // Boundary checks
            if (finalX + tooltipRect.width > window.innerWidth - 10) {
                finalX = window.innerWidth - tooltipRect.width - 10;
            }
            if (finalX < 10) {
                finalX = 10;
            }
            if (finalY + tooltipRect.height > window.innerHeight - 10) {
                finalY = y - tooltipRect.height - 8;
                tooltip.classList.add('tooltip-above');
            }

            tooltip.style.top = finalY + 'px';
            tooltip.style.left = finalX + 'px';

            setTimeout(() => {
                tooltip.classList.add('show');
            }, 10);
        }, delay);
    }

    /**
     * Manually hide current tooltip
     */
    function hide() {
        if (showTimeout) {
            clearTimeout(showTimeout);
            showTimeout = null;
        }
        hideTooltip();
    }

    // Public API
    return {
        init: init,
        showAt: showAt,
        hide: hide
    };
})();

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        TooltipSystem.init();
    });
} else {
    TooltipSystem.init();
}