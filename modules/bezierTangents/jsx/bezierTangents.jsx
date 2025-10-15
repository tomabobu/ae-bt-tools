/**
 * Bezier Tangents Module
 * JSX implementation for After Effects
 */

// Private variables
this.bezierTangents._bezierValues = [0.40, 0.14, 0.30, 1.00];

/**
 * Convert AE influence/speed values to cubic-bezier.com style points
 */
this.bezierTangents.influenceSpeedToCubicBezier = function(outInfluence, outSpeed, inInfluence, inSpeed, timeDiff, valueDiff) {
    var p1x = outInfluence / 100.0;
    var p1y = (outSpeed * (outInfluence / 100.0) * timeDiff) / valueDiff;
    var p2x = 1.0 - (inInfluence / 100.0);
    var p2y = 1.0 - ((inSpeed * (inInfluence / 100.0) * timeDiff) / valueDiff);
    return [bezierTangents.roundTo(p1x, 3), bezierTangents.roundTo(p1y, 3), bezierTangents.roundTo(p2x, 3), bezierTangents.roundTo(p2y, 3)];
};

/**
 * Convert cubic-bezier.com style points to AE influence/speed values
 */
this.bezierTangents.cubicBezierToInfluenceSpeed = function(p1x, p1y, p2x, p2y, timeDiff, valueDiff) {
    var outInfluence = bezierTangents.clamp(p1x * 100.0, 0.1, 100.0);
    var outSpeed = (p1y * valueDiff) / ((outInfluence / 100.0) * timeDiff);
    var inInfluence = bezierTangents.clamp((1.0 - p2x) * 100.0, 0.1, 100.0);
    var inSpeed = ((1.0 - p2y) * valueDiff) / ((inInfluence / 100.0) * timeDiff);
    return {
        "out": [outInfluence, outSpeed],
        "in": [inInfluence, inSpeed]
    };
};

/**
 * Clamp a value between min and max
 */
this.bezierTangents.clamp = function(v, min, max) {
    return Math.max(min, Math.min(max, v));
};

/**
 * Calculate the maximum value difference between dimensions
 */
this.bezierTangents.calculateMaxValueDiff = function(val1, val2) {
    if (val1 instanceof Array && val2 instanceof Array) {
        var diffs = [];
        for (var i = 0; i < val1.length; i++) {
            diffs.push(Math.abs(val2[i] - val1[i]));
        }

        diffs.sort(function(a, b) {
            return b - a;
        });

        return diffs[0];
    } else {
        return Math.abs(val2 - val1);
    }
};

/**
 * Round a value to specified number of decimals
 */
