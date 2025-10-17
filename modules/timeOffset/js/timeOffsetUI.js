/**
 * Time Offset - UI Construction
 * Builds the user interface and handles interactions
 */
var TimeOffsetUI = (function () {
    let csInterface;
    let container;
    let eventListeners = [];
    let curveEditor;
    let isInteractiveMode = false;
    let interactiveUpdateTimeout = null;

    /**
     * Initialize the UI
     */
    function init(cs, containerElement) {
        csInterface = cs;
        container = containerElement;

        console.log('TimeOffsetUI initializing...');

        buildUI();
        setupEventListeners();
        loadStateToUI();

        console.log('TimeOffsetUI initialized');
    }

    /**
     * Build the user interface
     */
    function buildUI() {
        const state = TimeOffset.getState();

        container.innerHTML = `
            <div class="time-offset-wrapper">
                <div class="time-offset-header">
                    <h2>Time Offset</h2>
                </div>

                <div class="time-offset-content">
                    <!-- Order Selection -->
                    <div class="form-group">
                        <label>Order</label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="order" value="ascending" ${state.order === 'ascending' ? 'checked' : ''}>
                                <span>Ascending</span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="order" value="descending" ${state.order === 'descending' ? 'checked' : ''}>
                                <span>Descending</span>
                            </label>
                        </div>
                    </div>

                    <!-- Alignment Selection -->
                    <div class="form-group">
                        <label>Alignment</label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="alignment" value="start" ${state.alignment === 'start' ? 'checked' : ''}>
                                <span>Align at Start</span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="alignment" value="end" ${state.alignment === 'end' ? 'checked' : ''}>
                                <span>Align at End</span>
                            </label>
                        </div>
                    </div>

                    <!-- Time Offset -->
                    <div class="form-group">
                        <label for="time-offset-input">Time Offset (frames)</label>
                        <div class="number-input-wrapper">
                            <button class="spinner-btn spinner-down" data-input="time-offset-input">−</button>
                            <input type="number" 
                                   id="time-offset-input" 
                                   class="form-control number-input"
                                   data-drag-adjust
                                   data-step="1"
                                   value="${state.timeOffset}">
                            <button class="spinner-btn spinner-up" data-input="time-offset-input">+</button>
                        </div>
                    </div>

                    <!-- Curve Editor -->
                    <div class="form-group">
                        <label>Distribution Curve</label>
                        <div id="curve-editor-container"></div>
                    </div>

                    <!-- Random Offset -->
                    <div class="form-group">
                        <label>Random Offset Range (frames)</label>
                        <div class="random-offset-group">
                            <div class="random-input-row">
                                <span class="input-label">Min:</span>
                                <div class="number-input-wrapper">
                                    <button class="spinner-btn spinner-down" data-input="random-min-input">−</button>
                                    <input type="number" 
                                           id="random-min-input" 
                                           class="form-control number-input"
                                           data-drag-adjust
                                           data-step="1"
                                           value="${state.randomMin}">
                                    <button class="spinner-btn spinner-up" data-input="random-min-input">+</button>
                                </div>
                            </div>
                            <div class="random-input-row">
                                <span class="input-label">Max:</span>
                                <div class="number-input-wrapper">
                                    <button class="spinner-btn spinner-down" data-input="random-max-input">−</button>
                                    <input type="number" 
                                           id="random-max-input" 
                                           class="form-control number-input"
                                           data-drag-adjust
                                           data-step="1"
                                           value="${state.randomMax}">
                                    <button class="spinner-btn spinner-up" data-input="random-max-input">+</button>
                                </div>
                            </div>
                            <div class="random-input-row">
                                <span class="input-label">Seed:</span>
                                <div class="number-input-wrapper">
                                    <button class="spinner-btn spinner-down" data-input="random-seed-input">−</button>
                                    <input type="number" 
                                           id="random-seed-input" 
                                           class="form-control number-input"
                                           data-drag-adjust
                                           data-step="1"
                                           min="0"
                                           value="${state.randomSeed}">
                                    <button class="spinner-btn spinner-up" data-input="random-seed-input">+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div id="normal-buttons" class="button-group">
                        <button id="offset-btn" class="btn btn-primary">
                            Offset
                        </button>
                        <button id="interactive-btn" class="btn btn-secondary">
                            Interactive
                        </button>
                    </div>

                    <div id="interactive-buttons" class="button-group" style="display: none;">
                        <button id="apply-interactive-btn" class="btn btn-primary">
                            Apply
                        </button>
                        <button id="cancel-interactive-btn" class="btn btn-secondary">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Initialize curve editor
        initializeCurveEditor();

        // Initialize drag-to-adjust
        if (typeof DragToAdjust !== 'undefined') {
            DragToAdjust.init();
        }

        // Initialize tooltips
        if (typeof TooltipSystem !== 'undefined') {
            TooltipSystem.init();
        }
    }

    /**
     * Initialize the curve editor
     */
    function initializeCurveEditor() {
        const curveContainer = container.querySelector('#curve-editor-container');
        const state = TimeOffset.getState();

        if (typeof CubicBezier !== 'undefined') {
            curveEditor = new CubicBezier(
                curveContainer,
                state.bezierPoints[0],
                state.bezierPoints[1],
                state.bezierPoints[2],
                state.bezierPoints[3]
            );

            // Listen for curve changes
            curveContainer.addEventListener('curvechange', function (e) {
                const points = [
                    curveEditor.coordinates.P1.x,
                    curveEditor.coordinates.P1.y,
                    curveEditor.coordinates.P2.x,
                    curveEditor.coordinates.P2.y
                ];
                TimeOffset.updateState({ bezierPoints: points });

                // If in interactive mode, update preview
                if (isInteractiveMode) {
                    scheduleInteractiveUpdate();
                }
            });
        } else {
            curveContainer.innerHTML = '<p style="color: #ff6b6b;">Curve editor not available</p>';
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Order radio buttons
        const orderRadios = container.querySelectorAll('input[name="order"]');
        orderRadios.forEach(radio => {
            const handler = (e) => {
                TimeOffset.updateState({ order: e.target.value });
                if (isInteractiveMode) scheduleInteractiveUpdate();
            };
            radio.addEventListener('change', handler);
            trackListener(radio, 'change', handler);
        });

        // Alignment radio buttons
        const alignmentRadios = container.querySelectorAll('input[name="alignment"]');
        alignmentRadios.forEach(radio => {
            const handler = (e) => {
                TimeOffset.updateState({ alignment: e.target.value });
                if (isInteractiveMode) scheduleInteractiveUpdate();
            };
            radio.addEventListener('change', handler);
            trackListener(radio, 'change', handler);
        });

        // Time offset input
        const timeOffsetInput = container.querySelector('#time-offset-input');
        const timeOffsetHandler = (e) => {
            const value = parseFloat(e.target.value) || 0;
            TimeOffset.updateState({ timeOffset: value });
            if (isInteractiveMode) scheduleInteractiveUpdate();
        };
        timeOffsetInput.addEventListener('input', timeOffsetHandler);
        trackListener(timeOffsetInput, 'input', timeOffsetHandler);

        // Random offset inputs
        const randomMinInput = container.querySelector('#random-min-input');
        const randomMinHandler = (e) => {
            const value = parseFloat(e.target.value) || 0;
            TimeOffset.updateState({ randomMin: value });
            if (isInteractiveMode) scheduleInteractiveUpdate();
        };
        randomMinInput.addEventListener('input', randomMinHandler);
        trackListener(randomMinInput, 'input', randomMinHandler);

        const randomMaxInput = container.querySelector('#random-max-input');
        const randomMaxHandler = (e) => {
            const value = parseFloat(e.target.value) || 0;
            TimeOffset.updateState({ randomMax: value });
            if (isInteractiveMode) scheduleInteractiveUpdate();
        };
        randomMaxInput.addEventListener('input', randomMaxHandler);
        trackListener(randomMaxInput, 'input', randomMaxHandler);

        const randomSeedInput = container.querySelector('#random-seed-input');
        const randomSeedHandler = (e) => {
            const value = parseInt(e.target.value) || 0;
            TimeOffset.updateState({ randomSeed: value });
            if (isInteractiveMode) scheduleInteractiveUpdate();
        };
        randomSeedInput.addEventListener('input', randomSeedHandler);
        trackListener(randomSeedInput, 'input', randomSeedHandler);

        // Spinner buttons
        const spinnerBtns = container.querySelectorAll('.spinner-btn');
        spinnerBtns.forEach(btn => {
            const handler = () => handleSpinner(btn);
            btn.addEventListener('click', handler);
            trackListener(btn, 'click', handler);
        });

        // Offset button
        const offsetBtn = container.querySelector('#offset-btn');
        const offsetHandler = () => handleOffset();
        offsetBtn.addEventListener('click', offsetHandler);
        trackListener(offsetBtn, 'click', offsetHandler);

        // Interactive button
        const interactiveBtn = container.querySelector('#interactive-btn');
        const interactiveHandler = () => handleInteractive();
        interactiveBtn.addEventListener('click', interactiveHandler);
        trackListener(interactiveBtn, 'click', interactiveHandler);

        // Apply interactive button
        const applyBtn = container.querySelector('#apply-interactive-btn');
        const applyHandler = () => handleApplyInteractive();
        applyBtn.addEventListener('click', applyHandler);
        trackListener(applyBtn, 'click', applyHandler);

        // Cancel interactive button
        const cancelBtn = container.querySelector('#cancel-interactive-btn');
        const cancelHandler = () => handleCancelInteractive();
        cancelBtn.addEventListener('click', cancelHandler);
        trackListener(cancelBtn, 'click', cancelHandler);
    }

    /**
     * Handle spinner button click
     */
    function handleSpinner(button) {
        const inputId = button.getAttribute('data-input');
        const input = container.querySelector('#' + inputId);
        if (!input) return;

        const isUp = button.classList.contains('spinner-up');
        const step = parseFloat(input.getAttribute('data-step')) || 1;
        const currentValue = parseFloat(input.value) || 0;
        const newValue = isUp ? currentValue + step : currentValue - step;

        input.value = newValue;
        input.dispatchEvent(new Event('input'));
    }

    /**
     * Handle offset button click
     */
    function handleOffset() {
        const params = getCurrentParams();

        NotificationSystem.info('Applying offset...');

        TimeOffset.applyOffset(params, function (result) {
            if (result.error) {
                NotificationSystem.error(result.error);
            } else {
                const count = result.result && result.result.count ? result.result.count : 0;
                const type = result.result && result.result.type ? result.result.type : 'items';
                NotificationSystem.success(`Offset applied to ${count} ${type}`);
            }
        });
    }

    /**
     * Handle interactive button click
     */
    function handleInteractive() {
        const params = getCurrentParams();

        NotificationSystem.info('Starting interactive mode...');

        TimeOffset.startInteractive(params, function (result) {
            if (result.error) {
                NotificationSystem.error(result.error);
            } else {
                isInteractiveMode = true;
                toggleInteractiveUI(true);

                // Show success with count info if available
                if (result.result && result.result.count) {
                    const count = result.result.count;
                    const type = result.result.type || 'items';
                    NotificationSystem.success(`Interactive mode active - ${count} ${type} selected`);
                } else {
                    NotificationSystem.success('Interactive mode active');
                }
            }
        });
    }

    /**
     * Handle apply interactive button click
     */
    function handleApplyInteractive() {
        TimeOffset.applyInteractive(function (result) {
            if (result.error) {
                NotificationSystem.error(result.error);
            } else {
                isInteractiveMode = false;
                toggleInteractiveUI(false);
                NotificationSystem.success('Changes applied');
            }
        });
    }

    /**
     * Handle cancel interactive button click
     */
    function handleCancelInteractive() {
        NotificationSystem.info('Restoring original state...');

        TimeOffset.cancelInteractive(function (result) {
            if (result.error) {
                NotificationSystem.error(result.error);
            } else {
                isInteractiveMode = false;
                toggleInteractiveUI(false);
                NotificationSystem.success('Changes cancelled');
            }
        });
    }

    /**
     * Schedule an interactive update (debounced)
     */
    function scheduleInteractiveUpdate() {
        if (interactiveUpdateTimeout) {
            clearTimeout(interactiveUpdateTimeout);
        }

        interactiveUpdateTimeout = setTimeout(function () {
            const params = getCurrentParams();
            TimeOffset.updateInteractive(params, function (result) {
                if (result.error) {
                    console.error('Interactive update error:', result.error);
                }
            });
        }, 150); // Debounce by 150ms
    }

    /**
     * Toggle between normal and interactive UI
     */
    function toggleInteractiveUI(interactive) {
        const normalButtons = container.querySelector('#normal-buttons');
        const interactiveButtons = container.querySelector('#interactive-buttons');

        if (interactive) {
            normalButtons.style.display = 'none';
            interactiveButtons.style.display = 'flex';
        } else {
            normalButtons.style.display = 'flex';
            interactiveButtons.style.display = 'none';
        }
    }

    /**
     * Get current parameters from UI
     */
    function getCurrentParams() {
        const state = TimeOffset.getState();

        return {
            order: state.order,
            alignment: state.alignment,
            timeOffset: state.timeOffset,
            bezierPoints: state.bezierPoints,
            randomMin: state.randomMin,
            randomMax: state.randomMax,
            randomSeed: state.randomSeed
        };
    }

    /**
     * Load state to UI
     */
    function loadStateToUI() {
        const state = TimeOffset.getState();

        // Update radio buttons
        const orderRadio = container.querySelector(`input[name="order"][value="${state.order}"]`);
        if (orderRadio) orderRadio.checked = true;

        const alignmentRadio = container.querySelector(`input[name="alignment"][value="${state.alignment}"]`);
        if (alignmentRadio) alignmentRadio.checked = true;

        // Update inputs
        container.querySelector('#time-offset-input').value = state.timeOffset;
        container.querySelector('#random-min-input').value = state.randomMin;
        container.querySelector('#random-max-input').value = state.randomMax;
        container.querySelector('#random-seed-input').value = state.randomSeed;
    }

    /**
     * Track event listener for cleanup
     */
    function trackListener(element, event, handler) {
        eventListeners.push({ element, event, handler });
    }

    /**
     * Cleanup the UI
     */
    function cleanup() {
        console.log('TimeOffsetUI cleaning up...');

        // Cancel interactive mode if active
        if (isInteractiveMode) {
            TimeOffset.cancelInteractive(function () { });
            isInteractiveMode = false;
        }

        // Clear any pending updates
        if (interactiveUpdateTimeout) {
            clearTimeout(interactiveUpdateTimeout);
        }

        // Remove all event listeners
        eventListeners.forEach(({ element, event, handler }) => {
            if (element) {
                element.removeEventListener(event, handler);
            }
        });
        eventListeners = [];

        // Cleanup curve editor
        if (curveEditor) {
            curveEditor = null;
        }

        container = null;
    }

    // Public API
    return {
        init: init,
        cleanup: cleanup
    };
})();