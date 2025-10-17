/**
 * Time Offset - JSX (After Effects Integration)
 * Handles time offset operations on layers and keyframes
 */

/**
 * Initialize the JSX module
 */
this.timeOffset.init = function() {
    return JSON.stringify({
        success: true
    });
};

/**
 * Seeded random number generator
 */
this.timeOffset.SeededRandom = function(seed) {
    this.seed = seed || 0;
}

this.timeOffset.SeededRandom.prototype.random = function() {
    var x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
};

/**
 * Evaluate cubic bezier at t
 */
this.timeOffset.cubicBezier = function(t, p1x, p1y, p2x, p2y) {
    var cx = 3 * p1x;
    var bx = 3 * (p2x - p1x) - cx;
    var ax = 1 - cx - bx;

    var cy = 3 * p1y;
    var by = 3 * (p2y - p1y) - cy;
    var ay = 1 - cy - by;

    var epsilon = 0.001;
    var t2 = t;
    for (var i = 0; i < 8; i++) {
        var x2 = ax * t2 * t2 * t2 + bx * t2 * t2 + cx * t2;
        var dx = 3 * ax * t2 * t2 + 2 * bx * t2 + cx;

        if (Math.abs(x2 - t) < epsilon) break;
        if (Math.abs(dx) < epsilon) break;

        t2 = t2 - (x2 - t) / dx;
    }

    var y = ay * t2 * t2 * t2 + by * t2 * t2 + cy * t2;
    return y;
}

/**
 * Save complete keyframe data for restoration
 */
this.timeOffset.saveKeyframeData = function(layer, keyInfo) {
    var prop = timeOffset.getPropertyByPath(layer, keyInfo.propertyPath);
    if (!prop) return null;

    var k = keyInfo.keyIndex;
    if (k > prop.numKeys) return null;

    var data = {
        propertyPath: keyInfo.propertyPath,
        time: prop.keyTime(k),
        value: prop.keyValue(k),
        inInterp: prop.keyInInterpolationType(k),
        outInterp: prop.keyOutInterpolationType(k),
        inEase: null,
        outEase: null,
        inSpatial: null,
        outSpatial: null
    };

    // Store temporal ease
    if (prop.isInterpolationTypeValid(KeyframeInterpolationType.BEZIER)) {
        try {
            data.inEase = prop.keyInTemporalEase(k);
            data.outEase = prop.keyOutTemporalEase(k);
        } catch (e) {}
    }

    // Store spatial tangents
    try {
        if (prop.isSpatial) {
            data.inSpatial = prop.keyInSpatialTangent(k);
            data.outSpatial = prop.keyOutSpatialTangent(k);
        }
    } catch (e) {}

    return data;
}

/**
 * Save current selection with complete keyframe data
 */
this.timeOffset.saveSelection = function() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({
                error: 'No active composition'
            });
        }

        var selection = {
            type: null,
            items: []
        };

        var hasKeyframes = false;
        var hasLayers = false;

        for (var i = 0; i < comp.selectedLayers.length; i++) {
            var layer = comp.selectedLayers[i];
            var selectedKeys = timeOffset.getSelectedKeyframes(layer);

            if (selectedKeys.length > 0) {
                hasKeyframes = true;

                // Save complete keyframe data
                var keyframeData = [];
                for (var j = 0; j < selectedKeys.length; j++) {
                    var data = timeOffset.saveKeyframeData(layer, selectedKeys[j]);
                    if (data) {
                        keyframeData.push(data);
                    }
                }

                selection.items.push({
                    layerIndex: layer.index,
                    keyframes: selectedKeys,
                    keyframeData: keyframeData
                });
            } else {
                hasLayers = true;
            }
        }

        if (hasKeyframes && hasLayers) {
            return JSON.stringify({
                error: 'Mixed selection detected. Please select only keyframes or only layers.'
            });
        }

        if (hasKeyframes) {
            selection.type = 'keyframes';
        } else if (comp.selectedLayers.length > 0) {
            selection.type = 'layers';
            for (var j = 0; j < comp.selectedLayers.length; j++) {
                var layer = comp.selectedLayers[j];
                selection.items.push({
                    layerIndex: layer.index,
                    inPoint: layer.inPoint,
                    outPoint: layer.outPoint,
                    startTime: layer.startTime
                });
            }
        } else {
            return JSON.stringify({
                error: 'No layers or keyframes selected'
            });
        }

        return JSON.stringify({
            result: selection
        });
    } catch (e) {
        return JSON.stringify({
            error: e.toString()
        });
    }
};

