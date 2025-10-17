/**
 * Cubic Bezier Curve Editor
 * Visual editor for cubic bezier easing curves
 * Based on the bezierTangents module implementation
 */

var CubicBezier = (function () {
    function CubicBezier(container, p1x, p1y, p2x, p2y) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;
        this.width = 250;
        this.height = 250;
        this.padding = 20;

        this.coordinates = {
            P1: { x: p1x || 0.42, y: p1y || 0 },
            P2: { x: p2x || 0.58, y: p2y || 1 }
        };

        this.dragging = null;
        this.mousePos = { x: 0, y: 0 };

        this.init();
    }

    CubicBezier.prototype.init = function () {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = '100%';
        this.canvas.style.height = 'auto';
        this.canvas.style.cursor = 'crosshair';
        this.canvas.style.display = 'block';

        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        // Add coordinate display
        var coordDisplay = document.createElement('div');
        coordDisplay.className = 'bezier-coords';
        coordDisplay.style.marginTop = '10px';
        coordDisplay.style.fontSize = '12px';
        coordDisplay.style.color = '#a0a0a0';
        coordDisplay.style.fontFamily = 'monospace';
        this.coordDisplay = coordDisplay;
        this.container.appendChild(coordDisplay);

        // Bind events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

        // Initial draw
        this.draw();
        this.updateCoordinateDisplay();
    };

    CubicBezier.prototype.toCanvas = function (x, y) {
        var graphWidth = this.width - this.padding * 2;
        var graphHeight = this.height - this.padding * 2;

        return {
            x: this.padding + x * graphWidth,
            y: this.padding + (1 - y) * graphHeight
        };
    };

    CubicBezier.prototype.fromCanvas = function (cx, cy) {
        var graphWidth = this.width - this.padding * 2;
        var graphHeight = this.height - this.padding * 2;

        return {
            x: (cx - this.padding) / graphWidth,
            y: 1 - (cy - this.padding) / graphHeight
        };
    };

    CubicBezier.prototype.clamp = function (value, min, max) {
        return Math.max(min, Math.min(max, value));
    };

    CubicBezier.prototype.handleMouseDown = function (e) {
        var rect = this.canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        // Scale for canvas resolution
        mx = mx * (this.width / rect.width);
        my = my * (this.height / rect.height);

        var p1Canvas = this.toCanvas(this.coordinates.P1.x, this.coordinates.P1.y);
        var p2Canvas = this.toCanvas(this.coordinates.P2.x, this.coordinates.P2.y);

        var threshold = 10;

        if (Math.abs(mx - p1Canvas.x) < threshold && Math.abs(my - p1Canvas.y) < threshold) {
            this.dragging = 'P1';
        } else if (Math.abs(mx - p2Canvas.x) < threshold && Math.abs(my - p2Canvas.y) < threshold) {
            this.dragging = 'P2';
        }
    };

    CubicBezier.prototype.handleMouseMove = function (e) {
        var rect = this.canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        // Scale for canvas resolution
        mx = mx * (this.width / rect.width);
        my = my * (this.height / rect.height);

        this.mousePos = { x: mx, y: my };

        if (this.dragging) {
            var coords = this.fromCanvas(mx, my);

            // Clamp x to 0-1, allow y to go beyond
            coords.x = this.clamp(coords.x, 0, 1);

            this.coordinates[this.dragging] = coords;
            this.draw();
            this.updateCoordinateDisplay();
            this.fireCurveChangeEvent();
        } else {
            // Update cursor based on hover
            var p1Canvas = this.toCanvas(this.coordinates.P1.x, this.coordinates.P1.y);
            var p2Canvas = this.toCanvas(this.coordinates.P2.x, this.coordinates.P2.y);

            var threshold = 10;
            if ((Math.abs(mx - p1Canvas.x) < threshold && Math.abs(my - p1Canvas.y) < threshold) ||
                (Math.abs(mx - p2Canvas.x) < threshold && Math.abs(my - p2Canvas.y) < threshold)) {
                this.canvas.style.cursor = 'pointer';
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        }
    };

    CubicBezier.prototype.handleMouseUp = function () {
        this.dragging = null;
    };

    CubicBezier.prototype.draw = function () {
        var ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        var p0 = this.toCanvas(0, 0);
        var p1 = this.toCanvas(this.coordinates.P1.x, this.coordinates.P1.y);
        var p2 = this.toCanvas(this.coordinates.P2.x, this.coordinates.P2.y);
        var p3 = this.toCanvas(1, 1);

        // Draw background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;

        for (var i = 0; i <= 4; i++) {
            var x = this.padding + (i / 4) * (this.width - this.padding * 2);
            var y = this.padding + (i / 4) * (this.height - this.padding * 2);

            ctx.beginPath();
            ctx.moveTo(x, this.padding);
            ctx.lineTo(x, this.height - this.padding);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(this.padding, y);
            ctx.lineTo(this.width - this.padding, y);
            ctx.stroke();
        }

        // Draw diagonal reference line
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw control lines
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.stroke();

        // Draw bezier curve
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.stroke();

        // Draw control points
        this.drawPoint(ctx, p0.x, p0.y, '#606060', 4);
        this.drawPoint(ctx, p3.x, p3.y, '#606060', 4);
        this.drawPoint(ctx, p1.x, p1.y, '#4a9eff', 6);
        this.drawPoint(ctx, p2.x, p2.y, '#4a9eff', 6);

        // Highlight dragging point
        if (this.dragging === 'P1') {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.dragging === 'P2') {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p2.x, p2.y, 8, 0, Math.PI * 2);
            ctx.stroke();
        }
    };

    CubicBezier.prototype.drawPoint = function (ctx, x, y, color, radius) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    };

    CubicBezier.prototype.updateCoordinateDisplay = function () {
        var p1x = this.coordinates.P1.x.toFixed(3);
        var p1y = this.coordinates.P1.y.toFixed(3);
        var p2x = this.coordinates.P2.x.toFixed(3);
        var p2y = this.coordinates.P2.y.toFixed(3);

        this.coordDisplay.textContent = 'cubic-bezier(' + p1x + ', ' + p1y + ', ' + p2x + ', ' + p2y + ')';
    };

    CubicBezier.prototype.fireCurveChangeEvent = function () {
        var event = new CustomEvent('curvechange', {
            detail: {
                p1x: this.coordinates.P1.x,
                p1y: this.coordinates.P1.y,
                p2x: this.coordinates.P2.x,
                p2y: this.coordinates.P2.y
            }
        });
        this.container.dispatchEvent(event);
    };

    CubicBezier.prototype.setCoordinates = function (p1x, p1y, p2x, p2y) {
        this.coordinates.P1 = { x: p1x, y: p1y };
        this.coordinates.P2 = { x: p2x, y: p2y };
        this.draw();
        this.updateCoordinateDisplay();
    };

    CubicBezier.prototype.getCoordinates = function () {
        return {
            p1x: this.coordinates.P1.x,
            p1y: this.coordinates.P1.y,
            p2x: this.coordinates.P2.x,
            p2y: this.coordinates.P2.y
        };
    };

    return CubicBezier;
})();