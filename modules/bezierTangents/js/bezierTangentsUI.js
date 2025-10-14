/**
 * Bezier Tangents UI Module
 */
var BezierTangentsUI = (function () {
    // Private variables
    let csInterface;
    let bezierValues = [0.40, 0.14, 0.30, 1.00];
    let bezierEditor;
    let appState = null;

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
        const container = document.getElementById('bezierTangents');

        // Load state first, then build UI
        loadState(() => {
            buildUI(container);
        });
    }

    /**
     * Load state from JSON file
     */
    function loadState(callback) {
        if (!csInterface) {
            appState = getDefaultState();
            callback();
            return;
        }

        csInterface.evalScript('callModuleFunction("bezierTangents", "loadState", [])', function (result) {
            try {
                const response = JSON.parse(result);
                if (response.error || !response.result) {
                    appState = getDefaultState();
                } else {
                    appState = response.result;
                    // Ensure all required properties exist
                    if (!appState.currentValues) appState.currentValues = getDefaultState().currentValues;
                    if (!appState.presets) appState.presets = getDefaultState().presets;
                    if (!appState.groups) appState.groups = getDefaultState().groups;
                    if (!appState.activeGroup) appState.activeGroup = appState.groups[0];
                    if (!appState.uiHeight) appState.uiHeight = 300;
                }
                bezierValues = [
                    appState.currentValues.x1,
                    appState.currentValues.y1,
                    appState.currentValues.x2,
                    appState.currentValues.y2
                ];
            } catch (e) {
                console.error('Error loading state:', e);
                appState = getDefaultState();
            }
            callback();
        });
    }

    /**
     * Save state to JSON file
     */
    function saveState(callback) {
        if (!csInterface || !appState) {
            if (callback) callback(false);
            return;
        }

        // Update current values in state
        appState.currentValues = {
            x1: bezierValues[0],
            y1: bezierValues[1],
            x2: bezierValues[2],
            y2: bezierValues[3]
        };

        // Update UI height
        if (canvasContainer) {
            appState.uiHeight = canvasContainer.offsetHeight;
        }

        const stateJson = JSON.stringify(appState);
        csInterface.evalScript(`callModuleFunction("bezierTangents", "saveState", [${JSON.stringify(stateJson)}])`, function (result) {
            try {
                const response = JSON.parse(result);
                if (callback) callback(!response.error);
            } catch (e) {
                console.error('Error saving state:', e);
                if (callback) callback(false);
            }
        });
    }

    /**
     * Get default state
     */
    function getDefaultState() {
        return {
            currentValues: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
            presets: [
                { name: "Linear", group: "Ease", x1: 0, y1: 0, x2: 1, y2: 1 },
                { name: "Ease", group: "Ease", x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
                { name: "Ease In", group: "Ease", x1: 0.42, y1: 0, x2: 1, y2: 1 },
                { name: "Ease Out", group: "Ease", x1: 0, y1: 0, x2: 0.58, y2: 1 },
                { name: "Ease In Out", group: "Ease", x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
                { name: "Spring Soft", group: "Spring", x1: 0.5, y1: -0.3, x2: 0.5, y2: 1.3 },
                { name: "Spring Medium", group: "Spring", x1: 0.5, y1: -0.5, x2: 0.5, y2: 1.5 },
                { name: "Bounce Out", group: "Spring", x1: 0.175, y1: 0.885, x2: 0.32, y2: 1.275 }
            ],
            groups: ["Ease", "Spring", "Custom"],
            activeGroup: "Ease",
            uiHeight: 300
        };
    }

    /**
     * Build the main UI
     */
    function buildUI(container) {
        container.innerHTML = `
            <div class="bezier-editor-container">
                <div id="bezier-canvas-container" class="bezier-canvas-container" style="height: ${appState.uiHeight}px">
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
                    
                    <div class="preset-header">
                        <h3>Presets</h3>
                    </div>
                    
                    <div id="preset-tabs" class="preset-tabs"></div>
                    <div id="bezier-presets" class="bezier-presets"></div>
                </div>
            </div>
        `;

        canvasContainer = document.getElementById('bezier-canvas-container');
        initBezierEditor();
        initResizeHandle();
        setupEventListeners();
        renderPresetTabs();
        renderPresets();
    }

    /**
     * Render preset group tabs
     */
    function renderPresetTabs() {
        const tabsContainer = document.getElementById('preset-tabs');
        tabsContainer.innerHTML = '';

        appState.groups.forEach(group => {
            const tab = document.createElement('button');
            tab.className = 'preset-tab' + (group === appState.activeGroup ? ' active' : '');
            tab.textContent = group;
            tab.addEventListener('click', () => {
                appState.activeGroup = group;
                saveState();
                renderPresetTabs();
                renderPresets();
            });

            // Right-click menu for tabs
            tab.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showGroupContextMenu(e.clientX, e.clientY, group);
            });

            tabsContainer.appendChild(tab);
        });
    }

    /**
     * Render presets for active group
     */
    function renderPresets() {
        const presetContainer = document.getElementById('bezier-presets');
        presetContainer.innerHTML = '';

        const groupPresets = appState.presets.filter(p => p.group === appState.activeGroup);

        groupPresets.forEach((preset, index) => {
            const presetBtn = document.createElement('button');
            presetBtn.className = 'bezier-preset';
            presetBtn.setAttribute('title', preset.name);

            const curve = document.createElement('div');
            curve.className = 'bezier-preset-curve';

            // Create SVG with proper viewBox to handle overshoot
            const svg = createPresetSVG(preset);
            curve.appendChild(svg);

            const label = document.createElement('div');
            label.className = 'bezier-preset-label';
            label.textContent = preset.name;
            label.setAttribute('title', preset.name);

            presetBtn.appendChild(curve);
            presetBtn.appendChild(label);
            presetContainer.appendChild(presetBtn);

            presetBtn.addEventListener('click', function () {
                bezierValues = [preset.x1, preset.y1, preset.x2, preset.y2];
                bezierEditor.setValues(bezierValues);
                updateValueDisplay();
                saveState();
            });

            // Right-click menu for presets
            presetBtn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showPresetContextMenu(e.clientX, e.clientY, preset, index);
            });

        });
        const addButton = document.createElement('button');
        addButton.className = 'bezier-preset btn-save-preset';
        addButton.id = 'btn-save-preset';
        addButton.title = 'Save Current as Preset';
        addButton.textContent = '+';
        addButton.addEventListener('click', saveAsPreset);
        presetContainer.appendChild(addButton);
    }

    /**
     * Create SVG for preset visualization
     */
    function createPresetSVG(preset) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');

        // Calculate proper viewBox to show full curve including overshoot
        const minY = Math.min(0, 1, preset.y1, preset.y2);
        const maxY = Math.max(0, 1, preset.y1, preset.y2);
        const padding = (maxY - minY) * 0.1;
        const viewBoxHeight = maxY - minY + padding * 2;
        const viewBoxY = -(maxY + padding);

        svg.setAttribute('viewBox', `0 ${viewBoxY} 1 ${viewBoxHeight}`);
        svg.setAttribute('preserveAspectRatio', 'none');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M0,0 C${preset.x1},${-preset.y1} ${preset.x2},${-preset.y2} 1,-1`;
        path.setAttribute('d', d);
        path.setAttribute('stroke', '#ffffff');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-width', '0.5');
        path.setAttribute('vector-effect', 'non-scaling-stroke');

        svg.appendChild(path);
        return svg;
    }

    /**
     * Show context menu for presets
     */
    function showPresetContextMenu(x, y, preset, presetIndex) {
        removeContextMenu();

        const menu = document.createElement('div');
        menu.id = 'bezier-context-menu';
        menu.className = 'context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        menu.innerHTML = `
            <div class="menu-item" data-action="rename">Rename</div>
            <div class="menu-item" data-action="move">Move to Group</div>
            <div class="menu-item" data-action="delete">Delete</div>
        `;

        document.body.appendChild(menu);

        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                handlePresetAction(action, preset, presetIndex);
                removeContextMenu();
            });
        });

        // Close menu on outside click
        setTimeout(() => {
            document.addEventListener('click', removeContextMenu, { once: true });
        }, 0);
    }

    /**
     * Show context menu for groups
     */
    function showGroupContextMenu(x, y, group) {
        removeContextMenu();

        const menu = document.createElement('div');
        menu.id = 'bezier-context-menu';
        menu.className = 'context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        const canDelete = appState.groups.length > 1;

        menu.innerHTML = `
            <div class="menu-item" data-action="rename">Rename Group</div>
            <div class="menu-item" data-action="new">New Group</div>
            ${canDelete ? '<div class="menu-item" data-action="delete">Delete Group</div>' : ''}
        `;

        document.body.appendChild(menu);

        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                handleGroupAction(action, group);
                removeContextMenu();
            });
        });

        setTimeout(() => {
            document.addEventListener('click', removeContextMenu, { once: true });
        }, 0);
    }

    /**
     * Handle preset actions
     */
    function handlePresetAction(action, preset, presetIndex) {
        switch (action) {
            case 'rename':
                ModalSystem.prompt('Enter new preset name:', preset.name, {
                    title: 'Rename Preset',
                    validator: (value) => value && value.trim() ? true : 'Name cannot be empty'
                }).then(newName => {
                    if (newName) {
                        const actualIndex = appState.presets.findIndex(p =>
                            p.name === preset.name && p.group === preset.group &&
                            p.x1 === preset.x1 && p.y1 === preset.y1
                        );
                        if (actualIndex >= 0) {
                            appState.presets[actualIndex].name = newName.trim();
                            saveState(() => renderPresets());
                        }
                    }
                });
                break;

            case 'move':
                showMoveToGroupDialog(preset);
                break;

            case 'delete':
                ModalSystem.confirm(`Delete preset "${preset.name}"?`, {
                    title: 'Delete Preset',
                    confirmText: 'Delete'
                }).then(confirmed => {
                    if (confirmed) {
                        const actualIndex = appState.presets.findIndex(p =>
                            p.name === preset.name && p.group === preset.group &&
                            p.x1 === preset.x1 && p.y1 === preset.y1
                        );
                        if (actualIndex >= 0) {
                            appState.presets.splice(actualIndex, 1);
                            saveState(() => renderPresets());
                            NotificationSystem.success('Preset deleted');
                        }
                    }
                });
                break;
        }
    }

    /**
     * Handle group actions
     */
    function handleGroupAction(action, group) {
        switch (action) {
            case 'rename':
                ModalSystem.prompt('Enter new group name:', group, {
                    title: 'Rename Group',
                    validator: (value) => {
                        if (!value || !value.trim()) return 'Name cannot be empty';
                        if (appState.groups.includes(value.trim()) && value.trim() !== group) {
                            return 'Group already exists';
                        }
                        return true;
                    }
                }).then(newName => {
                    if (newName) {
                        const groupIndex = appState.groups.indexOf(group);
                        if (groupIndex >= 0) {
                            appState.groups[groupIndex] = newName.trim();
                            appState.presets.forEach(p => {
                                if (p.group === group) p.group = newName.trim();
                            });
                            if (appState.activeGroup === group) {
                                appState.activeGroup = newName.trim();
                            }
                            saveState(() => {
                                renderPresetTabs();
                                renderPresets();
                            });
                        }
                    }
                });
                break;

            case 'new':
                ModalSystem.prompt('Enter group name:', 'New Group', {
                    title: 'New Group',
                    validator: (value) => {
                        if (!value || !value.trim()) return 'Name cannot be empty';
                        if (appState.groups.includes(value.trim())) {
                            return 'Group already exists';
                        }
                        return true;
                    }
                }).then(newName => {
                    if (newName) {
                        appState.groups.push(newName.trim());
                        appState.activeGroup = newName.trim();
                        saveState(() => {
                            renderPresetTabs();
                            renderPresets();
                        });
                        NotificationSystem.success('Group created');
                    }
                });
                break;

            case 'delete':
                if (appState.groups.length <= 1) {
                    NotificationSystem.warning('Cannot delete the last group');
                    return;
                }

                const presetsInGroup = appState.presets.filter(p => p.group === group);
                const message = presetsInGroup.length > 0
                    ? `Delete group "${group}" and its ${presetsInGroup.length} preset(s)?`
                    : `Delete group "${group}"?`;

                ModalSystem.confirm(message, {
                    title: 'Delete Group',
                    confirmText: 'Delete'
                }).then(confirmed => {
                    if (confirmed) {
                        appState.groups = appState.groups.filter(g => g !== group);
                        appState.presets = appState.presets.filter(p => p.group !== group);
                        if (appState.activeGroup === group) {
                            appState.activeGroup = appState.groups[0];
                        }
                        saveState(() => {
                            renderPresetTabs();
                            renderPresets();
                        });
                        NotificationSystem.success('Group deleted');
                    }
                });
                break;
        }
    }

    /**
     * Show dialog to move preset to another group
     */
    function showMoveToGroupDialog(preset) {
        const otherGroups = appState.groups.filter(g => g !== preset.group);

        if (otherGroups.length === 0) {
            NotificationSystem.info('Create another group first');
            return;
        }

        const options = otherGroups.map(g => `<option value="${g}">${g}</option>`).join('');

        ModalSystem.show({
            type: 'custom',
            content: `
                <div class="modal-header">
                    <h3>Move "${preset.name}" to Group</h3>
                </div>
                <div class="modal-body">
                    <select id="move-group-select" class="modal-input">
                        ${options}
                    </select>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-secondary" data-action="cancel">Cancel</button>
                    <button class="modal-btn modal-btn-primary" data-action="confirm">Move</button>
                </div>
            `,
            onConfirm: () => {
                const select = document.getElementById('move-group-select');
                const newGroup = select.value;
                const actualIndex = appState.presets.findIndex(p =>
                    p.name === preset.name && p.group === preset.group &&
                    p.x1 === preset.x1 && p.y1 === preset.y1
                );
                if (actualIndex >= 0) {
                    appState.presets[actualIndex].group = newGroup;
                    saveState(() => renderPresets());
                    NotificationSystem.success(`Moved to ${newGroup}`);
                }
            }
        });
    }

    /**
     * Remove context menu
     */
    function removeContextMenu() {
        const menu = document.getElementById('bezier-context-menu');
        if (menu) menu.remove();
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
                saveState();
            }
        });
    }

    /**
     * Initialize resize handle
     */
    function initResizeHandle() {
        if (!canvasContainer) return;

        resizeHandle = document.createElement('div');
        resizeHandle.className = 'bezier-resize-handle';
        resizeHandle.innerHTML = '<div class="resize-handle-bar"></div>';
        canvasContainer.parentElement.insertBefore(resizeHandle, canvasContainer.nextSibling);

        resizeHandle.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', performResize);
        document.addEventListener('mouseup', stopResize);
    }

    function startResize(e) {
        e.preventDefault();
        isResizing = true;
        startY = e.clientY;
        startHeight = canvasContainer.offsetHeight;
        resizeHandle.classList.add('active');
        document.body.style.cursor = 'ns-resize';
    }

    function performResize(e) {
        if (!isResizing) return;
        e.preventDefault();

        const deltaY = e.clientY - startY;
        const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
        canvasContainer.style.height = newHeight + 'px';

        if (bezierEditor && typeof bezierEditor.resize === 'function') {
            bezierEditor.resize();
        }
    }

    function stopResize() {
        if (!isResizing) return;
        isResizing = false;
        resizeHandle.classList.remove('active');
        document.body.style.cursor = 'default';
        saveState();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        document.getElementById('btn-get-bezier').addEventListener('click', getBezierValues);
        document.getElementById('btn-set-bezier').addEventListener('click', setBezierValues);
        document.getElementById('btn-manual-bezier').addEventListener('click', () => {
            document.getElementById('bezier-manual-input').style.display = 'flex';
            document.getElementById('manual-bezier-input').value = bezierValues.join(', ');
        });
        document.getElementById('btn-accept-manual').addEventListener('click', acceptManualInput);
        document.getElementById('btn-cancel-manual').addEventListener('click', () => {
            document.getElementById('bezier-manual-input').style.display = 'none';
        });
        document.getElementById('manual-bezier-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') acceptManualInput();
        });

    }

    /**
     * Save current values as preset
     */
    function saveAsPreset() {
        const currentGroup = appState.activeGroup;
        const groupOptions = appState.groups.map(g =>
            `<option value="${g}" ${g === currentGroup ? 'selected' : ''}>${g}</option>`
        ).join('');

        ModalSystem.show({
            type: 'custom',
            content: `
                <div class="modal-header">
                    <h3>Save Preset</h3>
                </div>
                <div class="modal-body">
                    <label style="display: block; margin-bottom: 8px; color: #c0c0c0;">Preset Name</label>
                    <input type="text" id="preset-name-input" class="modal-input" placeholder="My Preset" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; color: #c0c0c0;">Group</label>
                    <select id="preset-group-select" class="modal-input">
                        ${groupOptions}
                        <option value="__new__">+ Create New Group</option>
                    </select>
                    <input type="text" id="new-group-input" class="modal-input" placeholder="New Group Name" style="margin-top: 8px; display: none;">
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-secondary" data-action="cancel">Cancel</button>
                    <button class="modal-btn modal-btn-primary" data-action="confirm">Save</button>
                </div>
            `,
            onConfirm: () => {
                const nameInput = document.getElementById('preset-name-input');
                const groupSelect = document.getElementById('preset-group-select');
                const newGroupInput = document.getElementById('new-group-input');

                const name = nameInput.value.trim();
                if (!name) {
                    NotificationSystem.warning('Please enter a preset name');
                    return;
                }

                let group = groupSelect.value;
                if (group === '__new__') {
                    group = newGroupInput.value.trim();
                    if (!group) {
                        NotificationSystem.warning('Please enter a group name');
                        return;
                    }
                    if (!appState.groups.includes(group)) {
                        appState.groups.push(group);
                    }
                }

                appState.presets.push({
                    name: name,
                    group: group,
                    x1: bezierValues[0],
                    y1: bezierValues[1],
                    x2: bezierValues[2],
                    y2: bezierValues[3]
                });

                appState.activeGroup = group;
                saveState(() => {
                    renderPresetTabs();
                    renderPresets();
                    NotificationSystem.success('Preset saved');
                });
            }
        });

        // Handle group selection change
        setTimeout(() => {
            const groupSelect = document.getElementById('preset-group-select');
            const newGroupInput = document.getElementById('new-group-input');
            groupSelect.addEventListener('change', () => {
                newGroupInput.style.display = groupSelect.value === '__new__' ? 'block' : 'none';
            });
        }, 0);
    }

    function getBezierValues() {
        const btn = document.getElementById('btn-get-bezier');
        btn.disabled = true;
        btn.textContent = 'Getting...';

        csInterface.evalScript('callModuleFunction("bezierTangents", "getBezierValues", [])', function (result) {
            btn.disabled = false;
            btn.textContent = 'Get from Keyframes';
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
                    saveState();
                    NotificationSystem.success('Bezier values retrieved from keyframes');
                } else {
                    NotificationSystem.warning('No valid bezier values found');
                }
            } catch (e) {
                NotificationSystem.error('Error parsing response from After Effects');
            }
        });
    }

    function setBezierValues() {
        const btn = document.getElementById('btn-set-bezier');
        btn.disabled = true;
        btn.textContent = 'Applying...';

        csInterface.evalScript(`callModuleFunction("bezierTangents", "setBezierValues", ${JSON.stringify([bezierValues])})`, function (result) {
            btn.disabled = false;
            btn.textContent = 'Apply to Keyframes';
            try {
                const response = JSON.parse(result);
                if (response.error) {
                    NotificationSystem.error('Error: ' + response.error);
                } else {
                    NotificationSystem.success('Applied bezier values to keyframes');
                }
            } catch (e) {
                NotificationSystem.error('Error parsing response from After Effects');
            }
        });
    }

    function acceptManualInput() {
        const input = document.getElementById('manual-bezier-input').value;
        const values = input.split(',').map(val => parseFloat(val.trim()));

        if (values.length !== 4 || values.some(isNaN)) {
            NotificationSystem.warning('Please enter 4 valid numbers separated by commas');
            return;
        }

        bezierValues = values.map((val, index) => {
            if (index === 0 || index === 2) {
                return Math.max(0, Math.min(1, val));
            }
            return val;
        });

        bezierEditor.setValues(bezierValues);
        updateValueDisplay();
        saveState();
        document.getElementById('bezier-manual-input').style.display = 'none';
    }

    function updateValueDisplay() {
        const display = document.getElementById('bezier-values-display');
        const roundedValues = bezierValues.map(v => Math.round(v * 1000) / 1000);
        display.textContent = `Bezier Values: ${roundedValues.join(', ')}`;
    }

    function destroy() {
        if (resizeHandle) {
            resizeHandle.removeEventListener('mousedown', startResize);
            resizeHandle.remove();
        }
        document.removeEventListener('mousemove', performResize);
        document.removeEventListener('mouseup', stopResize);
        document.body.style.cursor = 'default';
        removeContextMenu();
    }

    return {
        init: init,
        destroy: destroy
    };
})();