/**
 * Get selected keyframes from a layer
 */
this.timeOffset.getSelectedKeyframes = function(layer) {
    var selectedKeys = [];

    function searchProperty(prop, propPath) {
        if (prop.numKeys > 0) {
            for (var k = 1; k <= prop.numKeys; k++) {
                if (prop.keySelected(k)) {
                    selectedKeys.push({
                        propertyPath: propPath,
                        keyIndex: k,
                        time: prop.keyTime(k)
                    });
                }
            }
        }

        if (prop.numProperties > 0) {
            for (var p = 1; p <= prop.numProperties; p++) {
                var childProp = prop.property(p);
                searchProperty(childProp, propPath + '|' + childProp.matchName);
            }
        }
    }

    searchProperty(layer, layer.name);
    return selectedKeys;
}

/**
 * Get property by path
 */
this.timeOffset.getPropertyByPath = function(layer, path) {
    var parts = path.split('|');
    var prop = layer;

    for (var i = 1; i < parts.length; i++) {
        prop = prop.property(parts[i]);
        if (!prop) return null;
    }

    return prop;
}

/**
 * Restore keyframes from saved data
 */
this.timeOffset.restoreKeyframesFromData = function(savedSelection) {
    try {
        $.writeln('=== restoreKeyframesFromData called ===');
        $.writeln('savedSelection type: ' + (savedSelection ? savedSelection.type : 'null'));

        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({
                error: 'No active composition'
            });
        }

        if (!savedSelection || !savedSelection.items) {
            return JSON.stringify({
                error: 'No saved selection data provided'
            });
        }

        app.beginUndoGroup("Restore Keyframes");

        if (savedSelection.type === 'keyframes') {

            var currentSelection = {};
            for (var i = 0; i < savedSelection.items.length; i++) {
                var item = savedSelection.items[i];
                var layer = comp.layer(item.layerIndex);

                if (!item.keyframeData || item.keyframeData.length === 0) {
                    continue;
                }
                // Group by property
                var propertyGroups = {};
                for (var j = 0; j < item.keyframeData.length; j++) {
                    var keyData = item.keyframeData[j];
                    if (!propertyGroups[keyData.propertyPath]) {
                        propertyGroups[keyData.propertyPath] = [];
                    }
                    propertyGroups[keyData.propertyPath].push(keyData);
                }


                // Process each property
                for (var propPath in propertyGroups) {
                    var prop = timeOffset.getPropertyByPath(layer, propPath);
                    if (!prop) continue;

                    var keyDataArray = propertyGroups[propPath];
                    currentSelection[i + propPath] = {}
                    // Delete all selected keyframes on this property (in reverse order)
                    for (var k = prop.numKeys; k >= 1; k--) {
                        if (prop.keySelected(k)) {
                            currentSelection[i + propPath][k] = true;
                        }
                    }
                }
            }


            for (var i = 0; i < savedSelection.items.length; i++) {
                var item = savedSelection.items[i];
                var layer = comp.layer(item.layerIndex);

                if (!item.keyframeData || item.keyframeData.length === 0) {
                    continue;
                }

                // Group by property
                var propertyGroups = {};
                for (var j = 0; j < item.keyframeData.length; j++) {
                    var keyData = item.keyframeData[j];
                    if (!propertyGroups[keyData.propertyPath]) {
                        propertyGroups[keyData.propertyPath] = [];
                    }
                    propertyGroups[keyData.propertyPath].push(keyData);
                }

                // Process each property
                for (var propPath in propertyGroups) {
                    var prop = timeOffset.getPropertyByPath(layer, propPath);
                    if (!prop) continue;

                    var keyDataArray = propertyGroups[propPath];

                    // Delete all selected keyframes on this property (in reverse order)
                    for (var k = prop.numKeys; k >= 1; k--) {
                        if (currentSelection[i + propPath][k]) {
                            prop.removeKey(k);
                        }
                    }

                    // Recreate keyframes from saved data
                    var times = [];
                    var values = [];
                    for (var m = 0; m < keyDataArray.length; m++) {
                        times.push(keyDataArray[m].time);
                        values.push(keyDataArray[m].value);
                    }

                    prop.setValuesAtTimes(times, values);

                    // Restore interpolation and ease
                    for (var m = 0; m < keyDataArray.length; m++) {
                        var keyData = keyDataArray[m];

                        // Find keyframe by time
                        for (var k = 1; k <= prop.numKeys; k++) {
                            if (Math.abs(prop.keyTime(k) - keyData.time) < 0.001) {
                                prop.setInterpolationTypeAtKey(k, keyData.inInterp, keyData.outInterp);

                                if (keyData.inEase && keyData.outEase) {
                                    try {
                                        prop.setTemporalEaseAtKey(k, keyData.inEase, keyData.outEase);
                                    } catch (e) {}
                                }

                                if (keyData.inSpatial && keyData.outSpatial) {
                                    try {
                                        prop.setSpatialTangentsAtKey(k, keyData.inSpatial, keyData.outSpatial);
                                    } catch (e) {}
                                }

                                prop.setSelectedAtKey(k, true);
                                break;
                            }
                        }
                    }
                }
            }
        } else if (savedSelection.type === 'layers') {
            // Restore layer positions
            for (var i = 0; i < savedSelection.items.length; i++) {
                var item = savedSelection.items[i];
                var layer = comp.layer(item.layerIndex);
                layer.startTime = item.startTime;
            }
        }

        app.endUndoGroup();

        $.writeln('Restore completed successfully');
        return JSON.stringify({
            result: {
                success: true
            }
        });
    } catch (e) {
        $.writeln('Restore error: ' + e.toString());
        app.endUndoGroup();
        return JSON.stringify({
            error: e.toString()
        });
    }
};

