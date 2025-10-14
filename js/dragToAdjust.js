/**
 * Drag to Adjust System
 * Allows adjusting numeric input values by clicking and dragging up/down or left/right
 */
var DragToAdjustSystem = (function () {
    let isDragging = false;
    let dragStarted = false;
    let currentInput = null;
    let startX = 0;
    let startY = 0;
    let startValue = 0;
    let incrementAmount = 1;
    const dragThreshold = 5; // Pixels to move before starting drag

    /**
     * Initialize the drag to adjust system
     */
    function init() {
        document.addEventListener('mousedown', handleMouseDown, true);
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('mouseup', handleMouseUp, true);
    }

    /**
     * Handle mouse down on input fields
     */
    function handleMouseDown(e) {
        // Only handle number inputs with increment-amount attribute
        if (e.target.tagName !== 'INPUT' || e.target.type !== 'number') {
            return;
        }

        if (!e.target.hasAttribute('increment-amount')) {
            return;
        }

        const input = e.target;

        // Prepare for potential drag
        isDragging = false;
        dragStarted = false;
        currentInput = input;
        startX = e.clientX;
        startY = e.clientY;
        startValue = parseFloat(input.value) || 0;
        incrementAmount = parseFloat(input.getAttribute('increment-amount')) || 1;
    }

    /**
     * Handle mouse move during drag
     */
    function handleMouseMove(e) {
        if (!currentInput) return;

        // Check if we've moved enough to start dragging
        if (!dragStarted) {
            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);
            const totalDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (totalDelta < dragThreshold) {
                return; // Not enough movement yet
            }

            // Start drag operation
            dragStarted = true;
            isDragging = true;

            // Prevent text selection during drag
            e.preventDefault();

            // Add dragging class
            currentInput.classList.add('drag-adjusting');
            document.body.style.cursor = 'ew-resize';
            document.body.classList.add('drag-adjusting-active');

            // Blur the input to prevent editing while dragging
            currentInput.blur();
        }

        if (!isDragging) return;

        e.preventDefault();

        // Calculate value change based on mouse movement (horizontal and vertical)
        const deltaX = e.clientX - startX; // Right = positive, left = negative
        const deltaY = startY - e.clientY; // Up = positive, down = negative

        // Combine both horizontal and vertical movement
        const totalDelta = deltaX + deltaY;
        const steps = Math.round(totalDelta / 5); // Every 5 pixels = 1 step
        let newValue = startValue + (steps * incrementAmount);

        // Apply min/max constraints if they exist
        if (currentInput.hasAttribute('min')) {
            const min = parseFloat(currentInput.getAttribute('min'));
            newValue = Math.max(min, newValue);
        }
        if (currentInput.hasAttribute('max')) {
            const max = parseFloat(currentInput.getAttribute('max'));
            newValue = Math.min(max, newValue);
        }

        // Update input value
        currentInput.value = newValue;

        // Trigger change event
        currentInput.dispatchEvent(new Event('input', { bubbles: true }));
        currentInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /**
     * Handle mouse up to end drag
     */
    function handleMouseUp(e) {
        if (currentInput) {
            currentInput.classList.remove('drag-adjusting');
        }

        isDragging = false;
        dragStarted = false;
        currentInput = null;
        document.body.style.cursor = 'default';
        document.body.classList.remove('drag-adjusting-active');
    }

    // Public API
    return {
        init: init
    };
})();

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        DragToAdjustSystem.init();
    });
} else {
    DragToAdjustSystem.init();
}