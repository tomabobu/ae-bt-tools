/**
 * Cubic-Bezier Editor Widget
 * Inspired by https://cubic-bezier.com/
 */
var CubicBezierEditor = (function () {
    /**
     * Constructor for Cubic Bezier Editor
     * @param {string|Element} container - Container element or selector
     * @param {Object} options - Configuration options
     */
    function CubicBezierEditor(container, options) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = Object.assign({
            width: '100%',
            height: '100%',
            defaultValues: [0.4, 0.14, 0.3, 1],
            onChange: function () { },
            showPreview: true,
            showGrid: true
        }, options || {});

        this.values = this.options.defaultValues.slice();
        this.dragging = false;
        this.activeHandle = null;
        this.animationFrame = null;

        this.init();
    }

    /**
     * Initialize the editor
     */
    CubicBezierEditor.prototype.init = function () {
        // Create SVG canvas
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', 'cubic-bezier-canvas');
        this.svg.setAttribute('width', this.options.width);
        this.svg.setAttribute('height', this.options.height);
        this.container.appendChild(this.svg);

        // Get container dimensions
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        if (this.options.showGrid) {
            this.drawGrid();
        }

        // Create bezier curve
        this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.path.setAttribute('class', 'bezier-path');
        this.svg.appendChild(this.path);

        // Create handles
        this.handles = [
            this.createHandle(this.values[0], this.values[1], 'p1'),
            this.createHandle(this.values[2], this.values[3], 'p2')
        ];

        if (this.options.showPreview) {
            this.createPreviewDot();
        }

        this.updateCurve();

        // Set up events
        this.setupEvents();
    };

    /**
     * Draw grid lines
     */
    CubicBezierEditor.prototype.drawGrid = function () {
        var gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.setAttribute('class', 'bezier-grid-container');

        // Major axes
        var xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', '0');
        xAxis.setAttribute('y1', '100%');
        xAxis.setAttribute('x2', '100%');
        xAxis.setAttribute('y2', '100%');
        xAxis.setAttribute('class', 'bezier-axis');

        var yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', '0');
        yAxis.setAttribute('y1', '0');
        yAxis.setAttribute('x2', '0');
        yAxis.setAttribute('y2', '100%');
        yAxis.setAttribute('class', 'bezier-axis');

        gridGroup.appendChild(xAxis);
        gridGroup.appendChild(yAxis);

        // Vertical grid lines
        for (var i = 1; i < 10; i++) {
            var x = i * 10;
            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x + '%');
            line.setAttribute('y1', '0');
            line.setAttribute('x2', x + '%');
            line.setAttribute('y2', '100%');
            line.setAttribute('class', i % 5 === 0 ? 'bezier-grid-major' : 'bezier-grid');
            gridGroup.appendChild(line);
        }

        // Horizontal grid lines
        for (var j = 1; j < 10; j++) {
            var y = j * 10;
            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '0');
            line.setAttribute('y1', y + '%');
            line.setAttribute('x2', '100%');
            line.setAttribute('y2', y + '%');
            line.setAttribute('class', j % 5 === 0 ? 'bezier-grid-major' : 'bezier-grid');
            gridGroup.appendChild(line);
        }

        this.svg.appendChild(gridGroup);
    };

    /**
     * Create a draggable handle
     */
    CubicBezierEditor.prototype.createHandle = function (x, y, id) {
        var handle = document.createElement('div');
        handle.className = 'bezier-handle';
        handle.id = 'handle-' + id;
        handle.setAttribute('data-id', id);
        this.container.appendChild(handle);

        // Position the handle
        this.positionHandle(handle, x, y);

        return handle;
    };

    /**
     * Position a handle at the given coordinates
     */
    CubicBezierEditor.prototype.positionHandle = function (handle, x, y) {
        // Convert to percentage for positioning
        var xPos = x * 100;
        var yPos = (1 - y) * 100; // Invert y-axis

        handle.style.left = xPos + '%';
        handle.style.top = yPos + '%';
    };

    /**
     * Create the preview dot for animation
     */
    CubicBezierEditor.prototype.createPreviewDot = function () {
        this.previewDot = document.createElement('div');
        this.previewDot.className = 'bezier-preview';
        this.container.appendChild(this.previewDot);

        // Position initially outside view
        this.previewDot.style.left = '-10px';
        this.previewDot.style.top = '100%';
    };

    /**
     * Update the bezier curve path
     */
    CubicBezierEditor.prototype.updateCurve = function () {
        var [p1x, p1y, p2x, p2y] = this.values;

        // Draw path
        var pathStr = `M0,100 C${p1x * 100},${(1 - p1y) * 100} ${p2x * 100},${(1 - p2y) * 100} 100,0`;
        this.path.setAttribute('d', pathStr);

        // Update preview animation
        if (this.options.showPreview && this.previewDot) {
            this.animatePreview();
        }
    };

    /**
     * Animate the preview dot along the bezier path
     */
    CubicBezierEditor.prototype.animatePreview = function () {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        var [p1x, p1y, p2x, p2y] = this.values;
        var startTime = performance.now();
        var duration = 1500; // 1.5 seconds for full animation
        var self = this;

        function cubic(t) {
            // Cubic bezier formula
            return {
                x: 3 * (1 - t) * (1 - t) * t * p1x + 3 * (1 - t) * t * t * p2x + t * t * t,
                y: 3 * (1 - t) * (1 - t) * t * p1y + 3 * (1 - t) * t * t * p2y + t * t * t
            };
        }

        function animate(time) {
            var elapsed = time - startTime;
            var progress = Math.min(elapsed / duration, 1);

            if (progress < 1) {
                self.animationFrame = requestAnimationFrame(animate);
            } else {
                // Restart animation after a short pause
                setTimeout(function () {
                    self.animatePreview();
                }, 500);
            }

            var pos = cubic(progress);
            self.previewDot.style.left = (pos.x * 100) + '%';
            self.previewDot.style.top = ((1 - pos.y) * 100) + '%';
        }

        this.animationFrame = requestAnimationFrame(animate);
    };

    /**
     * Set up event listeners
     */
    CubicBezierEditor.prototype.setupEvents = function () {
        var self = this;

        // Mouse events for handles
        this.container.addEventListener('mousedown', function (e) {
            // Check if clicking on a handle
            if (e.target.classList.contains('bezier-handle')) {
                e.preventDefault();

                self.dragging = true;
                self.activeHandle = e.target;
                self.activeHandle.classList.add('active');

                // Store the handle index (0 for P1, 1 for P2)
                self.activeHandleIndex = Array.from(self.handles).indexOf(self.activeHandle);

                // Add temporary event listeners for dragging
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }
        });

        function onMouseMove(e) {
            if (!self.dragging || !self.activeHandle) return;

            // Calculate relative position in container
            var rect = self.container.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width;
            var y = 1 - (e.clientY - rect.top) / rect.height; // Invert Y-axis

            // Constrain X values based on which handle is active
            if (self.activeHandleIndex === 0) { // P1
                x = Math.max(0, Math.min(1, x));
            } else { // P2
                x = Math.max(0, Math.min(1, x));
            }

            // Constrain Y values between 0 and 1
            y = Math.max(0, Math.min(1, y));

            // Update handle position visually
            self.positionHandle(self.activeHandle, x, y);

            // Update values array
            if (self.activeHandleIndex === 0) { // P1
                self.values[0] = x;
                self.values[1] = y;
            } else { // P2
                self.values[2] = x;
                self.values[3] = y;
            }

            // Update curve
            self.updateCurve();

            // Notify of change
            if (typeof self.options.onChange === 'function') {
                self.options.onChange(self.values);
            }
        }

        function onMouseUp() {
            if (self.activeHandle) {
                self.activeHandle.classList.remove('active');
            }
            self.dragging = false;
            self.activeHandle = null;

            // Remove temporary event listeners
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        // Touch events for mobile support
        this.container.addEventListener('touchstart', function (e) {
            // Check if touching a handle
            if (e.target.classList.contains('bezier-handle')) {
                e.preventDefault();

                self.dragging = true;
                self.activeHandle = e.target;
                self.activeHandle.classList.add('active');

                // Store the handle index (0 for P1, 1 for P2)
                self.activeHandleIndex = Array.from(self.handles).indexOf(self.activeHandle);

                // Add temporary event listeners for dragging
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', onTouchEnd);
            }
        }, { passive: false });

        function onTouchMove(e) {
            if (!self.dragging || !self.activeHandle) return;
            e.preventDefault();

            // Use the first touch point
            var touch = e.touches[0];

            // Calculate relative position in container
            var rect = self.container.getBoundingClientRect();
            var x = (touch.clientX - rect.left) / rect.width;
            var y = 1 - (touch.clientY - rect.top) / rect.height; // Invert Y-axis

            // Constrain X values based on which handle is active
            if (self.activeHandleIndex === 0) { // P1
                x = Math.max(0, Math.min(1, x));
            } else { // P2
                x = Math.max(0, Math.min(1, x));
            }

            // Constrain Y values between 0 and 1
            y = Math.max(0, Math.min(1, y));

            // Update handle position visually
            self.positionHandle(self.activeHandle, x, y);

            // Update values array
            if (self.activeHandleIndex === 0) { // P1
                self.values[0] = x;
                self.values[1] = y;
            } else { // P2
                self.values[2] = x;
                self.values[3] = y;
            }

            // Update curve
            self.updateCurve();

            // Notify of change
            if (typeof self.options.onChange === 'function') {
                self.options.onChange(self.values);
            }
        }

        function onTouchEnd() {
            if (self.activeHandle) {
                self.activeHandle.classList.remove('active');
            }
            self.dragging = false;
            self.activeHandle = null;

            // Remove temporary event listeners
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        }

        // Handle window resize
        window.addEventListener('resize', function () {
            // Reposition handles based on current values
            self.handles.forEach(function (handle, index) {
                var x = self.values[index * 2];
                var y = self.values[index * 2 + 1];
                self.positionHandle(handle, x, y);
            });
        });
    };

    /**
     * Set new values for the bezier curve
     * @param {Array} values - Array of 4 values [p1x, p1y, p2x, p2y]
     */

    /**
 * Set new values for the bezier curve
 * @param {Array} values - Array of 4 values [p1x, p1y, p2x, p2y]
 */
    CubicBezierEditor.prototype.setValues = function (values) {
        if (!Array.isArray(values) || values.length !== 4) {
            console.error('Invalid values array. Must be an array of 4 numbers.');
            return;
        }

        // Validate and constrain values
        this.values = values.map(function (val, index) {
            // Convert to number
            val = parseFloat(val);

            // Handle NaN
            if (isNaN(val)) {
                return index % 2 === 0 ? 0.5 : 0.5; // Default x or y value
            }

            // Constrain to 0-1
            return Math.max(0, Math.min(1, val));
        });

        // Update handle positions
        this.handles.forEach(function (handle, index) {
            var x = this.values[index * 2];
            var y = this.values[index * 2 + 1];
            this.positionHandle(handle, x, y);
        }, this);

        // Update curve
        this.updateCurve();

        // Notify of change
        if (typeof this.options.onChange === 'function') {
            this.options.onChange(this.values);
        }
    };

    /**
     * Get the current values of the bezier curve
     * @return {Array} - Array of 4 values [p1x, p1y, p2x, p2y]
     */
    CubicBezierEditor.prototype.getValues = function () {
        return this.values.slice(); // Return a copy
    };

    /**
     * Set preset bezier curve values
     * @param {string} preset - Preset name
     */
    CubicBezierEditor.prototype.setPreset = function (preset) {
        const presets = {
            'linear': [0, 0, 1, 1],
            'ease': [0.25, 0.1, 0.25, 1],
            'ease-in': [0.42, 0, 1, 1],
            'ease-out': [0, 0, 0.58, 1],
            'ease-in-out': [0.42, 0, 0.58, 1],
            'bounce': [0.175, 0.885, 0.32, 1.275],
            'snappy': [0.1, 1.5, 0.2, 1],
            'slow-start': [0.8, 0, 0.2, 1],
            'step-end': [0, 0, 1, 0],
            'step-start': [1, 1, 1, 1]
        };

        if (presets[preset]) {
            this.setValues(presets[preset]);
        }
    };

    /**
     * Clean up resources when editor is no longer needed
     */
    CubicBezierEditor.prototype.destroy = function () {
        // Cancel any ongoing animations
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        // Remove DOM elements
        if (this.previewDot && this.previewDot.parentNode) {
            this.previewDot.parentNode.removeChild(this.previewDot);
        }

        this.handles.forEach(function (handle) {
            if (handle.parentNode) {
                handle.parentNode.removeChild(handle);
            }
        });

        if (this.svg && this.svg.parentNode) {
            this.svg.parentNode.removeChild(this.svg);
        }

        // Remove all event listeners
        // (Note: specific event listeners were already removed in the event handlers)
    };

    /**
     * Round values to a specified number of decimal places
     * @param {number} decimals - Number of decimal places
     * @return {Array} - Rounded values array
     */
    CubicBezierEditor.prototype.getRoundedValues = function (decimals) {
        decimals = typeof decimals === 'number' ? decimals : 2;
        const factor = Math.pow(10, decimals);

        return this.values.map(function (val) {
            return Math.round(val * factor) / factor;
        });
    };

    /**
     * Get CSS string representation of the bezier curve
     * @return {string} - cubic-bezier CSS function string
     */
    CubicBezierEditor.prototype.getCSSValue = function () {
        var rounded = this.getRoundedValues(2);
        return `cubic-bezier(${rounded.join(', ')})`;
    };

    /**
     * Resize the editor to fit container
     */
    CubicBezierEditor.prototype.resize = function () {
        // Get updated dimensions
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        // Update SVG size attributes if needed
        this.svg.setAttribute('width', this.options.width);
        this.svg.setAttribute('height', this.options.height);

        // Reposition handles
        this.handles.forEach(function (handle, index) {
            var x = this.values[index * 2];
            var y = this.values[index * 2 + 1];
            this.positionHandle(handle, x, y);
        }, this);

        // Update curve path
        this.updateCurve();
    };

    /**
     * Add common preset buttons to a container
     * @param {Element} container - DOM element to add presets to
     */
    CubicBezierEditor.prototype.addPresetButtons = function (container) {
        const presets = {
            'linear': 'Linear',
            'ease': 'Ease',
            'ease-in': 'Ease In',
            'ease-out': 'Ease Out',
            'ease-in-out': 'Ease In Out',
            'bounce': 'Bounce',
            'snappy': 'Snappy',
            'slow-start': 'Slow Start'
        };

        const self = this;

        for (const [id, label] of Object.entries(presets)) {
            const button = document.createElement('button');
            button.textContent = label;
            button.className = 'bezier-preset-button';
            button.setAttribute('data-preset', id);
            button.addEventListener('click', function () {
                self.setPreset(this.getAttribute('data-preset'));
            });

            container.appendChild(button);
        }
    };

    return CubicBezierEditor;
})();
