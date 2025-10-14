/**
 * Bezier Tangents UI Module
 */
var BezierTangentsUI = (function () {
    // Private variables
    let csInterface;
    let bezierValues = [0.40, 0.14, 0.30, 1.00]; // Default cubic-bezier style values
    let bezierEditor;

    // Resize handle variables
    let resizeHandle = null;
    let canvasContainer = null;
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;
    let minHeight = 150;
    let maxHeight = 600;

    /**
     * Initialize the module's UI
     */
    function init(cs) {
        csInterface = cs;

        // Create module UI container
        const container = document.getElementById('bezierTangents');

        buildUI(container);
    }

    /**
     * Build the main UI
     */
    function buildUI(container) {
        container.innerHTML = `
            <div class="bezier-editor-container">
                <div id="bezier-canvas-container" class="bezier-canvas-container">
                    <!-- Bezier editor will be injected here -->
                </div>
                
                <div class="bezier-controls">
                    <div id="bezier-values-display" class="bezier-values-display">
                        Bezier Values: ${bezierValues.join(', ')}
                    </div>
                    
                    <div class="button-row">
                        <button id="btn-get-bezier">Get from Keyframes</button>
                        <button id="btn-set-bezier">Apply to Keyframes</button>
                        <button id="btn-manual-bezier">Manual Input</button>
                    </div>
                    
                    <div id="bezier-manual-input" class="bezier-manual-input" style="display: none;">
                        <input type="text" id="manual-bezier-input" value="${bezierValues.join(', ')}" placeholder="e.g., 0.4, 0.14, 0.3, 1">
                        <button id="btn-accept-manual">Accept</button>
                        <button id="btn-cancel-manual" class="secondary">Cancel</button>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <h3>Presets</h3>
                    <div id="bezier-presets" class="bezier-presets">
                        <!-- Preset buttons will be added here -->
                    </div>
                </div>
            </div>
        `;

        // Get reference to canvas container
        canvasContainer = document.getElementById('bezier-canvas-container');

        // Load saved height before initializing editor
        loadSavedHeight();

        // Initialize the cubic bezier editor
        initBezierEditor();

        // Initialize resize handle
        initResizeHandle();

        // Set up event listeners
        setupEventListeners();
    }

    /**
     * Initialize the cubic bezier editor
     */
    function initBezierEditor() {
        bezierEditor = new CubicBezierEditor('#bezier-canvas-container', {
            defaultValues: bezierValues,
            showPreview: false,
            showGrid: true,
            onChange: function (values) {
                bezierValues = values;
                updateValueDisplay();
            }
        });

        // Add preset buttons to the presets container
        const presetContainer = document.getElementById('bezier-presets');

        // Common easing presets
        const presets = [
            { name: 'linear', values: [0, 0, 1, 1], label: 'Linear' },
            { name: 'ease', values: [0.25, 0.1, 0.25, 1], label: 'Ease' },
            { name: 'ease-in', values: [0.42, 0, 1, 1], label: 'Ease In' },
            { name: 'ease-out', values: [0, 0, 0.58, 1], label: 'Ease Out' },
            { name: 'ease-in-out', values: [0.42, 0, 0.58, 1], label: 'Ease InOut' },
            { name: 'bounce', values: [0.175, 0.885, 0.32, 1.275], label: 'Bounce' },
            { name: 'snappy', values: [0.1, 1.5, 0.2, 1], label: 'Snappy' },
            { name: 'slow-start', values: [0.8, 0, 0.2, 1], label: 'Slow Start' }
        ];

        presets.forEach(preset => {
            const presetBtn = document.createElement('button');
            presetBtn.className = 'bezier-preset';
            presetBtn.setAttribute('data-preset', preset.name);
            presetBtn.setAttribute('title', preset.label);

            // Create a small visualization of the curve
            const curve = document.createElement('div');
            curve.className = 'bezier-preset-curve';
            curve.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M0,24 C${preset.values[0] * 24},${24 - (preset.values[1] * 24)} ${preset.values[2] * 24},${24 - (preset.values[3] * 24)} 24,0' stroke='%23ffffff' fill='none' /%3E%3C/svg%3E")`;

            presetBtn.appendChild(curve);
            presetContainer.appendChild(presetBtn);

            // Add click event
            presetBtn.addEventListener('click', function () {
                bezierValues = preset.values.slice();
                bezierEditor.setValues(bezierValues);
                updateValueDisplay();
            });
        });
    }

    /**
     * Initialize the resize handle
     */
    function initResizeHandle() {
        if (!canvasContainer) {
            console.error('Canvas container not found');
            return;
        }

        // Create resize handle
        resizeHandle = document.createElement('div');
        resizeHandle.className = 'bezier-resize-handle';
        resizeHandle.innerHTML = '<div class="resize-handle-bar"></div>';

        // Insert handle after the canvas container
        canvasContainer.parentElement.insertBefore(resizeHandle, canvasContainer.nextSibling);

        // Add event listeners
        resizeHandle.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', performResize);
        document.addEventListener('mouseup', stopResize);
    }

    /**
     * Load saved height from storage
     */
    function loadSavedHeight() {
        if (!canvasContainer) return;

        try {
            const savedHeight = localStorage.getItem('bezierCurveHeight');
            if (savedHeight) {
                const height = parseInt(savedHeight, 10);
                if (height >= minHeight && height <= maxHeight) {
                    canvasContainer.style.height = height + 'px';
                }
            }
        } catch (e) {
            console.warn('Could not load saved curve height:', e);
        }
    }

    /**
     * Start resizing
     */
    function startResize(e) {
        e.preventDefault();
        isResizing = true;
        startY = e.clientY;
        startHeight = canvasContainer.offsetHeight;
        resizeHandle.classList.add('active');
        document.body.style.cursor = 'ns-resize';
    }

    /**
     * Perform resize while dragging
     */
    function performResize(e) {
        if (!isResizing) return;

        e.preventDefault();
        const deltaY = e.clientY - startY;
        const newHeight = startHeight + deltaY;

        // Constrain to min/max height
        const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

        canvasContainer.style.height = constrainedHeight + 'px';

        // Trigger canvas redraw if the editor has a resize method
        if (bezierEditor && typeof bezierEditor.resize === 'function') {
            bezierEditor.resize();
        }
    }

    /**
     * Stop resizing
     */
    function stopResize(e) {
        if (!isResizing) return;

        isResizing = false;
        resizeHandle.classList.remove('active');
        document.body.style.cursor = 'default';

        // Save the height to localStorage for persistence
        const finalHeight = canvasContainer.offsetHeight;
        try {
            localStorage.setItem('bezierCurveHeight', finalHeight);
        } catch (e) {
            console.warn('Could not save curve height:', e);
        }
    }

    /**
     * Set up event listeners for the UI controls
     */
    function setupEventListeners() {
        // Get button - fetches values from selected keyframes
        document.getElementById('btn-get-bezier').addEventListener('click', getBezierValues);

        // Set button - applies values to selected keyframes
        document.getElementById('btn-set-bezier').addEventListener('click', setBezierValues);

        // Manual input button - shows manual input field
        document.getElementById('btn-manual-bezier').addEventListener('click', function () {
            const manualInput = document.getElementById('bezier-manual-input');
            document.getElementById('manual-bezier-input').value = bezierValues.join(', ');
            manualInput.style.display = 'flex';
        });

        // Accept manual input button
        document.getElementById('btn-accept-manual').addEventListener('click', acceptManualInput);

        // Cancel manual input button
        document.getElementById('btn-cancel-manual').addEventListener('click', function () {
            document.getElementById('bezier-manual-input').style.display = 'none';
        });

        // Enter key in manual input field
        document.getElementById('manual-bezier-input').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                acceptManualInput();
            }
        });
    }

    /**
     * Get bezier values from After Effects
     */
    function getBezierValues() {
        const getBtn = document.getElementById('btn-get-bezier');
        getBtn.disabled = true;
        getBtn.textContent = 'Getting...';

        csInterface.evalScript('callModuleFunction("bezierTangents", "getBezierValues", [])', function (result) {
            getBtn.disabled = false;
            getBtn.textContent = 'Get from Keyframes';
            try {
                const response = JSON.parse(result);

                if (response.error) {
                    NotificationSystem.error('Error: ' + response.error);
                    return;
                }

                if (response.result && Array.isArray(response.result) && response.result.length === 4) {
                    bezierValues = response.result;
                    bezierEditor.setValues(bezierValues);
                    updateValueDisplay();
                    NotificationSystem.success('Bezier values retrieved from keyframes');

                } else {
                    NotificationSystem.warning('No valid bezier values found');
                }
            } catch (e) {
                NotificationSystem.error('Error parsing response from After Effects');
                console.error('Error parsing response:', e, result);
            }
        });
    }

    /**
     * Set bezier values to After Effects keyframes
     */
    function setBezierValues() {
        const setBtn = document.getElementById('btn-set-bezier');
        setBtn.disabled = true;
        setBtn.textContent = 'Applying...';

        csInterface.evalScript(`callModuleFunction("bezierTangents", "setBezierValues", ${JSON.stringify([bezierValues])})`, function (result) {
            setBtn.disabled = false;
            setBtn.textContent = 'Apply to Keyframes';

            try {
                const response = JSON.parse(result);

                if (response.error) {
                    NotificationSystem.error('Error: ' + response.error);
                } else {
                    NotificationSystem.success('Applied bezier values to keyframes');
                }
            } catch (e) {
                NotificationSystem.error('Error parsing response from After Effects');
                console.error('Error parsing response:', e, result);
            }
        });
    }

    /**
     * Accept manual input for bezier values
     */
    function acceptManualInput() {
        const input = document.getElementById('manual-bezier-input').value;
        const values = input.split(',').map(val => parseFloat(val.trim()));

        // Validate input
        if (values.length !== 4 || values.some(isNaN)) {
            NotificationSystem.warning('Please enter 4 valid numbers separated by commas');
            return;
        }

        // Apply valid values
        bezierValues = values.map(val => Math.max(0, Math.min(1, val))); // Clamp between 0 and 1
        bezierEditor.setValues(bezierValues);
        updateValueDisplay();

        // Hide manual input
        document.getElementById('bezier-manual-input').style.display = 'none';
    }

    /**
     * Update the bezier values display
     */
    function updateValueDisplay() {
        const display = document.getElementById('bezier-values-display');
        const roundedValues = bezierValues.map(v => Math.round(v * 1000) / 1000);
        display.textContent = `Bezier Values: ${roundedValues.join(', ')}`;
    }


    /**
     * Cleanup function - destroys resize handle and removes event listeners
     */
    function destroy() {
        if (resizeHandle) {
            resizeHandle.removeEventListener('mousedown', startResize);
            resizeHandle.remove();
            resizeHandle = null;
        }
        document.removeEventListener('mousemove', performResize);
        document.removeEventListener('mouseup', stopResize);
        document.body.style.cursor = 'default';
    }

    // Public API
    return {
        init: init,
        destroy: destroy
    };
})();