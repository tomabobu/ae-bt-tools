# After Effects CEP Extension - Module Creation Guide

## Extension Overview

This is a CEP (Common Extensibility Platform) extension for Adobe After Effects that uses a modular architecture with lazy loading. The extension provides a tabbed interface where each tab can contain one or more modules.

### Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Bridge**: CSInterface.js (Adobe CEP library)
- **Backend**: ExtendScript (JSX) running in After Effects
- **Build System**: No build process - direct file loading

---

## Extension Architecture

### Directory Structure
```
ae-bt-tools/
├── CSXS/
│   └── manifest.xml          # Extension manifest
├── index.html                # Main HTML file
├── css/
│   ├── main.css             # Global styles
│   └── tabs.css             # Tab system styles
├── js/
│   ├── libs/
│   │   └── CSInterface.js   # Adobe CEP interface
│   ├── main.js              # Application entry point
│   ├── config.js            # Module configuration & loader
│   ├── config.json          # User's tab configuration
│   ├── tabManager.js        # Tab management system
│   ├── modals.js            # Global modal system
│   ├── notifications.js     # Global notification system
│   ├── tooltip.js           # Global tooltip system
│   └── dragToAdjust.js      # Global drag-to-adjust utility
├── jsx/
│   └── hostscript.jsx       # Main JSX bridge script
└── modules/
    ├── moduleName/
    │   ├── index.js         # Module entry point
    │   ├── js/
    │   │   ├── moduleName.js    # Core module logic
    │   │   └── moduleNameUI.js  # UI construction & events
    │   ├── jsx/
    │   │   └── moduleName.jsx   # After Effects integration
    │   ├── css/
    │   │   └── moduleName.css   # Module-specific styles
    │   └── assets/
    │       └── (images, icons, etc.)
```

### Data Flow
```
User Action (UI)
    ↓
JavaScript (moduleNameUI.js)
    ↓
Core Logic (moduleName.js)
    ↓
CSInterface.evalScript()
    ↓
JSX Bridge (hostscript.jsx)
    ↓
Module JSX (moduleName.jsx)
    ↓
After Effects API
```

---

## Global Systems

### 1. Notification System (`js/notifications.js`)

The notification system displays temporary messages to users.

**Usage:**
```javascript
// Import is automatic - just use the global
NotificationSystem.success('Operation completed!');
NotificationSystem.error('Something went wrong');
NotificationSystem.warning('Please check your input');
NotificationSystem.info('Helpful information');

// Custom duration (default is 5000ms)
NotificationSystem.success('Quick message', 2000);
```

**Types:**
- `success` - Green border, for successful operations
- `error` - Red border, for errors
- `warning` - Orange border, for warnings
- `info` - Blue border, for informational messages