/**
 * Apply time offset to selection
 */
this.timeOffset.applyTimeOffset = function(params) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({
                error: 'No active composition'
            });
        }

        var selection;

        if (params.savedSelection) {
            selection = params.savedSelection;
        } else {
            var savedResult = timeOffset.saveSelection();
            var savedParsed = JSON.parse(savedResult);
            if (savedParsed.error) {
                return savedResult;
            }
            selection = savedParsed.result;
        }

        if (!selection || !selection.items || selection.items.length === 0) {
            return JSON.stringify({
                error: 'Nothing to offset'
            });
        }

        app.beginUndoGroup("Time Offset");

        var result;
        if (selection.type === 'layers') {
            result = timeOffset.offsetLayers(comp, selection, params);
        } else if (selection.type === 'keyframes') {
            result = timeOffset.offsetKeyframes(comp, selection, params);
        } else {
            app.endUndoGroup();
            return JSON.stringify({
                error: 'Unknown selection type: ' + selection.type
            });
        }

        app.endUndoGroup();

        if (result.error) {
            return JSON.stringify(result);
        }

        return JSON.stringify({
            result: {
                count: selection.items.length,
                type: selection.type
            }
        });
    } catch (e) {
        app.endUndoGroup();
        return JSON.stringify({
            error: e.toString()
        });
    }
};

/**
 * Offset layers in time
 */
