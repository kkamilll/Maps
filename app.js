/**
 * APP.JS
 * Główny kontroler aplikacji, interfejsu, palety zasobów, panelu inspektora i narzędzi.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicjalizacja instancji
    const canvasEl = document.getElementById('office-canvas');
    const canvasContainer = document.getElementById('canvas-viewport');
    
    const officeCanvas = new OfficeCanvas(canvasEl, canvasContainer);
    window.officeAppCanvas = officeCanvas;
    const storageManager = new StorageManager(officeCanvas);
    const inventoryManager = new InventoryManager(officeCanvas, storageManager);

    // 2. Załaduj stan lub szablon startowy
    const hasData = storageManager.loadCurrentRoom();
    if (!hasData) {
        storageManager.loadDemoTemplate();
    }

    // 3. Generowanie palety elementów (lewy panel)
    setupAssetPalette(officeCanvas);

    // 4. Obsługa paska narzędzi (Toolbar)
    setupToolbar(officeCanvas, storageManager, inventoryManager);

    // 5. Obsługa panelu bocznego (Inspektor właściwości)
    setupInspector(officeCanvas, storageManager);

    // 6. Obsługa wyboru i dodawania pomieszczeń
    setupRoomManager(officeCanvas, storageManager);

    // 7. Auto-zapis po zmianach
    officeCanvas.onElementsChange = () => {
        storageManager.autoSave();
        updateRoomStats(officeCanvas);
    };

    officeCanvas.onSelectionChange = () => {
        updateInspector(officeCanvas);
    };

    window.addEventListener('resize', () => {
        officeCanvas.resizeCanvas();
    });

    // Początkowa aktualizacja statystyk i inspektora
    updateRoomStats(officeCanvas);
    updateInspector(officeCanvas);
});

// --- GENEROWANIE PALETY PRZEDMIOTÓW ---
function setupAssetPalette(canvas) {
    const paletteContainer = document.getElementById('palette-categories-container');
    const categoryTabs = document.querySelectorAll('.palette-tab-btn');
    let activeCategory = 'it_workstation';

    function renderCategoryItems(catId) {
        paletteContainer.innerHTML = '';
        const items = Object.values(ASSET_DEFINITIONS).filter(def => def.category === catId);

        items.forEach(def => {
            const card = document.createElement('div');
            card.className = 'palette-item-card';
            card.setAttribute('draggable', 'true');
            card.title = `Przeciągnij lub kliknij, aby dodać: ${def.name}`;

            card.innerHTML = `
                <div class="palette-item-icon">${def.svg}</div>
                <div class="palette-item-info">
                    <span class="palette-item-title">${def.name}</span>
                    <span class="palette-item-dims">${def.width} &times; ${def.height} px</span>
                </div>
            `;

            // Przeciąganie na Canvas
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/asset-type', def.type);
            });

            // Kliknięcie -> dodanie na środek widoku
            card.addEventListener('click', () => {
                const rect = canvas.canvas.getBoundingClientRect();
                const centerWorld = canvas.screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
                canvas.addElement(def.type, centerWorld.x, centerWorld.y);
            });

            paletteContainer.appendChild(card);
        });
    }

    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeCategory = tab.dataset.category;
            renderCategoryItems(activeCategory);
        });
    });

    renderCategoryItems(activeCategory);
}

// --- OBSŁUGA PASKA NARZĘDZI ---
function setupToolbar(canvas, storage, inventory) {
    // Przełączanie bocznych paneli (paleta i właściwości)
    const btnTogglePalette = document.getElementById('btn-toggle-palette');
    const btnToggleInspector = document.getElementById('btn-toggle-inspector');
    const sidebarPalette = document.getElementById('sidebar-palette');
    const sidebarInspector = document.getElementById('sidebar-inspector');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const btnClosePalette = document.getElementById('btn-close-palette');
    const btnCloseInspector = document.getElementById('btn-close-inspector');

    function closeAllDrawers() {
        sidebarPalette?.classList.remove('open');
        sidebarInspector?.classList.remove('open');
        sidebarBackdrop?.classList.add('hidden');
        if (window.innerWidth < 1024) {
            btnTogglePalette?.classList.remove('active');
            btnToggleInspector?.classList.remove('active');
        }
    }

    btnTogglePalette?.addEventListener('click', () => {
        if (window.innerWidth < 1024) {
            const isOpen = sidebarPalette?.classList.contains('open');
            closeAllDrawers();
            if (!isOpen) {
                sidebarPalette?.classList.add('open');
                sidebarBackdrop?.classList.remove('hidden');
                btnTogglePalette.classList.add('active');
            }
        } else {
            sidebarPalette?.classList.toggle('collapsed');
            btnTogglePalette.classList.toggle('active', !sidebarPalette?.classList.contains('collapsed'));
            setTimeout(() => canvas.resizeCanvas(), 250);
        }
    });

    btnToggleInspector?.addEventListener('click', () => {
        if (window.innerWidth < 1024) {
            const isOpen = sidebarInspector?.classList.contains('open');
            closeAllDrawers();
            if (!isOpen) {
                sidebarInspector?.classList.add('open');
                sidebarBackdrop?.classList.remove('hidden');
                btnToggleInspector.classList.add('active');
            }
        } else {
            sidebarInspector?.classList.toggle('collapsed');
            btnToggleInspector.classList.toggle('active', !sidebarInspector?.classList.contains('collapsed'));
            setTimeout(() => canvas.resizeCanvas(), 250);
        }
    });

    btnClosePalette?.addEventListener('click', closeAllDrawers);
    btnCloseInspector?.addEventListener('click', closeAllDrawers);
    sidebarBackdrop?.addEventListener('click', closeAllDrawers);

    // Tryby narzędzi
    const btnToolSelect = document.getElementById('tool-select');
    const btnToolCable = document.getElementById('tool-cable');
    const cableTypeSelect = document.getElementById('cable-type-select');

    btnToolSelect?.addEventListener('click', () => {
        canvas.currentTool = 'select';
        canvas.cableStartElementId = null;
        btnToolSelect.classList.add('active');
        btnToolCable.classList.remove('active');
        document.getElementById('cable-toolbar-options')?.classList.add('hidden');
    });

    btnToolCable?.addEventListener('click', () => {
        canvas.currentTool = 'cable';
        canvas.cableType = cableTypeSelect ? cableTypeSelect.value : 'lan';
        btnToolCable.classList.add('active');
        btnToolSelect.classList.remove('active');
        document.getElementById('cable-toolbar-options')?.classList.remove('hidden');
    });

    cableTypeSelect?.addEventListener('change', (e) => {
        canvas.cableType = e.target.value;
    });

    // Zoom & Widok
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => canvas.zoomIn());
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => canvas.zoomOut());
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => canvas.resetView());

    // Przełączniki widoku
    const toggleGrid = document.getElementById('toggle-grid');
    toggleGrid?.addEventListener('click', () => {
        canvas.showGrid = !canvas.showGrid;
        toggleGrid.classList.toggle('active', canvas.showGrid);
        canvas.render();
    });

    const toggleSnap = document.getElementById('toggle-snap');
    toggleSnap?.addEventListener('click', () => {
        canvas.snapToGrid = !canvas.snapToGrid;
        toggleSnap.classList.toggle('active', canvas.snapToGrid);
    });

    const toggleLabels = document.getElementById('toggle-labels');
    toggleLabels?.addEventListener('click', () => {
        canvas.showLabels = !canvas.showLabels;
        toggleLabels.classList.toggle('active', canvas.showLabels);
        canvas.render();
    });

    const toggleCables = document.getElementById('toggle-cables');
    toggleCables?.addEventListener('click', () => {
        canvas.showCables = !canvas.showCables;
        toggleCables.classList.toggle('active', canvas.showCables);
        canvas.render();
    });

    // Undo / Redo
    document.getElementById('btn-undo')?.addEventListener('click', () => canvas.undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => canvas.redo());

    // Obrót i duplikacja
    document.getElementById('btn-rotate-left')?.addEventListener('click', () => canvas.rotateSelected(-45));
    document.getElementById('btn-rotate-right')?.addEventListener('click', () => canvas.rotateSelected(45));
    document.getElementById('btn-duplicate')?.addEventListener('click', () => canvas.duplicateSelected());
    document.getElementById('btn-delete-selected')?.addEventListener('click', () => canvas.removeSelected());

    // Motyw ciemny / jasny
    const themeBtn = document.getElementById('btn-theme-toggle');
    themeBtn?.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        themeBtn.innerHTML = isLight ? '🌙 Ciemny' : '☀️ Jasny';
        canvas.render();
    });

    // Szablon demo
    document.getElementById('btn-load-demo')?.addEventListener('click', () => {
        if (confirm('Załadować przykładowe biuro demo? Spowoduje to zastąpienie bieżącego widoku.')) {
            storage.loadDemoTemplate();
            updateRoomStats(canvas);
            updateInspector(canvas);
        }
    });

    // Wyczyść mapę
    document.getElementById('btn-clear-canvas')?.addEventListener('click', () => {
        if (confirm('Czy na pewno wyczyścić cały rzut biura?')) {
            canvas.saveState();
            canvas.elements = [];
            canvas.cables = [];
            canvas.selectedIds.clear();
            canvas.render();
            storage.autoSave();
            updateRoomStats(canvas);
            updateInspector(canvas);
        }
    });

    // Import / Eksport
    document.getElementById('btn-export-json')?.addEventListener('click', () => storage.exportToJSON());
    document.getElementById('btn-export-png')?.addEventListener('click', () => storage.exportToPNG());
    document.getElementById('btn-export-csv')?.addEventListener('click', () => storage.exportToCSV());

    const fileInput = document.getElementById('file-input-json');
    document.getElementById('btn-import-json')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            storage.importFromJSON(file).then(() => {
                updateRoomStats(canvas);
                updateInspector(canvas);
                fileInput.value = '';
            }).catch(err => {
                alert('Błąd podczas wczytywania pliku: ' + err.message);
            });
        }
    });
}

// --- INSPEKTOR WŁAŚCIWOŚCI (PRAWY PANEL) ---
function setupInspector(canvas, storage) {
    const inspectorContainer = document.getElementById('inspector-content');

    // Podpięcie dwustronnej aktualizacji formularza
    inspectorContainer.addEventListener('input', (e) => {
        const target = e.target;
        const field = target.dataset.prop;
        const singleSelected = canvas.getFirstSelected();
        if (!singleSelected || !field) return;

        if (field === 'x') singleSelected.x = parseInt(target.value) || 0;
        else if (field === 'y') singleSelected.y = parseInt(target.value) || 0;
        else if (field === 'width') singleSelected.width = Math.max(10, parseInt(target.value) || 10);
        else if (field === 'height') singleSelected.height = Math.max(10, parseInt(target.value) || 10);
        else if (field === 'rotation') singleSelected.rotation = parseInt(target.value) || 0;
        else {
            singleSelected.props[field] = target.value;
        }

        canvas.render();
        storage.autoSave();
    });

    inspectorContainer.addEventListener('change', (e) => {
        const target = e.target;
        const field = target.dataset.prop;
        const singleSelected = canvas.getFirstSelected();
        if (!singleSelected || !field) return;

        if (field === 'status') {
            singleSelected.props.status = target.value;
            canvas.render();
            storage.autoSave();
        }
    });
}

function updateInspector(canvas) {
    const container = document.getElementById('inspector-content');
    const selectedCount = canvas.selectedIds.size;

    if (selectedCount === 0) {
        const itCount = canvas.elements.filter(e => ASSET_DEFINITIONS[e.type]?.isITAsset).length;
        const cableCount = canvas.cables.length;

        container.innerHTML = `
            <div class="inspector-empty-state">
                <div class="empty-icon">🖱️</div>
                <h3>Wybierz obiekt</h3>
                <p>Kliknij element na mapie, aby go edytować.</p>
                <div class="inspector-stats-row">
                    <div class="stat-pill">💻 <strong>${itCount}</strong> IT</div>
                    <div class="stat-pill">🔌 <strong>${cableCount}</strong> kabli</div>
                </div>
            </div>
        `;
        return;
    }

    if (selectedCount > 1) {
        container.innerHTML = `
            <div class="inspector-multi-state">
                <h3>Zaznaczono: ${selectedCount}</h3>
                <div class="action-buttons-group">
                    <button class="btn btn-secondary" onclick="window.officeAppCanvas.rotateSelected(45)">↻ Obróć</button>
                    <button class="btn btn-secondary" onclick="window.officeAppCanvas.duplicateSelected()">📑 Duplikuj</button>
                    <button class="btn btn-danger" onclick="window.officeAppCanvas.removeSelected()">🗑️ Usuń</button>
                </div>
            </div>
        `;
        return;
    }

    const el = canvas.getFirstSelected();
    const def = ASSET_DEFINITIONS[el.type];
    const p = el.props || {};

    let fields = '';
    if (def?.isITAsset) {
        fields = `
            <div class="form-group">
                <label>Pracownik / Stanowisko</label>
                <input type="text" class="form-input" data-prop="employee" value="${escapeHtml(p.employee || '')}" placeholder="np. Jan Kowalski">
            </div>

            <div class="form-group">
                <label>Model sprzętu</label>
                <input type="text" class="form-input" data-prop="model" value="${escapeHtml(p.model || '')}" placeholder="np. Dell OptiPlex">
            </div>

            <div class="form-row">
                <div class="form-group col-6">
                    <label>Adres IP</label>
                    <input type="text" class="form-input" data-prop="ipAddress" value="${escapeHtml(p.ipAddress || '')}" placeholder="192.168.1.10">
                </div>
                <div class="form-group col-6">
                    <label>Status</label>
                    <select class="form-select" data-prop="status">
                        <option value="active" ${p.status === 'active' ? 'selected' : ''}>🟢 Aktywny</option>
                        <option value="repair" ${p.status === 'repair' ? 'selected' : ''}>🟠 Serwis</option>
                        <option value="spare" ${p.status === 'spare' ? 'selected' : ''}>🔵 Magazyn</option>
                        <option value="decommissioned" ${p.status === 'decommissioned' ? 'selected' : ''}>⚪ Wycofany</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group col-6">
                    <label>Nr seryjny (S/N)</label>
                    <input type="text" class="form-input" data-prop="serialNumber" value="${escapeHtml(p.serialNumber || '')}" placeholder="SN-001">
                </div>
                <div class="form-group col-6">
                    <label>Port switcha</label>
                    <input type="text" class="form-input" data-prop="switchPort" value="${escapeHtml(p.switchPort || '')}" placeholder="SW1-P05">
                </div>
            </div>
        `;
    } else if (el.type === 'zone') {
        fields = `
            <div class="form-group">
                <label>Nazwa strefy</label>
                <input type="text" class="form-input" data-prop="label" value="${escapeHtml(p.label || '')}" placeholder="np. Dział IT">
            </div>
            <div class="form-group">
                <label>Kolor ramki</label>
                <input type="color" class="form-input" data-prop="borderColor" value="${p.borderColor || '#6366f1'}">
            </div>
        `;
    } else if (el.type.startsWith('desk_') || el.type === 'conf_table') {
        fields = `
            <div class="form-group">
                <label>Podpis mebla</label>
                <input type="text" class="form-input" data-prop="label" value="${escapeHtml(p.label || '')}" placeholder="np. Biurko 1">
            </div>
        `;
    }

    const connectedCables = canvas.cables.filter(c => c.fromId === el.id || c.toId === el.id);
    let cableListHtml = '';
    if (connectedCables.length > 0) {
        cableListHtml = `
            <div class="form-section-title">Kable (${connectedCables.length})</div>
            <div class="cable-items-list">
                ${connectedCables.map(c => {
                    const otherId = c.fromId === el.id ? c.toId : c.fromId;
                    const otherEl = canvas.elements.find(item => item.id === otherId);
                    const otherDef = ASSET_DEFINITIONS[otherEl?.type];
                    const otherName = otherEl?.props?.employee || otherDef?.name || 'Urządzenie';
                    return `
                        <div class="cable-item-badge">
                            <span class="cable-color-dot" style="background: ${c.color}"></span>
                            <span class="cable-dest">&rarr; ${escapeHtml(otherName)}</span>
                            <button class="btn-del-cable" onclick="window.officeAppCanvas.removeCable('${c.id}')" title="Rozłącz">&times;</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    container.innerHTML = `
        <div class="inspector-header">
            <div class="inspector-item-icon">${def?.svg || '📦'}</div>
            <div>
                <h3 class="inspector-item-title">${def?.name || el.type}</h3>
            </div>
        </div>

        ${fields}
        ${cableListHtml}

        <div class="inspector-actions" style="margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
            <button class="btn btn-secondary" onclick="window.officeAppCanvas.rotateSelected(45)" title="Obróć o 45°">↻ Obróć</button>
            <button class="btn btn-secondary" onclick="window.officeAppCanvas.duplicateSelected()" title="Duplikuj">📑 Kopiuj</button>
            <button class="btn btn-danger" onclick="window.officeAppCanvas.removeSelected()" title="Usuń">🗑️ Usuń</button>
        </div>
    `;
}

// --- OBSŁUGA POMIESZCZEŃ I STATYSTYK ---
function setupRoomManager(canvas, storage) {
    const roomSelect = document.getElementById('room-selector');
    const btnAddRoom = document.getElementById('btn-add-room');

    function refreshRoomOptions() {
        if (!roomSelect) return;
        roomSelect.innerHTML = '';
        storage.rooms.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = r.name;
            if (r.id === storage.currentRoomId) opt.selected = true;
            roomSelect.appendChild(opt);
        });
    }

    refreshRoomOptions();
    window.refreshRoomOptions = refreshRoomOptions;

    roomSelect?.addEventListener('change', (e) => {
        storage.autoSave();
        storage.currentRoomId = e.target.value;
        const loaded = storage.loadCurrentRoom();
        if (!loaded) {
            canvas.elements = [];
            canvas.cables = [];
            canvas.render();
        }
        updateRoomStats(canvas);
        updateInspector(canvas);
    });

    btnAddRoom?.addEventListener('click', () => {
        const name = prompt('Podaj nazwę nowego pomieszczenia / piętra:', 'Biuro Piętro 2');
        if (name && name.trim()) {
            const newId = 'room_' + Date.now().toString(36);
            storage.rooms.push({ id: newId, name: name.trim() });
            storage.saveRoomsList();
            storage.currentRoomId = newId;
            canvas.elements = [];
            canvas.cables = [];
            canvas.render();
            refreshRoomOptions();
            storage.autoSave();
            updateRoomStats(canvas);
            updateInspector(canvas);
        }
    });

    // Dostęp globalny do canvas dla handlerów inline w inspektorze
    window.officeAppCanvas = canvas;
}

function updateRoomStats(canvas) {
    const itElements = canvas.elements.filter(e => ASSET_DEFINITIONS[e.type]?.isITAsset);
    const pcCount = itElements.filter(e => e.type === 'pc_workstation' || e.type === 'dual_monitor').length;
    const laptopCount = itElements.filter(e => e.type === 'laptop').length;
    const serverCount = itElements.filter(e => e.type === 'server_rack').length;
    const networkCount = itElements.filter(e => e.type === 'network_switch' || e.type === 'wifi_ap').length;
    const printerCount = itElements.filter(e => e.type === 'printer').length;

    const badge = document.getElementById('header-it-count-badge');
    if (badge) {
        badge.textContent = `${itElements.length} urządzeń IT`;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
