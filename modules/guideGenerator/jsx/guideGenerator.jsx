/**
 * Store existing guides from the active composition
 */
this.guideGenerator.storeExistingGuides = function() {
    var comp = app.project.activeItem;
    var guides = [];
    this.originalGuides = [];
    this.originalGuidesStored = false;
    try {
        if (comp && comp instanceof CompItem) {
            for (var i = 0; i < comp.guides.length; i++) {
                guides.push({
                    orientation: comp.guides[i].orientationType,
                    position: comp.guides[i].position
                });
            }

            // Store guides in the module's internal state as well
            this.originalGuides = guides.slice();
            this.originalGuidesStored = true;
        }
    } catch (e) {
        guides = [];
    }

    return guides;
};

/**
 * Clear all guides from the active composition
 */
this.guideGenerator.clearAllGuides = function() {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return false;

    try {
        var num = comp.guides.length;
        for (var i = 0; i < num; i++) {
            comp.removeGuide(0);
        }
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Restore original guides to the active composition
 */
this.guideGenerator.restoreOriginalGuides = function() {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return false;

    try {
        // Clear all existing guides
        this.clearAllGuides();

        // Use the stored original guides
        var guides = this.originalGuides || [];

        // Add back the original guides
        for (var i = 0; i < guides.length; i++) {
            var g = guides[i];
            if (g && (g.orientation === 0 || g.orientation === 1) && typeof g.position === "number") {
                comp.addGuide(g.orientation, g.position);
            }
        }

        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Draw guides based on configuration
 * Note: This function does NOT restore original guides first - that should be done separately
 */
this.guideGenerator.drawGuides = function(configJson) {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return false;

    try {
        // Parse the config from JSON string
        var config = configJson;
        if (typeof configJson === 'string') {
            config = JSON.parse(configJson);
        }

        // Extract configuration values
        var cols = config.cols || 3;
        var rows = config.rows || 3;
        var colGutter = config.colGutter || 0;
        var rowGutter = config.rowGutter || 0;
        var includeBoundingGuides = config.includeBoundingGuides || false;
        var bbox = config.bbox || null;

        if (!bbox) return false;

        // Draw bounding box guides if requested
        if (includeBoundingGuides) {
            comp.addGuide(0, bbox.top); // Horizontal guide at top
            comp.addGuide(0, bbox.top + bbox.height); // Horizontal guide at bottom
            comp.addGuide(1, bbox.left); // Vertical guide at left
            comp.addGuide(1, bbox.left + bbox.width); // Vertical guide at right
        }

        // Calculate dimensions
        var totalColGutter = (cols - 1) * colGutter;
        var totalRowGutter = (rows - 1) * rowGutter;

        var colWidth = (bbox.width - totalColGutter) / cols;
        var rowHeight = (bbox.height - totalRowGutter) / rows;

        // Draw column guides
        var x = bbox.left;
        for (var i = 1; i < cols; i++) {
            x += colWidth;
            if (colGutter > 0) {
                comp.addGuide(1, x); // Guide at end of column
                comp.addGuide(1, x + colGutter); // Guide at start of next column
            } else {
                comp.addGuide(1, x); // Just one guide between columns
            }
            x += colGutter;
        }

        // Draw row guides
        var y = bbox.top;
        for (var j = 1; j < rows; j++) {
            y += rowHeight;
            if (rowGutter > 0) {
                comp.addGuide(0, y); // Guide at bottom of row
                comp.addGuide(0, y + rowGutter); // Guide at top of next row
            } else {
                comp.addGuide(0, y); // Just one guide between rows
            }
            y += rowGutter;
        }

        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Get the bounding box of selected layers or use comp dimensions as fallback
 */
this.guideGenerator.getSelectedBoundingBox = function() {
    var comp = app.project.activeItem;

    // Check if we have an active composition
    if (!(comp && comp instanceof CompItem)) {
        return null; // No active composition
    }

    var sel = comp.selectedLayers;

    // If no layers selected, use the composition's dimensions
    if (sel.length === 0) {
        return {
            left: 0,
            top: 0,
            width: comp.width,
            height: comp.height
        };
    }

    // Otherwise calculate bounding box from selected layers
    var bounds = [Infinity, Infinity, -Infinity, -Infinity]; // [left, top, right, bottom]

    for (var i = 0; i < sel.length; i++) {
        var layer = sel[i];
        var rect = layer.sourceRectAtTime(comp.time, false);
        var position = layer.property("Position").value;
        var anchor = layer.property("Anchor Point").value;

        // Calculate the actual corners of the layer in comp space
        var x1 = position[0] - anchor[0] + rect.left;
        var y1 = position[1] - anchor[1] + rect.top;
        var x2 = x1 + rect.width;
        var y2 = y1 + rect.height;

        // Update bounds
        bounds[0] = Math.min(bounds[0], x1);
        bounds[1] = Math.min(bounds[1], y1);
        bounds[2] = Math.max(bounds[2], x2);
        bounds[3] = Math.max(bounds[3], y2);
    }

    // Convert to our bounding box format
    return {
        left: bounds[0],
        top: bounds[1],
        width: bounds[2] - bounds[0],
        height: bounds[3] - bounds[1]
    };
};