this.timeOffset.offsetLayers = function(comp, selection, params) {
    try {
        var items = selection.items;

        // Sort items by layer index
        var sortedItems = items.slice();
        sortedItems.sort(function(a, b) {
            if (params.order === 'ascending') {
                return b.layerIndex - a.layerIndex;
            } else {
                return a.layerIndex - b.layerIndex;
            }
        });

        var anchorItem = sortedItems[0];

        // Use ORIGINAL position from saved data
        var anchorTime;
        if (params.alignment === 'start') {
            anchorTime = anchorItem.inPoint;
        } else {
            anchorTime = anchorItem.outPoint;
        }

        var offsets = timeOffset.calculateOffsets(sortedItems.length, params);

        for (var i = 0; i < sortedItems.length; i++) {
            var item = sortedItems[i];
            var layer = comp.layer(item.layerIndex);
            var offset = offsets[i];

            var targetTime = anchorTime + offset;

            var originalTime;
            if (params.alignment === 'start') {
                originalTime = item.inPoint;
            } else {
                originalTime = item.outPoint;
            }

            var timeShift = targetTime - originalTime;

            // Calculate original start time from saved data
            var originalStartTime = item.startTime;
            layer.startTime = originalStartTime + timeShift;
        }

        return {
            success: true
        };
    } catch (e) {
        return {
            error: e.toString()
        };
    }
}

/**
 * Offset keyframes in time
 */