this.bezierTangents.roundTo = function(val, decimals) {
    return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Get the first animatable property from a selection
 */
this.bezierTangents.getFirstAnimatableProperty = function(selProps) {
    for (var i = 0; i < selProps.length; i++) {
        var p = selProps[i];
        if (p.propertyType === PropertyType.PROPERTY && p.isTimeVarying && p.numKeys >= 2) {
            return p;
        }
    }
    return null;
};

/**
 * Get bezier values from the selected keyframes in After Effects
 */
this.bezierTangents.getBezierValues = function() {
    try {
        var comp = app.project.activeItem;
        if (!(comp && comp instanceof CompItem)) {
            return {
                error: "Select a composition first."
            };
        }

        var selProps = comp.selectedProperties;
        if (selProps.length === 0) {
            return {
                error: "Select a property with at least two keyframes."
            };
        }

        var prop = bezierTangents.getFirstAnimatableProperty(selProps);
        if (!prop) {
            return {
                error: "No suitable animated property found with at least two keyframes."
            };
        }

        var k1 = 1;
        var k2 = 2;
        var timeDiff = prop.keyTime(k2) - prop.keyTime(k1);

        var val1 = prop.valueAtTime(prop.keyTime(k1), false);
        var val2 = prop.valueAtTime(prop.keyTime(k2), false);

        var valueDiff = bezierTangents.calculateMaxValueDiff(val1, val2);
        if (valueDiff === 0) {
            valueDiff = 1;
        }

        var outEase = prop.keyOutTemporalEase(k1)[0];
        var inEase = prop.keyInTemporalEase(k2)[0];

        bezierTangents._bezierValues = bezierTangents.influenceSpeedToCubicBezier(
            outEase.influence, outEase.speed,
            inEase.influence, inEase.speed,
            timeDiff, valueDiff
        );

        return bezierTangents._bezierValues;
    } catch (e) {
        return {
            error: "Error getting bezier values: " + e.toString()
        };
    }
};

/**
 * Set bezier values to the selected keyframes in After Effects
 */
this.bezierTangents.setBezierValues = function(values) {
    try {
        if (!values || values.length !== 4) {
            return {
                error: "Invalid bezier values provided."
            };
        }
        var bezValues = values || bezierTangents._bezierValues;

        var comp = app.project.activeItem;
        if (!(comp && comp instanceof CompItem)) {
            return {
                error: "Select a composition first."
            };
        }

        var selProps = comp.selectedProperties;
        if (selProps.length === 0) {
            return {
                error: "Select a property with keyframes."
            };
        }


        app.beginUndoGroup("Set Bezier Values");

        try {
            for (var j = 0; j < selProps.length; j++) {
                var prop = selProps[j];
                if (!prop.isTimeVarying || prop.numKeys < 1) {
                    continue;
                }

                var timeDiff = (prop.numKeys > 1) ? (prop.keyTime(2) - prop.keyTime(1)) : 1;
                var val1 = (prop.numKeys > 1) ? prop.valueAtTime(prop.keyTime(1), false) : prop.valueAtTime(0, false);
                var val2 = (prop.numKeys > 1) ? prop.valueAtTime(prop.keyTime(2), false) : prop.valueAtTime(1, false);
                var valueDiff = bezierTangents.calculateMaxValueDiff(val1, val2) || 1;

                var infSpd = bezierTangents.cubicBezierToInfluenceSpeed(
                    bezValues[0], bezValues[1],
                    bezValues[2], bezValues[3],
                    timeDiff, valueDiff
                );

                for (var i = 1; i <= prop.numKeys; i++) {
                    if (!prop.keySelected(i)) {
                        continue; // Skip unselected keyframes
                    }
                    var easeIn = new KeyframeEase(infSpd["in"][1], infSpd["in"][0]);
                    var easeOut = new KeyframeEase(infSpd["out"][1], infSpd["out"][0]);

                    var dimensions = 1;
                    if (prop.keyInTemporalEase(i).length) {
                        dimensions = prop.keyInTemporalEase(i).length;
                    }

                    var easeInArray = [];
                    var easeOutArray = [];

                    for (var d = 0; d < dimensions; d++) {
                        easeInArray.push(easeIn);
                        easeOutArray.push(easeOut);
                    }

                    prop.setTemporalEaseAtKey(i, easeInArray, easeOutArray);
                }
            }

            app.endUndoGroup();
            return true;
        } catch (innerError) {
            app.endUndoGroup();
            // Undo the changes
            var undoFinder = (app.findMenuCommandId("Undo Set Bezier Values"));
            if (undoFinder) {
                app.executeCommand(undoFinder);
            }

            throw innerError;
        }
    } catch (e) {
        return {
            error: "Error setting bezier values: " + e.toString()
        };
    }
};

/**
 * Load state from JSON file
 */
this.bezierTangents.loadState = function() {
    try {
        if (typeof g_extensionPath === 'undefined') {
            return {
                error: "Extension path not defined"
            };
        }

        var filePath = g_extensionPath + "/modules/bezierTangents/assets/bezierTangents.json";
        var file = new File(filePath);

        if (!file.exists) {
            return {
                error: "State file not found"
            };
        }

        file.open("r");
        var content = file.read();
        file.close();

        var state = JSON.parse(content);
        return state;
    } catch (e) {
        return {
            error: "Error loading state: " + e.toString()
        };
    }
};

/**
 * Save state to JSON file
 */
this.bezierTangents.saveState = function(stateJson) {
    try {
        if (typeof g_extensionPath === 'undefined') {
            return {
                error: "Extension path not defined"
            };
        }

        var filePath = g_extensionPath + "/modules/bezierTangents/assets/bezierTangents.json";
        var file = new File(filePath);

        file.open("w");
        file.write(stateJson);
        file.close();

        return true;
    } catch (e) {
        return {
            error: "Error saving state: " + e.toString()
        };
    }
};