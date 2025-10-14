/**
 * Color Swatches UI Module
 */
var ColorSwatchesUI = (function () {
    // Private variables
    let csInterface;
    let statusTimeout;
    let defaultSwatchSize = 30;
    let library = null;
    let defaultHideCollapsedGroups = false;
    let defaultHideGroupNames = false;
    let draggedSwatch = null;
    let draggedGroup = null;
    let isShiftPressed = false;

    /**
     * Initialize the UI
     */
    function init(cs) {
        csInterface = cs;
        ColorSwatches.init(cs);

        // Track shift key state
        document.addEventListener('keydown', (e) => {
            if (e.shiftKey) isShiftPressed = true;
        });
        document.addEventListener('keyup', (e) => {
            if (!e.shiftKey) isShiftPressed = false;
        });

        // Create module UI container
        const container = document.getElementById('colorSwatches');

        // Build the UI
        buildUI(container);
    }

    /**
     * Build the main UI
     */
    function buildUI(container) {
        // Load the library and populate UI
        ColorSwatches.loadLibrary(function (lib) {
            library = lib;
            if (!library.swatchSize) {
                library.swatchSize = defaultSwatchSize;
            }
            if (!Object.hasOwn(library, 'hideCollapsedGroups')) {
                library.hideCollapsedGroups = defaultHideCollapsedGroups;
            }
            if (!Object.hasOwn(library, 'hideGroupNames')) {
                library.hideGroupNames = defaultHideGroupNames;
            }

            container.innerHTML = `
                <div class="color-swatches-container">
                    <div class="scroll-container" id="swatch-scroll-container">
                        <div id="swatch-area"></div>
                       
                        <!-- Status message -->
                        <div class="status-text" id="status-message"></div>
                        
                        <!-- Management section -->
                        <div class="management-section">
                            <div class="section-header" id="manage-header">
                                <button class="toggle-btn" id="manage-toggle">▼</button>
                                <h3>Library Management</h3>
                            </div>
                            <div class="section-content" id="manage-content">
                                <!-- Swatch size slider -->
                                <div class="slider-container">
                                    <label for="swatch-size-slider">Swatch Size:</label>
                                    <input type="range" id="swatch-size-slider" min="3" max="100" value="${library.swatchSize}">
                                </div>
                                <div class="control-group">
                                    <label class="checkbox-container">
                                        <input type="checkbox" id="hideGroupNames">
                                        <span class="checkmark"></span>
                                        Hide Group Names
                                    </label>
                                </div>
                                <div class="control-group">
                                    <label class="checkbox-container">
                                        <input type="checkbox" id="hideCollapsedGroups">
                                        <span class="checkmark"></span>
                                        Hide Collapsed Groups
                                    </label>
                                </div>

                                <button id="btn-add-group" class="btn-full">Add New Group</button>
                                <button id="btn-import-replace" class="btn-full">Import (Replace)</button>
                                <button id="btn-import-add" class="btn-full">Import (Add)</button>
                                <button id="btn-export" class="btn-full">Export</button>
                                <button id="btn-clear" class="btn-full">Clear</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add unified drop handlers to the main container
            const colorSwatchesContainer = container.querySelector('.color-swatches-container');
            colorSwatchesContainer.addEventListener('dragover', handleUnifiedDragOver);
            colorSwatchesContainer.addEventListener('drop', handleUnifiedDrop);

            populateSwatches();
            setupEventListeners();
            addCheckboxListener("hideCollapsedGroups", "hideCollapsedGroups");
            addCheckboxListener("hideGroupNames", "hideGroupNames");
        });
    }

    /**
     * Populate the UI with swatches from the library
     */
    function populateSwatches() {
        const swatchArea = document.getElementById('swatch-area');
        swatchArea.innerHTML = '';

        if (!library || !library.groups) {
            NotificationSystem.error('Error loading library');
            return;
        }

        // Show empty state if no groups
        if (library.groups.length === 0) {
            swatchArea.innerHTML = `
                <div class="empty-library">
                    <p>Your library is empty</p>
                    <p>Click "Add New Group" to start building your color library</p>
                </div>
            `;
            return;
        }

        // Create groups and swatches
        library.groups.forEach((group, groupIndex) => {
            const groupElement = document.createElement('div');
            groupElement.className = 'swatch-group';
            groupElement.draggable = true;
            groupElement.dataset.groupIndex = groupIndex;

            // Add drag events for groups (only dragstart and dragend)
            groupElement.addEventListener('dragstart', handleGroupDragStart);
            groupElement.addEventListener('dragend', handleGroupDragEnd);

            // Check if we should hide group names
            if (library.hideGroupNames) {
                groupElement.innerHTML = `<div class="group-swatches" id="group-${groupIndex}"></div>`;
            } else {
                groupElement.innerHTML = `
                    <div class="group-header" data-group-index="${groupIndex}">
                        <button class="toggle-btn" data-group-index="${groupIndex}">${group.collapsed ? '►' : '▼'}</button>
                        <span class="group-name">${group.name}</span>
                    </div>
                    <div class="group-swatches ${group.collapsed ? 'hidden' : ''}" id="group-${groupIndex}">
                    </div>
                `;
            }

            let show = true;
            if (group.collapsed && library.hideCollapsedGroups) {
                show = false;
            }

            if (show) {
                swatchArea.appendChild(groupElement);
            }

            // Add swatches to group
            const swatchesContainer = groupElement.querySelector(`#group-${groupIndex}`);

            if ((!group.collapsed || library.hideGroupNames) && group.swatches) {
                group.swatches.forEach((swatch, swatchIndex) => {
                    const swatchElement = document.createElement('div');
                    swatchElement.className = 'color-swatch';
                    swatchElement.title = `${swatch.name} ${swatch.hex}`;
                    swatchElement.style.backgroundColor = swatch.hex;
                    swatchElement.style.width = swatchElement.style.height = `${library.swatchSize}px`;
                    swatchElement.dataset.groupIndex = groupIndex;
                    swatchElement.dataset.swatchIndex = swatchIndex;
                    swatchElement.setAttribute('tooltip-message', `${swatch.name}\n${swatch.hex}`);
                    swatchElement.draggable = true;

                    // Add drag events for swatches (only dragstart and dragend)
                    swatchElement.addEventListener('dragstart', handleSwatchDragStart);
                    swatchElement.addEventListener('dragend', handleSwatchDragEnd);

                    swatchesContainer.appendChild(swatchElement);
                });
            }
        });

        // Add event listeners to swatches and group toggles
        addSwatchEventListeners();
        addGroupToggleListeners();
    }

    /**
     * Unified drag over handler for the entire container
     */
    function handleUnifiedDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        // Determine what's being dragged
        if (draggedSwatch) {
            e.dataTransfer.dropEffect = isShiftPressed ? 'copy' : 'move';
            handleSwatchDragOverUnified(e);
        } else if (draggedGroup) {
            e.dataTransfer.dropEffect = isShiftPressed ? 'copy' : 'move';
            handleGroupDragOverUnified(e);
        }

        return false;
    }

    /**
     * Handle swatch drag over anywhere in the container
     */
    function handleSwatchDragOverUnified(e) {
        // Remove all existing swatch drop indicators
        document.querySelectorAll('.swatch-drop-indicator').forEach(el => el.remove());
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('drop-target'));

        // Find all swatch containers
        const swatchContainers = document.querySelectorAll('.group-swatches:not(.hidden)');

        let closestSwatch = null;
        let closestContainer = null;
        let closestDistance = Infinity;
        let insertBefore = true;

        // Check all swatches in all visible groups
        swatchContainers.forEach(container => {
            const swatches = Array.from(container.querySelectorAll('.color-swatch'));

            swatches.forEach(swatch => {
                const rect = swatch.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const distance = Math.sqrt(
                    Math.pow(e.clientX - centerX, 2) +
                    Math.pow(e.clientY - centerY, 2)
                );

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestSwatch = swatch;
                    closestContainer = container;
                    insertBefore = e.clientX < centerX;
                }
            });

            // Also consider empty space in the container
            if (swatches.length === 0) {
                const rect = container.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const distance = Math.sqrt(
                    Math.pow(e.clientX - centerX, 2) +
                    Math.pow(e.clientY - centerY, 2)
                );

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestSwatch = null;
                    closestContainer = container;
                }
            }
        });

        // Show drop indicator at the closest position
        if (closestContainer) {
            const indicator = document.createElement('div');
            indicator.className = 'swatch-drop-indicator';
            indicator.style.height = `${library.swatchSize}px`;

            // Store the drop target info on the indicator for the drop handler
            indicator.dataset.targetGroupIndex = closestContainer.id.replace('group-', '');

            if (closestSwatch) {
                indicator.dataset.targetSwatchIndex = closestSwatch.dataset.swatchIndex;
                indicator.dataset.insertBefore = insertBefore;

                if (insertBefore) {
                    closestSwatch.parentNode.insertBefore(indicator, closestSwatch);
                } else {
                    closestSwatch.parentNode.insertBefore(indicator, closestSwatch.nextSibling);
                }
            } else {
                // Empty container
                indicator.dataset.targetSwatchIndex = '0';
                indicator.dataset.insertBefore = 'true';
                closestContainer.appendChild(indicator);
            }
        }
    }

    /**
     * Handle group drag over anywhere in the container
     */
    function handleGroupDragOverUnified(e) {
        // Remove all existing drop indicators
        document.querySelectorAll('.group-drop-indicator').forEach(el => el.remove());

        const swatchArea = document.getElementById('swatch-area');
        const groups = Array.from(swatchArea.querySelectorAll('.swatch-group'));

        if (groups.length === 0) {
            return;
        }

        let closestGroup = null;
        let closestDistance = Infinity;
        let insertBefore = true;

        groups.forEach(group => {
            const rect = group.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const distance = Math.abs(e.clientY - centerY);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestGroup = group;
                insertBefore = e.clientY < centerY;
            }
        });

        if (closestGroup) {
            const indicator = document.createElement('div');
            indicator.className = 'group-drop-indicator';

            // Store the drop target info on the indicator
            indicator.dataset.targetGroupIndex = closestGroup.dataset.groupIndex;
            indicator.dataset.insertBefore = insertBefore;

            if (insertBefore) {
                closestGroup.parentNode.insertBefore(indicator, closestGroup);
            } else {
                closestGroup.parentNode.insertBefore(indicator, closestGroup.nextSibling);
            }
        }
    }

    /**
     * Unified drop handler for the entire container
     */
    function handleUnifiedDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        if (e.preventDefault) {
            e.preventDefault();
        }

        // Handle based on what's being dragged
        if (draggedSwatch) {
            handleSwatchDropUnified(e);
        } else if (draggedGroup) {
            handleGroupDropUnified(e);
        }

        return false;
    }

    /**
     * Handle swatch drop using indicator position
     */
    function handleSwatchDropUnified(e) {
        // Find the drop indicator to get target position
        const indicator = document.querySelector('.swatch-drop-indicator');

        // Remove all indicators and highlights
        document.querySelectorAll('.swatch-drop-indicator').forEach(el => el.remove());
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('drop-target'));

        if (!draggedSwatch || !indicator) return false;

        const targetGroupIndex = parseInt(indicator.dataset.targetGroupIndex);
        const targetSwatchIndex = parseInt(indicator.dataset.targetSwatchIndex);
        const insertBefore = indicator.dataset.insertBefore === 'true';

        const adjustedTargetIndex = insertBefore ? targetSwatchIndex : targetSwatchIndex + 1;

        if (isShiftPressed) {
            ColorSwatches.duplicateSwatch(
                draggedSwatch.groupIndex,
                draggedSwatch.swatchIndex,
                targetGroupIndex,
                adjustedTargetIndex,
                () => {
                    ColorSwatches.loadLibrary((lib) => {
                        library = lib;
                        populateSwatches();
                    });
                }
            );
        } else {
            ColorSwatches.moveSwatch(
                draggedSwatch.groupIndex,
                draggedSwatch.swatchIndex,
                targetGroupIndex,
                adjustedTargetIndex,
                () => {
                    ColorSwatches.loadLibrary((lib) => {
                        library = lib;
                        populateSwatches();
                    });
                }
            );
        }

        return false;
    }

    /**
     * Handle group drop using indicator position
     */
    function handleGroupDropUnified(e) {
        // Find the drop indicator to get target position
        const indicator = document.querySelector('.group-drop-indicator');

        // Remove drop indicator
        document.querySelectorAll('.group-drop-indicator').forEach(el => el.remove());

        if (!draggedGroup || !indicator) return false;

        const targetGroupIndex = parseInt(indicator.dataset.targetGroupIndex);
        const insertBefore = indicator.dataset.insertBefore === 'true';

        const adjustedTargetIndex = insertBefore ? targetGroupIndex : targetGroupIndex + 1;

        if (isShiftPressed) {
            ColorSwatches.duplicateGroup(draggedGroup.groupIndex, adjustedTargetIndex, () => {
                ColorSwatches.loadLibrary((lib) => {
                    library = lib;
                    populateSwatches();
                });
            });
        } else {
            ColorSwatches.moveGroup(draggedGroup.groupIndex, adjustedTargetIndex, () => {
                ColorSwatches.loadLibrary((lib) => {
                    library = lib;
                    populateSwatches();
                });
            });
        }

        return false;
    }

    /**
     * Swatch drag start handler
     */
    function handleSwatchDragStart(e) {
        draggedSwatch = {
            groupIndex: parseInt(this.dataset.groupIndex),
            swatchIndex: parseInt(this.dataset.swatchIndex),
            element: this
        };
        this.classList.add('dragging-swatch');
        e.dataTransfer.effectAllowed = isShiftPressed ? 'copy' : 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    /**
     * Swatch drag end handler
     */
    function handleSwatchDragEnd(e) {
        this.classList.remove('dragging-swatch');
        document.querySelectorAll('.swatch-drop-indicator').forEach(el => el.remove());
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('drop-target'));
        draggedSwatch = null;
    }

    /**
     * Group drag start handler
     */
    function handleGroupDragStart(e) {
        draggedGroup = {
            groupIndex: parseInt(this.dataset.groupIndex),
            element: this
        };
        this.style.border = '1px dashed #2d8ceb';
        e.dataTransfer.effectAllowed = isShiftPressed ? 'copy' : 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    /**
     * Group drag end handler
     */
    function handleGroupDragEnd(e) {
        this.style.opacity = '1';
        document.querySelectorAll('.group-drop-indicator').forEach(el => el.remove());
        draggedGroup = null;
    }

    /**
     * Add event listeners to swatches
     */
    function addSwatchEventListeners() {
        const swatches = document.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            // Click to copy color
            swatch.addEventListener('click', function (e) {
                // Don't trigger if dragging
                if (e.defaultPrevented) return;

                const groupIndex = parseInt(this.dataset.groupIndex);
                const swatchIndex = parseInt(this.dataset.swatchIndex);
                const hex = library.groups[groupIndex].swatches[swatchIndex].hex;

                ColorSwatches.copyToClipboard(hex);
                NotificationSystem.success(`Copied ${hex} to clipboard`);
            });

            // Context menu
            swatch.addEventListener('contextmenu', function (e) {
                e.preventDefault();

                const groupIndex = parseInt(this.dataset.groupIndex);
                const swatchIndex = parseInt(this.dataset.swatchIndex);
                const swatchData = library.groups[groupIndex].swatches[swatchIndex];

                showSwatchContextMenu(e.clientX, e.clientY, swatchData, groupIndex, swatchIndex);
            });
        });
    }

    /**
     * Add event listeners to group toggle buttons and headers
     */
    function addGroupToggleListeners() {
        // Add listeners to toggle buttons specifically
        const toggleBtns = document.querySelectorAll('.group-header .toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const groupIndex = parseInt(this.dataset.groupIndex);
                toggleGroupState(groupIndex);
            });
        });

        // Add listeners to entire group headers for folding
        const headers = document.querySelectorAll('.group-header');
        headers.forEach(header => {
            header.addEventListener('click', function (e) {
                // Only toggle if not clicking the button itself
                if (!e.target.classList.contains('toggle-btn')) {
                    const groupIndex = parseInt(this.dataset.groupIndex);
                    toggleGroupState(groupIndex);
                }
            });

            // Context menu for group headers
            header.addEventListener('contextmenu', function (e) {
                e.preventDefault();
                e.stopPropagation();

                const groupIndex = parseInt(this.dataset.groupIndex);
                const groupData = library.groups[groupIndex];

                showGroupContextMenu(e.clientX, e.clientY, groupData, groupIndex);
            });
        });

        // Common function to handle toggling a group
        function toggleGroupState(groupIndex) {
            ColorSwatches.toggleGroup(groupIndex, function () {
                ColorSwatches.loadLibrary(function (lib) {
                    library = lib;
                    populateSwatches();
                });
            });
        }
    }

    /**
     * Show context menu for a group
     */
    function showGroupContextMenu(x, y, group, groupIndex) {
        // Remove any existing context menu
        const existingMenu = document.getElementById('context-menu');
        if (existingMenu) existingMenu.remove();

        // Create context menu
        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.className = 'context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        menu.innerHTML = `
            <div class="menu-item" data-action="rename">Rename</div>
            <div class="menu-item" data-action="addColor">Add Color</div>
            <div class="menu-item" data-action="duplicate">Duplicate</div>
            <div class="menu-item" data-action="delete">Delete</div>
        `;

        document.body.appendChild(menu);

        // Add event listeners to menu items
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function () {
                const action = this.dataset.action;

                switch (action) {
                    case 'rename':
                        ModalSystem.prompt('Enter new group name:', group.name, {
                            title: 'Rename Group',
                            placeholder: 'Group name',
                            validator: (value) => {
                                if (!value || !value.trim()) {
                                    return 'Group name cannot be empty';
                                }
                                return true;
                            }
                        }).then((newName) => {
                            if (newName) {
                                ColorSwatches.renameGroup(groupIndex, newName.trim(), () => {
                                    ColorSwatches.loadLibrary((lib) => {
                                        library = lib;
                                        populateSwatches();
                                        NotificationSystem.success('Group renamed');
                                    });
                                });
                            }
                        });
                        break;

                    case 'addColor':
                        ModalSystem.prompt('Enter HEX color value:', '#FFFFFF', {
                            title: 'Add Color to Group',
                            placeholder: '#FF0000',
                            helperText: 'Format: #RGB or #RRGGBB',
                            validator: (value) => {
                                const trimmed = value.trim();
                                if (!trimmed) return 'HEX value is required';
                                if (!/^#([0-9A-F]{3}){1,2}$/i.test(trimmed)) {
                                    return 'Invalid HEX format. Use #RGB or #RRGGBB';
                                }
                                return true;
                            }
                        }).then((hex) => {
                            if (hex) {
                                ColorSwatches.addSwatchToGroup(groupIndex, hex.toUpperCase(), () => {
                                    ColorSwatches.loadLibrary((lib) => {
                                        library = lib;
                                        populateSwatches();
                                        NotificationSystem.success('Color added');
                                    });
                                });
                            }
                        });
                        break;

                    case 'duplicate':
                        ColorSwatches.duplicateGroup(groupIndex, groupIndex + 1, () => {
                            ColorSwatches.loadLibrary((lib) => {
                                library = lib;
                                populateSwatches();
                                NotificationSystem.success('Group duplicated');
                            });
                        });
                        break;

                    case 'delete':
                        ModalSystem.confirm(`Delete group "${group.name}"?`, {
                            title: 'Delete Group',
                            confirmText: 'Delete',
                            cancelText: 'Cancel'
                        }).then((confirmed) => {
                            if (confirmed) {
                                ColorSwatches.deleteGroup(groupIndex, () => {
                                    ColorSwatches.loadLibrary((lib) => {
                                        library = lib;
                                        populateSwatches();
                                        NotificationSystem.success('Group deleted');
                                    });
                                });
                            }
                        });
                        break;
                }

                menu.remove();
            });
        });
    }

    /**
     * Add event listeners to group checkbox
     */
    function addCheckboxListener(elementId, propName) {
        const checkbox = document.getElementById(elementId);

        if (checkbox) {
            checkbox.checked = library[propName];

            if (library[propName]) {
                checkbox.parentElement.classList.add('checked');
            } else {
                checkbox.parentElement.classList.remove('checked');
            }
        }

        if (checkbox) {
            checkbox.addEventListener('change', function () {
                library[propName] = this.checked;

                ColorSwatches.updateProp(library[propName], propName, function () {
                    ColorSwatches.loadLibrary(function (lib) {
                        library = lib;
                        populateSwatches();
                    });
                });
            });
        }
    }

    /**
     * Set up event listeners for buttons and controls
     */
    function setupEventListeners() {
        // Management toggle - click on entire header
        const manageHeader = document.getElementById('manage-header');
        const manageToggle = document.getElementById('manage-toggle');
        const manageContent = document.getElementById('manage-content');

        manageHeader.addEventListener('click', function () {
            const isVisible = manageContent.style.display !== 'none';
            manageContent.style.display = isVisible ? 'none' : 'flex';
            manageToggle.textContent = isVisible ? '►' : '▼';
        });

        // Add new group button
        document.getElementById('btn-add-group').addEventListener('click', function () {
            ModalSystem.prompt('Enter group name:', 'New Group', {
                title: 'Add New Group',
                placeholder: 'Group name',
                validator: (value) => {
                    if (!value || !value.trim()) {
                        return 'Group name cannot be empty';
                    }
                    return true;
                }
            }).then((groupName) => {
                if (groupName) {
                    ColorSwatches.addGroup(groupName.trim(), () => {
                        ColorSwatches.loadLibrary((lib) => {
                            library = lib;
                            populateSwatches();
                            NotificationSystem.success('Group added');
                        });
                    });
                }
            });
        });

        // Import Replace button
        document.getElementById('btn-import-replace').addEventListener('click', function () {
            openFileDialog('.json', function (fileContent) {
                if (fileContent) {
                    ColorSwatches.importLibrary(fileContent, true, function (success) {
                        if (success) {
                            ColorSwatches.loadLibrary(function (lib) {
                                library = lib;
                                populateSwatches();
                                NotificationSystem.success('Library imported successfully');
                            });
                        } else {
                            NotificationSystem.error('Failed to import library');
                        }
                    });
                }
            });
        });

        // Import Add button
        document.getElementById('btn-import-add').addEventListener('click', function () {
            openFileDialog('.json', function (fileContent) {
                if (fileContent) {
                    ColorSwatches.importLibrary(fileContent, false, function (success) {
                        if (success) {
                            ColorSwatches.loadLibrary(function (lib) {
                                library = lib;
                                populateSwatches();
                                NotificationSystem.success('Library added successfully');
                            });
                        } else {
                            NotificationSystem.error('Failed to add library');
                        }
                    });
                }
            });
        });

        // Export button
        document.getElementById('btn-export').addEventListener('click', function () {
            var defaultName = 'swatchLibrary.json';
            csInterface.evalScript(`callModuleFunction("colorSwatches", "saveFileFromJSX", ['${defaultName}','${JSON.stringify(library)}'])`, function (success) {
                if (JSON.parse(success).result === "success") {
                    NotificationSystem.success('Library exported successfully');
                } else {
                    NotificationSystem.error('Failed to export library');
                }
            });
        });

        // Clear button
        document.getElementById('btn-clear').addEventListener('click', function () {
            ModalSystem.confirm('Clear the library? This cannot be undone.', {
                title: 'Clear Library',
                confirmText: 'Clear',
                cancelText: 'Cancel'
            }).then((confirmed) => {
                if (confirmed) {
                    ColorSwatches.clearLibrary(function (success) {
                        if (success) {
                            ColorSwatches.loadLibrary(function (lib) {
                                library = lib;
                                populateSwatches();
                                NotificationSystem.success('Library cleared');
                            });
                        } else {
                            NotificationSystem.error('Failed to clear library');
                        }
                    });
                }
            });
        });

        // Swatch size slider
        document.getElementById('swatch-size-slider').addEventListener('input', function () {
            library.swatchSize = parseInt(this.value);
            ColorSwatches.updateProp(library.swatchSize, "swatchSize", function () {
                ColorSwatches.loadLibrary(function (lib) {
                    library = lib;
                    populateSwatches();
                });
            });
        });

        // Click outside to close context menu
        document.addEventListener('click', function (e) {
            const contextMenu = document.getElementById('context-menu');
            if (contextMenu && !contextMenu.contains(e.target)) {
                contextMenu.remove();
            }
        });
    }

    /**
     * Show context menu for a swatch
     */
    function showSwatchContextMenu(x, y, swatch, groupIndex, swatchIndex) {
        // Remove any existing context menu
        const existingMenu = document.getElementById('context-menu');
        if (existingMenu) existingMenu.remove();

        // Create context menu
        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.className = 'context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        menu.innerHTML = `
            <div class="menu-item" data-action="edit">Edit</div>
            <div class="menu-item" data-action="editHex">Edit by HEX...</div>
            <div class="menu-item" data-action="delete">Delete</div>
            <div class="menu-item" data-action="copy">Copy HEX</div>
        `;

        document.body.appendChild(menu);

        // Add event listeners to menu items
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function () {
                const action = this.dataset.action;

                switch (action) {
                    case 'editHex':
                        ModalSystem.prompt('Enter HEX color value:', swatch.hex || '#FFFFFF', {
                            title: 'Edit Swatch HEX',
                            placeholder: '#FF0000',
                            helperText: 'Format: #RGB or #RRGGBB',
                            validator: (value) => {
                                const trimmed = value.trim();
                                if (!trimmed) return 'HEX value is required';
                                if (!/^#([0-9A-F]{3}){1,2}$/i.test(trimmed)) {
                                    return 'Invalid HEX format. Use #RGB or #RRGGBB';
                                }
                                return true;
                            }
                        }).then((newHex) => {
                            if (newHex) {
                                ColorSwatches.updateSwatch(groupIndex, swatchIndex, { hex: newHex.toUpperCase() }, function () {
                                    ColorSwatches.loadLibrary(function (lib) {
                                        library = lib;
                                        populateSwatches();
                                    });
                                });
                            }
                        });
                        break;

                    case 'edit':
                        showColorPicker(swatch.hex, function (newHex) {
                            if (newHex) {
                                ColorSwatches.updateSwatch(groupIndex, swatchIndex, { hex: newHex }, function () {
                                    ColorSwatches.loadLibrary(function (lib) {
                                        library = lib;
                                        populateSwatches();
                                    });
                                });
                            }
                        });
                        break;

                    case 'delete':
                        ColorSwatches.deleteSwatch(groupIndex, swatchIndex, function () {
                            ColorSwatches.loadLibrary(function (lib) {
                                library = lib;
                                populateSwatches();
                            });
                        });
                        break;

                    case 'copy':
                        ColorSwatches.copyToClipboard(swatch.hex);
                        NotificationSystem.success(`Copied ${swatch.hex} to clipboard`);
                        break;
                }

                menu.remove();
            });
        });
    }

    /**
     * Show a color picker dialog
     */
    function showColorPicker(initialColor, callback) {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = initialColor;

        input.addEventListener('change', function () {
            callback(this.value.toUpperCase());
        });

        input.click();
    }

    /**
     * Open a file dialog
     */
    function openFileDialog(fileType, callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = fileType;

        input.onchange = function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    callback(event.target.result);
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }

    /**
     * Cleanup function
     */
    function cleanup() {
        // Remove event listeners
        document.removeEventListener('keydown', () => { });
        document.removeEventListener('keyup', () => { });
        document.removeEventListener('click', () => { });

        // Clear references
        csInterface = null;
        library = null;
        draggedSwatch = null;
        draggedGroup = null;
    }

    // Public API
    return {
        init: init,
        cleanup: cleanup
    };
})();