this.timeOffset.offsetKeyframes = function(comp, selection, params) {
    try {
        $.writeln('=== offsetKeyframes called ===');
        var items = selection.items;

        // Sort by layer index
        var sortedLayers = items.slice();
        sortedLayers.sort(function(a, b) {
            if (params.order === 'ascending') {
                return b.layerIndex - a.layerIndex;
            } else {
                return a.layerIndex - b.layerIndex;
            }
        });

        // Get anchor time from ORIGINAL keyframe data
        var anchorLayerGroup = sortedLayers[0];
        var minTime = Infinity;
        var maxTime = -Infinity;

        for (var j = 0; j < anchorLayerGroup.keyframeData.length; j++) {
            var keyTime = anchorLayerGroup.keyframeData[j].time;
            if (keyTime < minTime) minTime = keyTime;
            if (keyTime > maxTime) maxTime = keyTime;
        }

        var anchorTime;
        if (params.alignment === 'start') {
            anchorTime = minTime;
        } else {
            anchorTime = maxTime;
        }

        $.writeln('Anchor time: ' + anchorTime);

        var offsets = timeOffset.calculateOffsets(sortedLayers.length, params);


        // First pass: Delete all selected keyframes from all layers
        $.writeln('Deleting existing selected keyframes...');


        var currentSelection = {};
        for (var i = 0; i < sortedLayers.length; i++) {
            var layerGroup = sortedLayers[i];
            var layer = comp.layer(layerGroup.layerIndex);

            // Get all unique property paths
            var propertyPaths = {};
            for (var j = 0; j < layerGroup.keyframeData.length; j++) {
                propertyPaths[layerGroup.keyframeData[j].propertyPath] = true;
            }

            // store the selected keyframes
            for (var propPath in propertyPaths) {
                var prop = timeOffset.getPropertyByPath(layer, propPath);
                if (!prop) continue;
                currentSelection[i + propPath] = {}
                for (var k = prop.numKeys; k >= 1; k--) {
                    if (prop.keySelected(k)) {
                        currentSelection[i + propPath][k] = true;
                    }
                }
            }
        }



        for (var i = 0; i < sortedLayers.length; i++) {
            var layerGroup = sortedLayers[i];
            var layer = comp.layer(layerGroup.layerIndex);

            // Get all unique property paths
            var propertyPaths = {};
            for (var j = 0; j < layerGroup.keyframeData.length; j++) {
                propertyPaths[layerGroup.keyframeData[j].propertyPath] = true;
            }

            // Delete selected keyframes from each property (reverse order)
            for (var propPath in propertyPaths) {
                var prop = timeOffset.getPropertyByPath(layer, propPath);
                if (!prop) continue;

                for (var k = prop.numKeys; k >= 1; k--) {

                    if (currentSelection[i + propPath][k]) {
                        $.writeln('Deleting keyframe at index ' + k + ' on ' + propPath);
                        prop.removeKey(k);
                    }
                }
            }
        }

        // Second pass: Create new keyframes at offset positions
        $.writeln('Creating new keyframes at offset positions...');
        for (var i = 0; i < sortedLayers.length; i++) {
            var layerGroup = sortedLayers[i];
            var layer = comp.layer(layerGroup.layerIndex);
            var offset = offsets[i];

            $.writeln('Processing layer ' + layerGroup.layerIndex + ' with offset ' + offset);

            // Group by property
            var propertyGroups = {};
            for (var j = 0; j < layerGroup.keyframeData.length; j++) {
                var keyData = layerGroup.keyframeData[j];
                if (!propertyGroups[keyData.propertyPath]) {
                    propertyGroups[keyData.propertyPath] = [];
                }
                propertyGroups[keyData.propertyPath].push(keyData);
            }

            // Find time range from ORIGINAL data
            var minTime = Infinity;
            var maxTime = -Infinity;
            for (var j = 0; j < layerGroup.keyframeData.length; j++) {
                var keyTime = layerGroup.keyframeData[j].time;
                if (keyTime < minTime) minTime = keyTime;
                if (keyTime > maxTime) maxTime = keyTime;
            }

            var targetTime = anchorTime + offset;

            var currentTime;
            if (params.alignment === 'start') {
                currentTime = minTime;
            } else {
                currentTime = maxTime;
            }

            var timeShift = targetTime - currentTime;
            $.writeln('Time shift for layer ' + layerGroup.layerIndex + ': ' + timeShift);

            // Process each property
            for (var propPath in propertyGroups) {
                var prop = timeOffset.getPropertyByPath(layer, propPath);
                if (!prop) continue;

                var keyDataArray = propertyGroups[propPath];

                // Create new keyframes at offset positions
                var times = [];
                var values = [];
                for (var m = 0; m < keyDataArray.length; m++) {
                    var newTime = keyDataArray[m].time + timeShift;
                    times.push(newTime);
                    values.push(keyDataArray[m].value);
                    $.writeln('Creating keyframe at time ' + newTime);
                }

                prop.setValuesAtTimes(times, values);

                // Restore interpolation
                for (var m = 0; m < keyDataArray.length; m++) {
                    var keyData = keyDataArray[m];
                    var newTime = keyData.time + timeShift;

                    for (var k = 1; k <= prop.numKeys; k++) {
                        if (Math.abs(prop.keyTime(k) - newTime) < 0.001) {
                            prop.setInterpolationTypeAtKey(k, keyData.inInterp, keyData.outInterp);

                            if (keyData.inEase && keyData.outEase) {
                                try {
                                    prop.setTemporalEaseAtKey(k, keyData.inEase, keyData.outEase);
                                } catch (e) {}
                            }

                            if (keyData.inSpatial && keyData.outSpatial) {
                                try {
                                    prop.setSpatialTangentsAtKey(k, keyData.inSpatial, keyData.outSpatial);
                                } catch (e) {}
                            }

                            prop.setSelectedAtKey(k, true);
                            break;
                        }
                    }
                }
            }
        }

        $.writeln('offsetKeyframes completed successfully');
        return {
            success: true
        };
    } catch (e) {
        $.writeln('offsetKeyframes error: ' + e.toString());
        return {
            error: e.toString()
        };
    }
}

/**
 * Calculate offsets for each item based on parameters
 */
this.timeOffset.calculateOffsets = function(count, params) {
    if (count === 0) return [];
    if (count === 1) return [0];

    var offsets = [];
    var rng = new timeOffset.SeededRandom(params.randomSeed);

    for (var i = 0; i < count; i++) {
        var t = i / (count - 1);

        var curveValue = timeOffset.cubicBezier(
            t,
            params.bezierPoints[0],
            params.bezierPoints[1],
            params.bezierPoints[2],
            params.bezierPoints[3]
        );

        var baseOffset = params.timeOffset * curveValue;

        var randomOffset = 0;
        if (params.randomMin !== 0 || params.randomMax !== 0) {
            var randomT = rng.random();
            randomOffset = params.randomMin + (params.randomMax - params.randomMin) * randomT;
        }

        var comp = app.project.activeItem;
        var frameDuration = comp.frameDuration;
        var totalOffset = (baseOffset + randomOffset) * frameDuration;

        offsets.push(totalOffset);
    }
    return offsets;
}