**Features:**
- Auto-dismiss after duration
- Slide-in animation from right
- Stack multiple notifications
- Click-through (doesn't block interaction)

---

### 2. Modal System (`js/modals.js`)

The modal system provides dialog boxes for user interaction.

**Types of Modals:**

#### Alert Modal
```javascript
ModalSystem.alert('File saved successfully!', {
    title: 'Success',
    confirmText: 'OK'
});
```

#### Confirm Modal
```javascript
ModalSystem.confirm('Are you sure you want to delete this?', {
    title: 'Confirm Delete',
    confirmText: 'Delete',
    cancelText: 'Cancel'
}).then((confirmed) => {
    if (confirmed) {
        // User clicked Delete
    }
});
```

#### Prompt Modal
```javascript
ModalSystem.prompt('Enter a name:', 'DefaultName', {
    title: 'Input Required',
    placeholder: 'Enter name...',
    inputType: 'text',
    validator: (value) => {
        if (!value) return 'Name is required';
        if (value.length < 3) return 'Name must be at least 3 characters';
        return true; // Valid
    }
}).then((value) => {
    if (value !== null) {
        // User entered: value
    }
});
```

#### Custom Modal
```javascript
ModalSystem.show({
    type: 'custom',
    content: `
        <div class="modal-header">
            <h3>Custom Dialog</h3>
        </div>
        <div class="modal-body">
            <p>Custom content here</p>
            <select id="my-dropdown">
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
            </select>
        </div>
        <div class="modal-footer">
            <button class="modal-btn modal-btn-secondary" data-action="cancel">Cancel</button>
            <button class="modal-btn modal-btn-primary" data-action="confirm">OK</button>
        </div>
    `,
    onConfirm: () => {
        const select = document.getElementById('my-dropdown');
        console.log('Selected:', select.value);
    },
    onCancel: () => {
        console.log('Cancelled');
    }
});
```

**Features:**
- ESC key to close
- Click overlay to close (optional)
- Promise-based API
- Built-in validation for prompts
- Overlay prevents interaction with background

---

### 3. Tooltip System (`js/tooltip.js`)

Provides hover tooltips for UI elements.

**Usage:**
```javascript
// Initialize tooltip system
TooltipSystem.init();

// Add tooltip via data attribute (recommended)
<button data-tooltip="Click to generate guides">Generate</button>

// Add tooltip programmatically
const button = document.getElementById('myButton');
TooltipSystem.addTooltip(button, 'This is a tooltip', {
    position: 'top',  // 'top', 'bottom', 'left', 'right'
    delay: 500        // Show after 500ms
});

// Remove tooltip
TooltipSystem.removeTooltip(button);
```

**Features:**
- Automatic positioning (avoids screen edges)
- Configurable delay
- Hover-based (no click required)
- Lightweight and performant

---

### 4. Drag to Adjust System (`js/dragToAdjust.js`)

Enables dragging on numeric inputs to adjust values.

**Usage:**
```javascript
// Initialize the system
DragToAdjust.init();

// Make an input draggable
const input = document.getElementById('opacity');
DragToAdjust.makeInputDraggable(input, {
    min: 0,
    max: 100,
    step: 1,
    sensitivity: 0.5,  // Pixels per value unit
    onChange: (value) => {
        console.log('Value changed to:', value);
    }
});

// Or use data attributes
<input type="number" 
       data-drag-adjust 
       data-min="0" 
       data-max="100" 
       data-step="0.1"
       value="50">
```

**Features:**
- Visual feedback (cursor changes)
- Respects min/max/step constraints
- Smooth dragging experience
- Works with decimal values
- Keyboard input still works normally

---

## Module Structure

### File Organization

Each module follows this structure:

```
modules/yourModule/
├── index.js              # Module entry point (required)
├── js/
│   ├── yourModule.js     # Core logic (recommended)
│   └── yourModuleUI.js   # UI construction (recommended)
├── jsx/
│   └── yourModule.jsx    # After Effects integration (if needed)
├── css/
│   └── yourModule.css    # Module styles (optional)
└── assets/
    └── (icons, images)   # Assets (optional)
```

---

### 1. Module Entry Point (`index.js`)

This is the main file that the extension loads. It must export specific methods.

**Template:**
```javascript
/**
 * Your Module Name - Entry Point
 */
var yourModule = (function () {
    let csInterface;
    let loadedScripts = [];
    let isInitialized = false;
    let currentContainer = null;

    /**
     * Initialize the module (called once on first load)
     */
    function init(cs) {
        if (isInitialized) {
            console.log('YourModule already initialized');
            return;
        }

        console.log('Initializing YourModule...');
        csInterface = cs;

        // Load module's JavaScript files
        loadScript('modules/yourModule/js/yourModule.js', function () {
            loadScript('modules/yourModule/js/yourModuleUI.js', function () {
                // Initialize core module
                if (typeof YourModule !== 'undefined') {
                    YourModule.init(csInterface);
                }
                
                isInitialized = true;
                console.log('YourModule initialized');
            });
        });
    }

    /**
     * Render the module (called when tab becomes active)
     */
    function render(container) {
        if (!container) {
            console.error('YourModule render: No container provided');
            return;
        }

        console.log('Rendering YourModule...');
        
        // Clear any existing content
        container.innerHTML = '';
        currentContainer = container;

        // Create module's UI container
        const modulePane = document.createElement('div');
        modulePane.id = 'yourModule';
        modulePane.className = 'module-content';
        container.appendChild(modulePane);

        // Wait for initialization if needed
        if (!isInitialized) {
            const checkInterval = setInterval(() => {
                if (isInitialized && typeof YourModuleUI !== 'undefined') {
                    clearInterval(checkInterval);
                    initializeUI(modulePane);
                }
            }, 50);
            
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!isInitialized) {
                    console.error('YourModule initialization timeout');
                    modulePane.innerHTML = `
                        <div style="padding: 20px; color: #ff6b6b;">
                            <h3>Your Module</h3>
                            <p>Failed to load module</p>
                        </div>
                    `;
                }
            }, 5000);
        } else {
            initializeUI(modulePane);
        }
    }

    /**
     * Initialize the UI
     */
    function initializeUI(modulePane) {
        if (typeof YourModuleUI !== 'undefined' && YourModuleUI.init) {
            YourModuleUI.init(csInterface, modulePane);
        } else {
            console.warn('YourModuleUI not available');
        }
    }

    /**
     * Cleanup the module (called when switching away from tab)
     */
    function cleanup(container) {
        if (!container) return;

        console.log('Cleaning up YourModule...');

        // Cleanup UI
        if (typeof YourModuleUI !== 'undefined' && YourModuleUI.cleanup) {
            YourModuleUI.cleanup();
        }

        // Clear container
        container.innerHTML = '';
        currentContainer = null;
    }

    /**
     * Load a script dynamically
     */
    function loadScript(url, callback) {
        const existingScript = loadedScripts.find(s => s.src && s.src.includes(url));
        if (existingScript) {
            console.log('Script already loaded:', url);
            if (callback) callback();
            return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            console.log('Script loaded:', url);
            if (callback) callback();
        };
        script.onerror = () => {
            console.error('Error loading script:', url);
        };
        document.head.appendChild(script);
        loadedScripts.push(script);
    }

    // Public API
    return {
        init: init,
        render: render,
        cleanup: cleanup
    };
})();
```

**Key Points:**
- Must export `init`, `render`, and `cleanup` methods
- Use module pattern (IIFE) to avoid global pollution
- Load scripts sequentially with callbacks
- Handle async initialization gracefully

---

### 2. Core Logic (`js/yourModule.js`)

Contains the business logic and state management.

**Template:**
```javascript
/**
 * Your Module - Core Logic
 */
var YourModule = (function () {
    let csInterface;
    let moduleState = {
        // Your state here
        selectedOption: 'default',
        values: []
    };

    /**
     * Initialize the core module
     */
    function init(cs) {
        csInterface = cs;
        console.log('YourModule core initialized');
        
        // Load saved state if needed
        loadState();
    }

    /**
     * Main module function
     */
    function doSomething(params) {
        console.log('Doing something with:', params);
        
        // Call JSX function
        callJSXFunction('functionName', [params], function(result) {
            if (result.error) {
                NotificationSystem.error(result.error);
            } else {
                NotificationSystem.success('Operation completed!');
                // Update UI if needed
                if (typeof YourModuleUI !== 'undefined') {
                    YourModuleUI.updateDisplay(result.result);
                }
            }
        });
    }

    /**
     * Call a JSX function
     */
    function callJSXFunction(functionName, args, callback) {
        // First load the JSX module if needed
        csInterface.evalScript(`loadModuleScript('yourModule')`, function(loaded) {
            if (loaded === 'true') {
                // Now call the function
                const argsJSON = JSON.stringify(args);
                csInterface.evalScript(
                    `callModuleFunction('yourModule', '${functionName}', ${argsJSON})`,
                    function(result) {
                        try {
                            const parsed = JSON.parse(result);
                            callback(parsed);
                        } catch (e) {
                            callback({ error: 'Failed to parse JSX response' });
                        }
                    }
                );
            } else {
                callback({ error: 'Failed to load JSX module' });
            }
        });
    }

    /**
     * Save state
     */
    function saveState() {
        localStorage.setItem('yourModule_state', JSON.stringify(moduleState));
    }

    /**
     * Load state
     */
    function loadState() {
        const saved = localStorage.getItem('yourModule_state');
        if (saved) {
            try {
                moduleState = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load state');
            }
        }
    }

    /**
     * Get current state
     */
    function getState() {
        return moduleState;
    }

    /**
     * Cleanup
     */
    function cleanup() {
        saveState();
    }

    // Public API
    return {
        init: init,
        doSomething: doSomething,
        getState: getState,
        cleanup: cleanup
    };
})();
```

**Key Points:**
- Manages module state
- Provides public API for UI to call
- Handles JSX communication
- Saves/loads state as needed

---

### 3. UI Construction (`js/yourModuleUI.js`)

Builds the user interface and handles user interactions.

**Template:**
```javascript
/**
 * Your Module - UI Construction
 */
var YourModuleUI = (function () {
    let csInterface;
    let container;
    let eventListeners = [];

    /**
     * Initialize the UI
     */
    function init(cs, containerElement) {
        csInterface = cs;
        container = containerElement;

        console.log('YourModuleUI initializing...');

        // Build the UI
        buildUI();

        // Setup event listeners
        setupEventListeners();

        console.log('YourModuleUI initialized');
    }

    /**
     * Build the user interface
     */
    function buildUI() {
        container.innerHTML = `
            <div class="your-module-wrapper">
                <div class="your-module-header">
                    <h2>Your Module Title</h2>
                    <button id="refresh-btn" class="btn btn-small" data-tooltip="Refresh data">
                        🔄
                    </button>
                </div>

                <div class="your-module-content">
                    <div class="form-group">
                        <label for="option-select">Select Option:</label>
                        <select id="option-select" class="form-control">
                            <option value="option1">Option 1</option>
                            <option value="option2">Option 2</option>
                            <option value="option3">Option 3</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="value-input">Value:</label>
                        <input type="number" 
                               id="value-input" 
                               class="form-control"
                               data-drag-adjust
                               data-min="0"
                               data-max="100"
                               value="50">
                    </div>

                    <div class="button-group">
                        <button id="apply-btn" class="btn btn-primary">
                            Apply
                        </button>
                        <button id="reset-btn" class="btn btn-secondary">
                            Reset
                        </button>
                    </div>
                </div>

                <div id="results-area" class="your-module-results">
                    <!-- Results will be displayed here -->
                </div>
            </div>
        `;

        // Initialize tooltips
        if (typeof TooltipSystem !== 'undefined') {
            TooltipSystem.init();
        }

        // Initialize drag-to-adjust
        if (typeof DragToAdjust !== 'undefined') {
            DragToAdjust.init();
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Apply button
        const applyBtn = container.querySelector('#apply-btn');
        const applyHandler = () => handleApply();
        applyBtn.addEventListener('click', applyHandler);
        trackListener(applyBtn, 'click', applyHandler);

        // Reset button
        const resetBtn = container.querySelector('#reset-btn');
        const resetHandler = () => handleReset();
        resetBtn.addEventListener('click', resetHandler);
        trackListener(resetBtn, 'click', resetHandler);

        // Refresh button
        const refreshBtn = container.querySelector('#refresh-btn');
        const refreshHandler = () => handleRefresh();
        refreshBtn.addEventListener('click', refreshHandler);
        trackListener(refreshBtn, 'click', refreshHandler);

        // Option select change
        const optionSelect = container.querySelector('#option-select');
        const selectHandler = (e) => handleOptionChange(e.target.value);
        optionSelect.addEventListener('change', selectHandler);
        trackListener(optionSelect, 'change', selectHandler);
    }

    /**
     * Track event listener for cleanup
     */
    function trackListener(element, event, handler) {
        eventListeners.push({ element, event, handler });
    }

    /**
     * Handle apply button click
     */
    function handleApply() {
        const option = container.querySelector('#option-select').value;
        const value = parseFloat(container.querySelector('#value-input').value);

        // Validate input
        if (isNaN(value)) {
            NotificationSystem.warning('Please enter a valid number');
            return;
        }

        // Call core module function
        if (typeof YourModule !== 'undefined') {
            YourModule.doSomething({ option, value });
        }
    }

    /**
     * Handle reset button click
     */
    function handleReset() {
        ModalSystem.confirm('Reset all values to default?', {
            title: 'Confirm Reset',
            confirmText: 'Reset',
            cancelText: 'Cancel'
        }).then((confirmed) => {
            if (confirmed) {
                container.querySelector('#option-select').value = 'option1';
                container.querySelector('#value-input').value = '50';
                NotificationSystem.success('Values reset');
            }
        });
    }

    /**
     * Handle refresh button click
     */
    function handleRefresh() {
        // Refresh data from After Effects
        NotificationSystem.info('Refreshing...');
        // Implementation here
    }

    /**
     * Handle option change
     */
    function handleOptionChange(value) {
        console.log('Option changed to:', value);
        // Update UI based on selection
    }

    /**
     * Update display with new data
     */
    function updateDisplay(data) {
        const resultsArea = container.querySelector('#results-area');
        resultsArea.innerHTML = `
            <div class="result-item">
                <strong>Result:</strong> ${JSON.stringify(data)}
            </div>
        `;
    }

    /**
     * Cleanup the UI
     */
    function cleanup() {
        console.log('YourModuleUI cleaning up...');

        // Remove all event listeners
        eventListeners.forEach(({ element, event, handler }) => {
            if (element) {
                element.removeEventListener(event, handler);
            }
        });
        eventListeners = [];

        // Clear container reference
        container = null;
    }

    // Public API
    return {
        init: init,
        updateDisplay: updateDisplay,
        cleanup: cleanup
    };
})();
```

**Key Points:**
- Builds HTML structure programmatically
- Uses global systems (modals, notifications, tooltips)
- Tracks event listeners for proper cleanup
- Provides methods for core logic to update UI
- Always cleanup event listeners on module unload

---

### 4. JSX Integration (`jsx/yourModule.jsx`)

Interfaces with After Effects API.

**Template:**
```javascript
/**
 * Your Module - JSX (After Effects Integration)
 * This code runs in the ExtendScript engine inside After Effects
 */

// Create global module object
if (typeof yourModule === 'undefined') {
    var yourModule = {};
}

(function() {
    /**
     * Initialize the JSX module
     */
    yourModule.init = function() {
        // Initialization code if needed
    };

    /**
     * Example function: Get project info
     */
    yourModule.getProjectInfo = function() {
        try {
            if (!app.project) {
                return { error: 'No project open' };
            }

            return {
                name: app.project.file ? app.project.file.name : 'Untitled',
                numItems: app.project.numItems,
                activeItem: app.project.activeItem ? app.project.activeItem.name : 'None'
            };
        } catch (e) {
            return { error: e.toString() };
        }
    };

    /**
     * Example function: Create solid layer
     */
    yourModule.createSolid = function(name, color, width, height) {
        try {
            var comp = app.project.activeItem;
            
            if (!comp || !(comp instanceof CompItem)) {
                return { error: 'No active composition' };
            }

            // Parse color (expects array [R, G, B])
            var colorArray = typeof color === 'string' ? JSON.parse(color) : color;
            
            // Normalize color values (0-1)
            var normalizedColor = [
                colorArray[0] / 255,
                colorArray[1] / 255,
                colorArray[2] / 255
            ];

            // Create solid
            var solid = comp.layers.addSolid(
                normalizedColor,
                name,
                width,
                height,
                1.0  // pixelAspect
            );

            return {
                success: true,
                layerName: solid.name,
                layerIndex: solid.index
            };
        } catch (e) {
            return { error: e.toString() };
        }
    };

    /**
     * Example function: Get selected layers
     */
    yourModule.getSelectedLayers = function() {
        try {
            var comp = app.project.activeItem;
            
            if (!comp || !(comp instanceof CompItem)) {
                return { error: 'No active composition' };
            }

            var selected = comp.selectedLayers;
            var layerInfo = [];

            for (var i = 0; i < selected.length; i++) {
                layerInfo.push({
                    name: selected[i].name,
                    index: selected[i].index,
                    enabled: selected[i].enabled,
                    locked: selected[i].locked
                });
            }

            return { layers: layerInfo };
        } catch (e) {
            return { error: e.toString() };
        }
    };

    /**
     * Example function: Apply effect to layer
     */
    yourModule.applyEffect = function(layerIndex, effectName) {
        try {
            var comp = app.project.activeItem;
            
            if (!comp || !(comp instanceof CompItem)) {
                return { error: 'No active composition' };
            }

            if (layerIndex < 1 || layerIndex > comp.numLayers) {
                return { error: 'Invalid layer index' };
            }

            var layer = comp.layer(layerIndex);
            var effect = layer.property("ADBE Effect Parade").addProperty(effectName);

            return {
                success: true,
                effectName: effect.name
            };
        } catch (e) {
            return { error: e.toString() };
        }
    };

    /**
     * Example function: Undo
     */
    yourModule.undo = function() {
        try {
            app.executeCommand(16);  // Edit > Undo
            return { success: true };
        } catch (e) {
            return { error: e.toString() };
        }
    };

})();
```

**Key Points:**
- Create global object: `var yourModule = {};`
- Define functions as properties: `yourModule.functionName = function() { ... }`
- Always return objects (for JSON serialization)
- Always use try-catch for error handling
- Return `{ error: 'message' }` on failure
- Return `{ result: data }` or `{ success: true }` on success
- Use ExtendScript syntax (ES3)

**Common After Effects Objects:**
- `app.project` - Current project
- `app.project.activeItem` - Active composition
- `CompItem` - Composition
- `comp.layers` - Layer collection
- `comp.selectedLayers` - Selected layers array
- `layer.property()` - Access layer properties
- `app.executeCommand(id)` - Execute menu commands

---

### 5. Module Styles (`css/yourModule.css`)

**Template:**
```css
/* Your Module Styles */

.your-module-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 15px;
    box-sizing: border-box;
}

.your-module-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #404040;
}

.your-module-header h2 {
    margin: 0;
    color: #e0e0e0;
    font-size: 18px;
    font-weight: 500;
}

.your-module-content {
    flex: 0 0 auto;
}

.your-module-results {
    flex: 1;
    overflow-y: auto;
    margin-top: 20px;
    padding: 15px;
    background: #1a1a1a;
    border: 1px solid #404040;
    border-radius: 4px;
}

/* Form Elements */
.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    color: #a0a0a0;
    font-size: 13px;
}

.form-control {
    width: 100%;
    padding: 8px 12px;
    background: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 4px;
    color: #e0e0e0;
    font-size: 13px;
    box-sizing: border-box;
}

.form-control:focus {
    outline: none;
    border-color: #4a9eff;
}

/* Buttons */
.button-group {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
}

.btn-primary {
    background: #4a9eff;
    color: #ffffff;
}

.btn-primary:hover {
    background: #5fadff;
}

.btn-secondary {
    background: #3a3a3a;
    color: #e0e0e0;
    border: 1px solid #404040;
}

.btn-secondary:hover {
    background: #454545;
}

.btn-small {
    padding: 6px 12px;
    font-size: 12px;
}

/* Results */
.result-item {
    padding: 10px;
    margin-bottom: 10px;
    background: #2a2a2a;
    border-radius: 4px;
    color: #c0c0c0;
    font-size: 13px;
}

.result-item strong {
    color: #4a9eff;
}

/* Scrollbar */
.your-module-results::-webkit-scrollbar {
    width: 10px;
}

.your-module-results::-webkit-scrollbar-track {
    background: #1a1a1a;
}

.your-module-results::-webkit-scrollbar-thumb {
    background: #404040;
    border-radius: 5px;
}

.your-module-results::-webkit-scrollbar-thumb:hover {
    background: #505050;
}
```

---

## Communication Flow

### JavaScript to JSX

**Step 1: Load JSX Module**
```javascript
csInterface.evalScript(`loadModuleScript('yourModule')`, function(loaded) {
    // loaded will be 'true' or 'false'
});
```

**Step 2: Call JSX Function**
```javascript
const args = [param1, param2];
const argsJSON = JSON.stringify(args);

csInterface.evalScript(
    `callModuleFunction('yourModule', 'functionName', ${argsJSON})`,
    function(result) {
        const parsed = JSON.parse(result);
        if (parsed.error) {
            console.error(parsed.error);
        } else {
            console.log(parsed.result);
        }
    }
);
```

**Complete Example:**
```javascript
// In yourModule.js
function createSolidLayer(name, color, width, height) {
    csInterface.evalScript(`loadModuleScript('yourModule')`, function(loaded) {
        if (loaded === 'true') {
            const args = [name, color, width, height];
            const argsJSON = JSON.stringify(args);
            
            csInterface.evalScript(
                `callModuleFunction('yourModule', 'createSolid', ${argsJSON})`,
                function(result) {
                    try {
                        const parsed = JSON.parse(result);
                        if (parsed.error) {
                            NotificationSystem.error(parsed.error);
                        } else {
                            NotificationSystem.success('Solid created: ' + parsed.result.layerName);
                        }
                    } catch (e) {
                        NotificationSystem.error('Failed to parse response');
                    }
                }
            );
        } else {
            NotificationSystem.error('Failed to load JSX module');
        }
    });
}
```

### JSX Function Definition Pattern

**Pattern 1: Simple Function**
```javascript
// In jsx/yourModule.jsx
yourModule.simpleFunction = function() {
    try {
        // Do something in After Effects
        var result = "Success";
        return { result: result };
    } catch (e) {
        return { error: e.toString() };
    }
};
```

**Pattern 2: Function with Parameters**
```javascript
// In jsx/yourModule.jsx
yourModule.functionWithParams = function(param1, param2, param3) {
    try {
        // param1, param2, param3 are passed from JavaScript
        // They are automatically parsed from JSON
        
        var result = param1 + param2 + param3;
        return { result: result };
    } catch (e) {
        return { error: e.toString() };
    }
};
```

**Pattern 3: Function Returning Complex Data**
```javascript
// In jsx/yourModule.jsx
yourModule.getComplexData = function() {
    try {
        var data = {
            projectName: app.project.file ? app.project.file.name : "Untitled",
            compositions: [],
            selectedLayers: []
        };
        
        // Gather compositions
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem) {
                data.compositions.push({
                    name: item.name,
                    width: item.width,
                    height: item.height,
                    duration: item.duration
                });
            }
        }
        
        // Gather selected layers
        var comp = app.project.activeItem;
        if (comp && comp instanceof CompItem) {
            var selected = comp.selectedLayers;
            for (var j = 0; j < selected.length; j++) {
                data.selectedLayers.push({
                    name: selected[j].name,
                    index: selected[j].index
                });
            }
        }
        
        return { result: data };
    } catch (e) {
        return { error: e.toString() };
    }
};
```

**Pattern 4: Function with Undo Group**
```javascript
// In jsx/yourModule.jsx
yourModule.batchOperation = function(layers, operation) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return { error: 'No active composition' };
        }
        
        // Begin undo group for atomic operation
        app.beginUndoGroup("Batch Operation");
        
        var processed = [];
        for (var i = 0; i < layers.length; i++) {
            var layerIndex = layers[i];
            var layer = comp.layer(layerIndex);
            
            // Perform operation
            switch(operation) {
                case 'lock':
                    layer.locked = true;
                    break;
                case 'unlock':
                    layer.locked = false;
                    break;
                case 'solo':
                    layer.solo = true;
                    break;
            }
            
            processed.push(layer.name);
        }
        
        app.endUndoGroup();
        
        return { 
            result: {
                processed: processed.length,
                layers: processed
            }
        };
    } catch (e) {
        app.endUndoGroup();
        return { error: e.toString() };
    }
};
```

---

## Module Registration

### Adding Your Module to the Extension

**Step 1: Update `js/config.js`**
```javascript
const ModuleConfig = {
    "bezierTangents": "Animation Tangent",
    "colorSwatches": "Colors Library",
    "guideGenerator": "Guides",
    "yourModule": "Your Module Name"  // Add your module here
};
```

**Step 2: Module Auto-Discovery**

The module loader will automatically:
1. Look for `modules/yourModule/index.js`
2. Load the module when its tab is activated (lazy loading)
3. Call `init(csInterface)` once
4. Call `render(container)` when tab becomes active
5. Call `cleanup(container)` when tab becomes inactive

**Step 3: Default Tab Configuration (Optional)**

Edit `js/config.json` to include your module in the default layout:
```json
{
  "tabs": [
    {
      "modules": [
        {
          "id": "yourModule",
          "height": 100
        }
      ]
    }
  ]
}
```

---

## Best Practices

### 1. Error Handling

**Always handle errors gracefully:**
```javascript
// In JavaScript
function doOperation() {
    if (!validateInput()) {
        NotificationSystem.warning('Invalid input');
        return;
    }
    
    callJSX('operation', [param], function(result) {
        if (result.error) {
            NotificationSystem.error('Operation failed: ' + result.error);
        } else {
            NotificationSystem.success('Operation completed');
        }
    });
}

// In JSX
yourModule.operation = function(param) {
    try {
        if (!param) {
            return { error: 'Parameter is required' };
        }
        
        // Do operation
        return { result: 'Success' };
    } catch (e) {
        return { error: e.toString() };
    }
};
```

### 2. State Management

**Keep state in JavaScript, not DOM:**
```javascript
// GOOD
var ModuleState = {
    selectedOption: 'option1',
    values: [1, 2, 3],
    dirty: false
};

function updateOption(newOption) {
    ModuleState.selectedOption = newOption;
    ModuleState.dirty = true;
    updateUI();
}

// BAD - Don't rely on DOM for state
function getOption() {
    return document.getElementById('select').value; // Fragile
}
```

### 3. Event Listener Cleanup

**Always track and remove event listeners:**
```javascript
var eventListeners = [];

function setupEvents() {
    const button = document.getElementById('btn');
    const handler = () => doSomething();
    
    button.addEventListener('click', handler);
    eventListeners.push({ element: button, event: 'click', handler: handler });
}

function cleanup() {
    eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
    });
    eventListeners = [];
}
```

### 4. Async Operations

**Use callbacks or promises for async operations:**
```javascript
// Callback pattern
function loadData(callback) {
    callJSX('getData', [], function(result) {
        if (result.error) {
            callback(null, result.error);
        } else {
            callback(result.result, null);
        }
    });
}

// Usage
loadData(function(data, error) {
    if (error) {
        NotificationSystem.error(error);
    } else {
        displayData(data);
    }
});

// Promise pattern (wrapper)
function loadDataPromise() {
    return new Promise((resolve, reject) => {
        loadData(function(data, error) {
            if (error) reject(error);
            else resolve(data);
        });
    });
}

// Usage
loadDataPromise()
    .then(data => displayData(data))
    .catch(error => NotificationSystem.error(error));
```

### 5. Performance

**Optimize for performance:**
```javascript
// Debounce frequent operations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Usage
const debouncedUpdate = debounce(function(value) {
    updatePreview(value);
}, 300);

input.addEventListener('input', (e) => {
    debouncedUpdate(e.target.value);
});

// Cache JSX results when possible
var cache = {};

function getCachedData(key, fetcher) {
    if (cache[key]) {
        return Promise.resolve(cache[key]);
    }
    
    return fetcher().then(data => {
        cache[key] = data;
        return data;
    });
}
```

### 6. User Feedback

**Always provide feedback for user actions:**
```javascript
function performLongOperation() {
    // Show loading state
    NotificationSystem.info('Processing...');
    const button = document.getElementById('apply-btn');
    button.disabled = true;
    button.textContent = 'Processing...';
    
    callJSX('longOperation', [], function(result) {
        // Re-enable button
        button.disabled = false;
        button.textContent = 'Apply';
        
        // Show result
        if (result.error) {
            NotificationSystem.error('Operation failed');
        } else {
            NotificationSystem.success('Operation completed!');
        }
    });
}
```

---

## Common Patterns

### Pattern 1: Load List from After Effects

```javascript
// JavaScript
function loadCompositions() {
    callJSX('getCompositions', [], function(result) {
        if (result.error) {
            NotificationSystem.error(result.error);
        } else {
            populateDropdown(result.result);
        }
    });
}

function populateDropdown(compositions) {
    const select = document.getElementById('comp-select');
    select.innerHTML = '<option value="">Select a composition</option>';
    
    compositions.forEach(comp => {
        const option = document.createElement('option');
        option.value = comp.id;
        option.textContent = comp.name;
        select.appendChild(option);
    });
}

// JSX
yourModule.getCompositions = function() {
    try {
        var comps = [];
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem) {
                comps.push({
                    id: i,
                    name: item.name,
                    width: item.width,
                    height: item.height
                });
            }
        }
        return { result: comps };
    } catch (e) {
        return { error: e.toString() };
    }
};
```

### Pattern 2: Apply Settings to Selection

```javascript
// JavaScript
function applyToSelection() {
    const settings = {
        opacity: parseFloat(document.getElementById('opacity').value),
        scale: parseFloat(document.getElementById('scale').value),
        color: getSelectedColor()
    };
    
    callJSX('applySettings', [settings], function(result) {
        if (result.error) {
            NotificationSystem.error(result.error);
        } else {
            NotificationSystem.success(`Applied to ${result.result.count} layers`);
        }
    });
}

// JSX
yourModule.applySettings = function(settings) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return { error: 'No active composition' };
        }
        
        var selected = comp.selectedLayers;
        if (selected.length === 0) {
            return { error: 'No layers selected' };
        }
        
        app.beginUndoGroup("Apply Settings");
        
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            
            // Apply opacity
            layer.property("ADBE Transform Group")
                .property("ADBE Opacity")
                .setValue(settings.opacity);
            
            // Apply scale
            var scale = settings.scale;
            layer.property("ADBE Transform Group")
                .property("ADBE Scale")
                .setValue([scale, scale]);
        }
        
        app.endUndoGroup();
        
        return { result: { count: selected.length } };
    } catch (e) {
        app.endUndoGroup();
        return { error: e.toString() };
    }
};
```

### Pattern 3: Generate Multiple Items

```javascript
// JavaScript
function generateGrid() {
    const params = {
        rows: parseInt(document.getElementById('rows').value),
        cols: parseInt(document.getElementById('cols').value),
        spacing: parseInt(document.getElementById('spacing').value),
        itemType: document.getElementById('type').value
    };
    
    // Validate
    if (params.rows < 1 || params.cols < 1) {
        NotificationSystem.warning('Rows and columns must be at least 1');
        return;
    }
    
    NotificationSystem.info('Generating grid...');
    
    callJSX('generateGrid', [params], function(result) {
        if (result.error) {
            NotificationSystem.error(result.error);
        } else {
            NotificationSystem.success(`Created ${result.result.created} items`);
        }
    });
}

// JSX
yourModule.generateGrid = function(params) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return { error: 'No active composition' };
        }
        
        app.beginUndoGroup("Generate Grid");
        
        var created = 0;
        var itemWidth = 100;
        var itemHeight = 100;
        
        for (var row = 0; row < params.rows; row++) {
            for (var col = 0; col < params.cols; col++) {
                var x = col * (itemWidth + params.spacing);
                var y = row * (itemHeight + params.spacing);
                
                var layer;
                if (params.itemType === 'solid') {
                    layer = comp.layers.addSolid(
                        [1, 1, 1],
                        "Grid Item " + (created + 1),
                        itemWidth,
                        itemHeight,
                        1.0
                    );
                } else if (params.itemType === 'null') {
                    layer = comp.layers.addNull();
                    layer.name = "Grid Item " + (created + 1);
                }
                
                // Position layer
                layer.property("ADBE Transform Group")
                    .property("ADBE Position")
                    .setValue([x + itemWidth / 2, y + itemHeight / 2]);
                
                created++;
            }
        }
        
        app.endUndoGroup();
        
        return { result: { created: created } };
    } catch (e) {
        app.endUndoGroup();
        return { error: e.toString() };
    }
};
```

### Pattern 4: Preview Before Apply

```javascript
// JavaScript
var previewLayer = null;

function showPreview() {
    const settings = getCurrentSettings();
    
    callJSX('createPreview', [settings], function(result) {
        if (result.error) {
            NotificationSystem.error(result.error);
        } else {
            previewLayer = result.result.layerIndex;
            document.getElementById('apply-btn').disabled = false;
            NotificationSystem.info('Preview created');
        }
    });
}

function applyPreview() {
    if (!previewLayer) {
        NotificationSystem.warning('No preview to apply');
        return;
    }
    
    callJSX('applyPreview', [previewLayer], function(result) {
        if (result.error) {
            NotificationSystem.error(result.error);
        } else {
            previewLayer = null;
            NotificationSystem.success('Applied successfully');
        }
    });
}

function cancelPreview() {
    if (!previewLayer) return;
    
    callJSX('removePreview', [previewLayer], function(result) {
        previewLayer = null;
        NotificationSystem.info('Preview cancelled');
    });
}

// JSX
yourModule.createPreview = function(settings) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return { error: 'No active composition' };
        }
        
        // Create preview layer
        var layer = comp.layers.addSolid(
            [1, 0, 0],
            "PREVIEW - Do not use",
            settings.width,
            settings.height,
            1.0
        );
        
        layer.label = 1; // Red label for preview
        
        return { result: { layerIndex: layer.index } };
    } catch (e) {
        return { error: e.toString() };
    }
};

yourModule.applyPreview = function(layerIndex) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return { error: 'No active composition' };
        }
        
        var layer = comp.layer(layerIndex);
        layer.name = layer.name.replace("PREVIEW - Do not use", "Applied Layer");
        layer.label = 0; // Remove red label
        
        return { result: { success: true } };
    } catch (e) {
        return { error: e.toString() };
    }
};

yourModule.removePreview = function(layerIndex) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return { error: 'No active composition' };
        }
        
        var layer = comp.layer(layerIndex);
        layer.remove();
        
        return { result: { success: true } };
    } catch (e) {
        return { error: e.toString() };
    }
};
```

---

## Testing Your Module

### Manual Testing Checklist

- [ ] Module loads without errors
- [ ] UI renders correctly
- [ ] All buttons respond to clicks
- [ ] JSX functions return expected results
- [ ] Error messages display for invalid input
- [ ] Success messages display for valid operations
- [ ] Module cleans up when switching tabs
- [ ] Module re-renders correctly when returning to tab
- [ ] No console errors
- [ ] No memory leaks (event listeners removed)

### Debug Mode

Add debug logging to your module:

```javascript
var DEBUG = true;

function log(message, data) {
    if (DEBUG) {
        console.log('[YourModule]', message, data || '');
    }
}

function logError(message, error) {
    console.error('[YourModule]', message, error);
}

// Usage
log('Initializing module');
log('Settings loaded', settings);
logError('Failed to load data', error);
```

---

## Summary

### Quick Start Checklist

1. **Create module folder**: `modules/yourModule/`
2. **Create index.js**: Entry point with init/render/cleanup
3. **Create js/yourModule.js**: Core logic
4. **Create js/yourModuleUI.js**: UI construction
5. **Create jsx/yourModule.jsx**: After Effects integration
6. **Create css/yourModule.css**: Styling
7. **Update js/config.js**: Add to ModuleConfig
8. **Test**: Load extension and verify functionality

### Key Principles

- **Lazy Loading**: Modules load when first needed
- **Clean Separation**: index.js → js files → jsx files
- **Global Systems**: Use modals, notifications, tooltips
- **Proper Cleanup**: Remove event listeners on unload
- **Error Handling**: Always try-catch in JSX
- **User Feedback**: Notify users of all actions
- **State Management**: Keep state in JavaScript, not DOM

### Resources

- CSInterface API: Adobe CEP documentation
- ExtendScript: After Effects Scripting Guide
- Module Examples: Study existing modules in `/modules/`

---

## Example: Complete Minimal Module

Here's a complete working module as a reference:

**modules/simpleModule/index.js:**
```javascript
var simpleModule = (function () {
    let csInterface;
    let isInitialized = false;
    
    function init(cs) {
        if (isInitialized) return;
        csInterface = cs;
        isInitialized = true;
    }
    
    function render(container) {
        container.innerHTML = '';
        container.innerHTML = `
            <div style="padding: 20px;">
                <h2>Simple Module</h2>
                <button id="test-btn">Test</button>
            </div>
        `;
        
        document.getElementById('test-btn').addEventListener('click', () => {
            NotificationSystem.success('Button clicked!');
        });
    }
    
    function cleanup(container) {
        container.innerHTML = '';
    }
    
    return { init, render, cleanup };
})();
```

That's it! You now have everything you need to create new modules for this After Effects extension.