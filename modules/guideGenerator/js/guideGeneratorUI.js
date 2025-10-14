/**
 * Guide Generator UI
 */
var GuideGeneratorUI = (function () {
    // Private variables
    let csInterface;
    let currentConfig = {};

    /**
     * Initialize the UI
     */
    function init(cs) {
        csInterface = cs;

        // Create module UI container
        const container = document.getElementById('guideGenerator');

        // Build the initial UI
        buildInitialUI(container);
    }

    /**
    * Resets the config default values
    */
    function resetConfig() {
        currentConfig = {
            cols: 3,
            rows: 3,
            colGutter: 0,
            rowGutter: 0,
            includeBoundingGuides: false
        };

    }

    /**
     * Build the initial UI state
     */
    function buildInitialUI(container) {
        resetConfig();
        container.innerHTML = `
            <div class="guide-generator-container">
                <div class="guide-initial-state">
                    <p>Select one or more layers to calculate a bounding box and generate guides.</p>
                    <button id="btn-initialize-guide">Initialize</button>
                </div>
            </div>
        `;

        // Set up event listener for initialize button
        document.getElementById('btn-initialize-guide').addEventListener('click', initialize);
    }

    /**
     * Initialize the guide generator
     */
    function initialize() {
        // Show loading indicator
        const initButton = document.getElementById('btn-initialize-guide');
        initButton.disabled = true;
        initButton.innerHTML = '<span class="guide-spinner"></span> Initializing...';

        // Get bounding box of selected layers
        GuideGenerator.getSelectedBoundingBox(function (bbox) {
            console.log("Button pressed and bbox returned:", bbox);
            if (!bbox) {
                NotificationSystem.warning('Select at least one layer before initializing');
                initButton.disabled = false;
                initButton.textContent = 'Initialize';
                return;
            }

            // Store existing guides
            GuideGenerator.storeExistingGuides(function (success) {
                if (!success) {
                    NotificationSystem.error('Failed to store existing guides');
                    initButton.disabled = false;
                    initButton.textContent = 'Initialize';
                    return;
                }

                // Build the configuration UI
                buildConfigUI(document.querySelector('.guide-generator-container'));
                NotificationSystem.success('Guide generator initialized');
            });
        });
    }

    /**
     * Build the configuration UI
     */
    function buildConfigUI(container) {
        const bbox = GuideGenerator.getBbox();

        container.innerHTML = `
            <div class="guide-config-state">
                <div class="bbox-section">
                    <h3>Bounding Box</h3>
                    <div class="input-row">
                        <div class="input-group">
                            <label for="bbox-width">Width:</label>
                            <div class="number-input-group">
                                <input type="number" id="bbox-width" value="${bbox.width.toFixed(1)}" step="1" increment-amount="5" tooltip-message="Click and drag to adjust" tooltip-delay="1000">
                                <div class="spinner-buttons">
                                    <button class="spinner-button" data-input="bbox-width" data-action="increment" tooltip-message="Increase value. Use Shift to increase by 10" tooltip-delay="1000" >▲</button>
                                    <button class="spinner-button" data-input="bbox-width" data-action="decrement" tooltip-message="Decrease value. Use Shift to decrease by 10" tooltip-delay="1000">▼</button>
                                </div>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="bbox-height">Height:</label>
                            <div class="number-input-group">
                                <input type="number" id="bbox-height" value="${bbox.height.toFixed(1)}" step="1" increment-amount="5" tooltip-message="Click and drag to adjust" tooltip-delay="1000">
                                <div class="spinner-buttons">
                                    <button class="spinner-button" data-input="bbox-height" data-action="increment" data-action="increment" tooltip-message="Increase value. Use Shift to increase by 10" tooltip-delay="1000">▲</button>
                                    <button class="spinner-button" data-input="bbox-height" data-action="decrement" tooltip-message="Decrease value. Use Shift to decrease by 10" tooltip-delay="1000">▼</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="grid-config-section">
                    <h3>Grid Configuration</h3>
                    <div class="input-row">
                        <div class="input-group">
                            <label for="guide-columns">Columns:</label>
                            <div class="number-input-group">
                                <input type="number" id="guide-columns" value="${currentConfig.cols}" min="1" step="1" increment-amount="1" tooltip-message="Click and drag to adjust" tooltip-delay="1000">
                                <div class="spinner-buttons">
                                    <button class="spinner-button" data-input="guide-columns" data-action="increment" data-action="increment" tooltip-message="Increase value. Use Shift to increase by 10" tooltip-delay="1000">▲</button>
                                    <button class="spinner-button" data-input="guide-columns" data-action="decrement" tooltip-message="Decrease value. Use Shift to decrease by 10" tooltip-delay="1000">▼</button>
                                </div>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="guide-rows">Rows:</label>
                            <div class="number-input-group">
                                <input type="number" id="guide-rows" value="${currentConfig.rows}" min="1" step="1" increment-amount="1" tooltip-message="Click and drag to adjust" tooltip-delay="1000">
                                <div class="spinner-buttons">
                                    <button class="spinner-button" data-input="guide-rows" data-action="increment">▲</button>
                                    <button class="spinner-button" data-input="guide-rows" data-action="decrement">▼</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="input-row">
                        <div class="input-group">
                            <label for="col-gutter">Column Gutter:</label>
                            <div class="number-input-group">
                                <input type="number" id="col-gutter" value="${currentConfig.colGutter}" min="0" step="1" increment-amount="5" tooltip-message="Click and drag to adjust" tooltip-delay="1000">
                                <div class="spinner-buttons">
                                    <button class="spinner-button" data-input="col-gutter" data-action="increment" data-action="increment" tooltip-message="Increase value. Use Shift to increase by 10" tooltip-delay="1000">▲</button>
                                    <button class="spinner-button" data-input="col-gutter" data-action="decrement" tooltip-message="Decrease value. Use Shift to decrease by 10" tooltip-delay="1000">▼</button>
                                </div>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="row-gutter">Row Gutter:</label>
                            <div class="number-input-group">
                                <input type="number" id="row-gutter" value="${currentConfig.rowGutter}" min="0" step="1" increment-amount="5" tooltip-message="Click and drag to adjust" tooltip-delay="1000">
                                <div class="spinner-buttons">
                                    <button class="spinner-button" data-input="row-gutter" data-action="increment" data-action="increment" tooltip-message="Increase value. Use Shift to increase by 10" tooltip-delay="1000">▲</button>
                                    <button class="spinner-button" data-input="row-gutter" data-action="decrement" tooltip-message="Decrease value. Use Shift to decrease by 10" tooltip-delay="1000">▼</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="checkbox-group">
                        <input type="checkbox" id="bounding-guides" ${currentConfig.includeBoundingGuides ? 'checked' : ''}>
                        <label for="bounding-guides">Include Bounding Box Guides</label>
                    </div>
                    
                    <div id="cell-size-info" class="cell-size-info">
                        Column Width: ${calculateColumnWidth().toFixed(2)}px<br>
                        Row Height: ${calculateRowHeight().toFixed(2)}px
                    </div>
                </div>
                
                <div class="guide-actions">
                    <button id="btn-reset-guides" class="secondary">Reset</button>
                    <button id="btn-apply-guides">Apply</button>
                </div>
            </div>
        `;

        // Set up event listeners
        setupConfigEventListeners();

        // Draw initial guides based on config
        updateGuides();
    }

    /**
     * Set up event listeners for configuration UI
     */
    function setupConfigEventListeners() {
        // Input field change events
        const inputFields = [
            'bbox-width', 'bbox-height', 'guide-columns', 'guide-rows', 'col-gutter', 'row-gutter'
        ];

        inputFields.forEach(id => {
            const input = document.getElementById(id);
            input.addEventListener('change', handleInputChange);
            input.addEventListener('input', handleInputChange);
        });

        // Spinner buttons
        const spinnerButtons = document.querySelectorAll('.spinner-button');
        spinnerButtons.forEach(button => {
            button.addEventListener('click', handleSpinnerClick);
        });

        // Checkbox
        document.getElementById('bounding-guides').addEventListener('change', function () {
            currentConfig.includeBoundingGuides = this.checked;
            updateGuides();
        });

        // Action buttons
        document.getElementById('btn-reset-guides').addEventListener('click', handleReset);
        document.getElementById('btn-apply-guides').addEventListener('click', handleApply);
    }

    /**
     * Handle input field changes
     */
    function handleInputChange(e) {
        const input = e.target;
        let value = parseFloat(input.value);

        // Validate and apply constraints
        if (isNaN(value)) {
            value = 0;
        }

        if (input.hasAttribute('min')) {
            const min = parseFloat(input.getAttribute('min'));
            if (value < min) value = min;
        }

        // Update the appropriate config value
        switch (input.id) {
            case 'bbox-width':
                if (value <= 0) value = 1;
                GuideGenerator.updateBbox('width', value);
                break;
            case 'bbox-height':
                if (value <= 0) value = 1;
                GuideGenerator.updateBbox('height', value);
                break;
            case 'guide-columns':
                value = Math.max(1, Math.round(value));
                currentConfig.cols = value;
                input.value = value;
                break;
            case 'guide-rows':
                value = Math.max(1, Math.round(value));
                currentConfig.rows = value;
                input.value = value;
                break;
            case 'col-gutter':
                value = Math.max(0, value);
                currentConfig.colGutter = value;
                input.value = value;
                break;
            case 'row-gutter':
                value = Math.max(0, value);
                currentConfig.rowGutter = value;
                input.value = value;
                break;
        }

        // Update the cell size information
        updateCellSizeInfo();

        // Update guides
        updateGuides();
    }

    /**
     * Handle spinner button clicks
     */
    function handleSpinnerClick(e) {
        const inputId = e.target.getAttribute('data-input');
        const action = e.target.getAttribute('data-action');
        const input = document.getElementById(inputId);

        let value = parseFloat(input.value) || 0;
        const step = parseFloat(input.getAttribute('step')) || 1;

        if (action === 'increment') {
            value += e.shiftKey ? step * 10 : step;
        } else if (action === 'decrement') {
            value -= e.shiftKey ? step * 10 : step;
        }

        // Set the value and trigger the change event
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /**
     * Handle reset button click
     */
    function handleReset() {
        ModalSystem.confirm('Reset guides to the original state?', {
            title: 'Reset Guides',
            confirmText: 'Reset',
            cancelText: 'Cancel'
        }).then((confirmed) => {
            if (confirmed) {
                GuideGenerator.reset(function () {
                    buildInitialUI(document.getElementById('guideGenerator'));
                    NotificationSystem.info('Guides reset');
                });
            }
        });
    }

    /**
     * Handle apply button click
     */
    function handleApply() {
        GuideGenerator.accept(function () {
            buildInitialUI(document.getElementById('guideGenerator'));
            NotificationSystem.success('Guides applied successfully');
        });
    }

    /**
     * Update guides based on current configuration
     */
    function updateGuides() {
        // Update the guides
        GuideGenerator.drawGuides({
            ...currentConfig,
            bbox: GuideGenerator.getBbox()
        }, function (success) {
            if (!success) {
                console.error('Failed to update guides.');
            }
        });
    }

    /**
     * Update the cell size information display
     */
    function updateCellSizeInfo() {
        const infoEl = document.getElementById('cell-size-info');
        if (infoEl) {
            const colWidth = calculateColumnWidth();
            const rowHeight = calculateRowHeight();
            infoEl.innerHTML = `Column Width: ${colWidth.toFixed(2)}px<br>Row Height: ${rowHeight.toFixed(2)}px`;
        }
    }

    /**
     * Calculate column width based on current configuration
     */
    function calculateColumnWidth() {
        const bbox = GuideGenerator.getBbox();
        const { cols, colGutter } = currentConfig;

        if (!bbox || cols <= 0) return 0;

        const totalGutter = (cols - 1) * colGutter;
        return (bbox.width - totalGutter) / cols;
    }

    /**
     * Calculate row height based on current configuration
     */
    function calculateRowHeight() {
        const bbox = GuideGenerator.getBbox();
        const { rows, rowGutter } = currentConfig;

        if (!bbox || rows <= 0) return 0;

        const totalGutter = (rows - 1) * rowGutter;
        return (bbox.height - totalGutter) / rows;
    }

    /**
     * Cleanup function
     */
    function cleanup() {
        // Clear references
        csInterface = null;
    }

    // Public API
    return {
        init: init,
        cleanup: cleanup
    };
})();