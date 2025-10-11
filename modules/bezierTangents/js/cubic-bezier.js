/**
 * Cubic-Bezier Editor Widget
 * Inspired by https://cubic-bezier.com/
 * Modified to allow Y values beyond 0-1 range
 */
var CubicBezierEditor = (function () {
    /**
     * Helper function to create SVG elements
     * @param {string} type - SVG element type (e.g., 'svg', 'path', 'line', 'circle')
     * @param {Object} attributes - Object with attribute key-value pairs
     * @returns {SVGElement}
     */
    function createSVGElement(type, attributes) {
        var element = document.createElementNS('http://www.w3.org/2000/svg', type);
        if (attributes) {
            for (var key in attributes) {
                if (attributes.hasOwnProperty(key)) {
                    element.setAttribute(key, attributes[key]);
                }
            }
        }
        return element;
    }

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
            showGrid: true,
            yMin: -0.5,  // Minimum Y value to display
            yMax: 1.5,   // Maximum Y value to display
            padding: 0 // Padding as fraction of visible range
        }, options || {});

        this.values = this.options.defaultValues.slice();
        this.dragging = false;
        this.activeHandle = null;
        this.animationFrame = null;

        // Dynamic X and Y range based on handle positions
        this.xMin = this.options.yMin;
        this.xMax = this.options.yMax;
        this.yMin = this.options.yMin;
        this.yMax = this.options.yMax;

        this.init();
    }

    /**
     * Calculate the appropriate X and Y ranges based on current handle positions
     */
    CubicBezierEditor.prototype.calculateViewRange = function () {
        var p1x = this.values[0];
        var p1y = this.values[1];
        var p2x = this.values[2];
        var p2y = this.values[3];

        // Find min and max X values including start (0) and end (1)
        var minX = Math.min(0, 1, p1x, p2x);
        var maxX = Math.max(0, 1, p1x, p2x);

        // Find min and max Y values including start (0) and end (1)
        var minY = Math.min(0, 1, p1y, p2y);
        var maxY = Math.max(0, 1, p1y, p2y);

        // Add padding
        var rangeX = maxX - minX;
        var rangeY = maxY - minY;
        var paddingX = Math.max(0, rangeX * this.options.padding);
        var paddingY = Math.max(0, rangeY * this.options.padding);

        this.xMin = minX - paddingX;
        this.xMax = maxX + paddingX;
        this.yMin = minY - paddingY;
        this.yMax = maxY + paddingY;

        // Update viewBox
        this.updateViewBox();
    };

    /**
     * Update the SVG viewBox based on current X and Y ranges
     */
    CubicBezierEditor.prototype.updateViewBox = function () {
        var width = this.xMax - this.xMin;
        var height = this.yMax - this.yMin;
        // ViewBox: x, y, width, height
        this.svg.setAttribute('viewBox', this.xMin + ' ' + (-this.yMax) + ' ' + width + ' ' + height);
    };

    /**
     * Initialize the editor
     */
    CubicBezierEditor.prototype.init = function () {
        // Create SVG canvas
        this.svg = createSVGElement('svg', {
            'class': 'cubic-bezier-canvas',
            'width': this.options.width,
            'height': this.options.height,
            'preserveAspectRatio': 'xMidYMid meet'
        });
        this.container.appendChild(this.svg);

        // Calculate initial X and Y range and set viewBox
        this.calculateViewRange();

        // Get container dimensions
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        if (this.options.showGrid) {
            this.drawGrid();
        }

        // Create control lines
        this.controlLine1 = createSVGElement('line', {
            'class': 'bezier-control-line'
        });
        this.svg.appendChild(this.controlLine1);

        this.controlLine2 = createSVGElement('line', {
            'class': 'bezier-control-line'
        });
        this.svg.appendChild(this.controlLine2);

        // Create bezier curve
        this.path = createSVGElement('path', {
            'class': 'bezier-path'
        });
        this.svg.appendChild(this.path);

        // Create start and end point indicators
        this.startPoint = createSVGElement('circle', {
            'class': 'bezier-endpoint',
            'cx': '0',
            'cy': '0',
            'r': '0.02'
        });
        this.svg.appendChild(this.startPoint);

        this.endPoint = createSVGElement('circle', {
            'class': 'bezier-endpoint',
            'cx': '1',
            'cy': '-1',
            'r': '0.02'
        });
        this.svg.appendChild(this.endPoint);

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
        // Remove existing grid if present
        if (this.gridGroup) {
            this.svg.removeChild(this.gridGroup);
        }

        this.gridGroup = createSVGElement('g', {
            'class': 'bezier-grid-container'
        });

        // Calculate grid bounds to cover entire viewBox
        // var gridXMin = this.xMin;
        var gridXMin = -2;
        var gridXMax = 3;
        var gridYMin = this.yMin;
        var gridYMax = this.yMax;

        // Draw horizontal grid lines for Y axis
        var yStep = 0.1; // Grid every 0.1 units
        var yStart = Math.floor(gridYMin / yStep) * yStep;
        var yEnd = Math.ceil(gridYMax / yStep) * yStep;

        for (var y = yStart; y <= yEnd; y += yStep) {
            var isMajor = Math.abs(y % 0.5) < 0.01; // Major line every 0.5 units
            var isAxis = Math.abs(y) < 0.01 || Math.abs(y - 1) < 0.01;

            var line = createSVGElement('line', {
                'x1': gridXMin.toString(),
                'y1': (-y).toString(),
                'x2': gridXMax.toString(),
                'y2': (-y).toString(),
                'class': isAxis ? 'bezier-axis' : (isMajor ? 'bezier-grid-major' : 'bezier-grid')
            });
            this.gridGroup.appendChild(line);
        }

        // Draw vertical grid lines for X axis
        var xStep = 0.1; // Grid every 0.1 units
        var xStart = Math.floor(gridXMin / xStep) * xStep;
        var xEnd = Math.ceil(gridXMax / xStep) * xStep;

        for (var x = xStart; x <= xEnd; x += xStep) {
            var isMajor = Math.abs(x % 0.5) < 0.01 || Math.abs(Math.abs(x % 0.5) - 1) < 0.01; // Major line every 0.5 units
            var isAxis = Math.abs(x % 1) < 0.01 || Math.abs(Math.abs(x % 1) - 1) < 0.01;

            var line = createSVGElement('line', {
                'x1': x.toString(),
                'y1': (-gridYMax).toString(),
                'x2': x.toString(),
                'y2': (-gridYMin).toString(),
                'class': isAxis ? 'bezier-axis' : (isMajor ? 'bezier-grid-major' : 'bezier-grid')
            });
            this.gridGroup.appendChild(line);
        }

        this.svg.insertBefore(this.gridGroup, this.svg.firstChild);
    };

    /**
     * Create a draggable handle
     */
    CubicBezierEditor.prototype.createHandle = function (x, y, id) {
        var handle = createSVGElement('circle', {
            'class': 'bezier-handle',
            'id': 'handle-' + id,
            'data-id': id,
            'r': '0.03'
        });
        this.svg.appendChild(handle);

        // Position the handle
        this.positionHandle(handle, x, y);

        return handle;
    };

    /**
     * Position a handle at the given coordinates
     */
    CubicBezierEditor.prototype.positionHandle = function (handle, x, y) {
        // x is in 0-1 range, y can be any value
        // In SVG coordinates, we negate y
        handle.setAttribute('cx', x);
        handle.setAttribute('cy', -y);
    };

    /**
     * Create the preview dot for animation
     */
    CubicBezierEditor.prototype.createPreviewDot = function () {
        this.previewDot = createSVGElement('circle', {
            'class': 'bezier-preview',
            'r': '0.02',
            'cx': '0',
            'cy': '0'
        });
        this.svg.appendChild(this.previewDot);
    };

    /**
     * Update the bezier curve path
     */
    CubicBezierEditor.prototype.updateCurve = function () {
        var [p1x, p1y, p2x, p2y] = this.values;

        // Recalculate X and Y range if needed
        this.calculateViewRange();

        // Redraw grid with new range
        if (this.options.showGrid) {
            this.drawGrid();
        }

        // Update control lines
        this.controlLine1.setAttribute('x1', '0');
        this.controlLine1.setAttribute('y1', '0');
        this.controlLine1.setAttribute('x2', p1x);
        this.controlLine1.setAttribute('y2', -p1y);

        this.controlLine2.setAttribute('x1', '1');
        this.controlLine2.setAttribute('y1', '-1');
        this.controlLine2.setAttribute('x2', p2x);
        this.controlLine2.setAttribute('y2', -p2y);

        // Draw path
        var pathStr = `M0,0 C${p1x},${-p1y} ${p2x},${-p2y} 1,-1`;
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
        var duration = 1500;
        var self = this;

        function cubic(t) {
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
                setTimeout(function () {
                    self.animatePreview();
                }, 500);
            }

            var pos = cubic(progress);
            self.previewDot.setAttribute('cx', pos.x);
            self.previewDot.setAttribute('cy', -pos.y);
        }

        this.animationFrame = requestAnimationFrame(animate);
    };

    /**
     * Set up event listeners
     */
    CubicBezierEditor.prototype.setupEvents = function () {
        var self = this;

        this.svg.addEventListener('mousedown', function (e) {
            if (e.target.classList.contains('bezier-handle')) {
                e.preventDefault();

                self.dragging = true;
                self.activeHandle = e.target;
                self.activeHandle.classList.add('active');

                self.activeHandleIndex = Array.from(self.handles).indexOf(self.activeHandle);

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }
        });

        function onMouseMove(e) {
            if (!self.dragging || !self.activeHandle) return;

            var pt = self.svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;

            var svgP = pt.matrixTransform(self.svg.getScreenCTM().inverse());

            var x = svgP.x;
            var y = -svgP.y; // Convert from SVG y to our coordinate system

            // Apply snapping if Shift key is pressed
            if (e.shiftKey) {
                x = Math.round(x * 10) / 10;
                y = Math.round(y * 10) / 10;
            }

            // X and Y are both unconstrained (can be any value)

            self.positionHandle(self.activeHandle, x, y);

            if (self.activeHandleIndex === 0) {
                self.values[0] = x;
                self.values[1] = y;
            } else {
                self.values[2] = x;
                self.values[3] = y;
            }

            self.updateCurve();

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

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        this.svg.addEventListener('touchstart', function (e) {
            if (e.target.classList.contains('bezier-handle')) {
                e.preventDefault();

                self.dragging = true;
                self.activeHandle = e.target;
                self.activeHandle.classList.add('active');

                self.activeHandleIndex = Array.from(self.handles).indexOf(self.activeHandle);

                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', onTouchEnd);
            }
        }, { passive: false });

        function onTouchMove(e) {
            if (!self.dragging || !self.activeHandle) return;
            e.preventDefault();

            var touch = e.touches[0];

            var pt = self.svg.createSVGPoint();
            pt.x = touch.clientX;
            pt.y = touch.clientY;

            var svgP = pt.matrixTransform(self.svg.getScreenCTM().inverse());

            var x = svgP.x;
            var y = -svgP.y;

            // Apply snapping if Shift key is pressed (for touch with external keyboard)
            if (e.shiftKey) {
                x = Math.round(x * 10) / 10;
                y = Math.round(y * 10) / 10;
            }

            // X and Y are both unconstrained

            self.positionHandle(self.activeHandle, x, y);

            if (self.activeHandleIndex === 0) {
                self.values[0] = x;
                self.values[1] = y;
            } else {
                self.values[2] = x;
                self.values[3] = y;
            }

            self.updateCurve();

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

            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        }

        window.addEventListener('resize', function () {
            self.handles.forEach(function (handle, index) {
                var x = self.values[index * 2];
                var y = self.values[index * 2 + 1];
                self.positionHandle(handle, x, y);
            });
        });
    };

    /**
     * Set new values for the bezier curve
     */
    CubicBezierEditor.prototype.setValues = function (values) {
        if (!Array.isArray(values) || values.length !== 4) {
            console.error('Invalid values array. Must be an array of 4 numbers.');
            return;
        }

        this.values = values.map(function (val) {
            val = parseFloat(val);
            if (isNaN(val)) {
                return 0.5;
            }
            // All values (X and Y) are now unconstrained
            return val;
        });

        this.handles.forEach(function (handle, index) {
            var x = this.values[index * 2];
            var y = this.values[index * 2 + 1];
            this.positionHandle(handle, x, y);
        }, this);

        this.updateCurve();

        if (typeof this.options.onChange === 'function') {
            this.options.onChange(this.values);
        }
    };

    /**
     * Get the current values of the bezier curve
     */
    CubicBezierEditor.prototype.getValues = function () {
        return this.values.slice();
    };

    /**
     * Set preset bezier curve values
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
            'elastic': [0.5, -0.5, 0.5, 1.5],
            'overshoot': [0.25, 1.4, 0.75, 0.8],
            'extreme': [-0.5, -0.5, 1.5, 1.5]
        };

        if (presets[preset]) {
            this.setValues(presets[preset]);
        }
    };

    /**
     * Clean up resources
     */
    CubicBezierEditor.prototype.destroy = function () {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        if (this.svg && this.svg.parentNode) {
            this.svg.parentNode.removeChild(this.svg);
        }
    };

    /**
     * Round values to specified decimal places
     */
    CubicBezierEditor.prototype.getRoundedValues = function (decimals) {
        decimals = typeof decimals === 'number' ? decimals : 2;
        const factor = Math.pow(10, decimals);

        return this.values.map(function (val) {
            return Math.round(val * factor) / factor;
        });
    };

    /**
     * Get CSS string representation
     */
    CubicBezierEditor.prototype.getCSSValue = function () {
        var rounded = this.getRoundedValues(2);
        return `cubic-bezier(${rounded.join(', ')})`;
    };

    /**
     * Resize the editor
     */
    CubicBezierEditor.prototype.resize = function () {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.svg.setAttribute('width', this.options.width);
        this.svg.setAttribute('height', this.options.height);

        this.handles.forEach(function (handle, index) {
            var x = this.values[index * 2];
            var y = this.values[index * 2 + 1];
            this.positionHandle(handle, x, y);
        }, this);

        this.updateCurve();
    };

    /**
     * Add preset buttons
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
            'elastic': 'Elastic',
            'overshoot': 'Overshoot',
            'extreme': 'Extreme'
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