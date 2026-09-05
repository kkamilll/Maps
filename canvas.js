/**
 * CANVAS.JS
 * Zaawansowany silnik rysowania rzutów biura, obiektów, kabli, obsługi zoom/pan,
 * przyciągania do siatki, obracania, skalowania i zaznaczania.
 */

class OfficeCanvas {
    constructor(canvasElement, containerElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.container = containerElement;

        // Stan widoku (Zoom & Pan)
        this.scale = 1;
        this.minScale = 0.2;
        this.maxScale = 3.0;
        this.panX = 100;
        this.panY = 60;
        this.isPanning = false;
        this.startPanX = 0;
        this.startPanY = 0;

        // Ustawienia siatki
        this.gridSize = 20;
        this.snapToGrid = true;
        this.showGrid = true;
        this.showLabels = true;
        this.showCables = true;
        this.showDimensions = true;

        // Stan danych
        this.elements = [];
        this.cables = [];
        this.selectedIds = new Set();
        this.hoveredId = null;

        // Narzędzia
        this.currentTool = 'select'; // 'select', 'cable', 'wall_draw', 'delete'
        this.cableStartElementId = null;
        this.cableType = 'lan';

        // Drag & Transform
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.draggedElementPositions = new Map();

        this.isRotating = false;
        this.rotateCenter = { x: 0, y: 0 };
        this.rotateStartAngle = 0;
        this.initialRotation = 0;

        this.isResizing = false;
        this.resizeHandle = null;
        this.resizeInitialRect = null;

        // Zaznaczanie obszarem (Marquee selection)
        this.isBoxSelecting = false;
        this.boxSelectStart = { x: 0, y: 0 };
        this.boxSelectCurrent = { x: 0, y: 0 };

        // Pamięć podręczna ikon SVG jako obrazów (Image objects)
        this.iconCache = new Map();

        // Historia (Undo / Redo)
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 40;

        // Pomocnicze zmienne dla interakcji i cofania
        this.isSpacePressed = false;
        this.preActionState = null;
        this.hasActionMoved = false;

        // Callbacks
        this.onSelectionChange = null;
        this.onElementsChange = null;
        this.onHoverChange = null;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.attachEventListeners();
        this.preloadIcons();
        this.render();
    }

    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        this.ctx.resetTransform?.();
        this.render();
    }

    preloadIcons() {
        Object.keys(ASSET_DEFINITIONS).forEach(type => {
            const def = ASSET_DEFINITIONS[type];
            if (def.svg) {
                const img = new Image();
                const svgBlob = new Blob([def.svg], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                img.src = url;
                img.onload = () => {
                    this.iconCache.set(type, img);
                    this.render();
                };
            }
        });
    }

    // --- TRANSFORMACJE WSPÓŁRZĘDNYCH ---
    screenToWorld(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (screenX - rect.left - this.panX) / this.scale;
        const y = (screenY - rect.top - this.panY) / this.scale;
        return { x, y };
    }

    worldToScreen(worldX, worldY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: rect.left + this.panX + worldX * this.scale,
            y: rect.top + this.panY + worldY * this.scale
        };
    }

    snap(val) {
        if (!this.snapToGrid) return Math.round(val);
        return Math.round(val / this.gridSize) * this.gridSize;
    }

    // --- ZAPIS HISTORII (UNDO/REDO) ---
    saveState() {
        const state = JSON.stringify({
            elements: this.elements,
            cables: this.cables
        });
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }
        this.redoStack = [];
        if (this.onElementsChange) this.onElementsChange();
    }

    undo() {
        if (this.undoStack.length === 0) return;
        const currentState = JSON.stringify({
            elements: this.elements,
            cables: this.cables
        });
        this.redoStack.push(currentState);
        const prevState = JSON.parse(this.undoStack.pop());
        this.elements = prevState.elements;
        this.cables = prevState.cables;
        this.selectedIds.clear();
        if (this.onSelectionChange) this.onSelectionChange();
        if (this.onElementsChange) this.onElementsChange();
        this.render();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const currentState = JSON.stringify({
            elements: this.elements,
            cables: this.cables
        });
        this.undoStack.push(currentState);
        const nextState = JSON.parse(this.redoStack.pop());
        this.elements = nextState.elements;
        this.cables = nextState.cables;
        this.selectedIds.clear();
        if (this.onSelectionChange) this.onSelectionChange();
        if (this.onElementsChange) this.onElementsChange();
        this.render();
    }

    // --- ZARZĄDZANIE ELEMENTAMI ---
    addElement(type, worldX, worldY, customProps = {}) {
        this.saveState();
        const def = ASSET_DEFINITIONS[type];
        if (!def) return null;

        const id = 'asset_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);
        const snappedX = this.snap(worldX - (def.width / 2));
        const snappedY = this.snap(worldY - (def.height / 2));

        const element = {
            id: id,
            type: type,
            x: snappedX,
            y: snappedY,
            width: def.width,
            height: def.height,
            rotation: 0,
            props: JSON.parse(JSON.stringify(def.defaultProps || {}))
        };

        // Nadpisanie właściwości jeśli przekazano
        Object.assign(element.props, customProps);

        // Numeracja/nazewnictwo
        if (def.isITAsset && !element.props.serialNumber) {
            const count = this.elements.filter(e => e.type === type).length + 1;
            element.props.serialNumber = `${type.toUpperCase().substring(0, 3)}-${String(count).padStart(2, '0')}`;
        }

        this.elements.push(element);
        this.selectElement(id, false);
        this.render();
        return element;
    }

    removeElement(id) {
        this.saveState();
        this.elements = this.elements.filter(e => e.id !== id);
        this.cables = this.cables.filter(c => c.fromId !== id && c.toId !== id);
        this.selectedIds.delete(id);
        if (this.onSelectionChange) this.onSelectionChange();
        this.render();
    }

    removeSelected() {
        if (this.selectedIds.size === 0) return;
        this.saveState();
        const idsToRemove = new Set(this.selectedIds);
        this.elements = this.elements.filter(e => !idsToRemove.has(e.id));
        this.cables = this.cables.filter(c => !idsToRemove.has(c.fromId) && !idsToRemove.has(c.toId));
        this.selectedIds.clear();
        if (this.onSelectionChange) this.onSelectionChange();
        this.render();
    }

    duplicateSelected() {
        if (this.selectedIds.size === 0) return;
        this.saveState();
        const newIds = [];
        const offset = 20;

        this.selectedIds.forEach(id => {
            const el = this.elements.find(e => e.id === id);
            if (el) {
                const newId = 'asset_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);
                const clone = JSON.parse(JSON.stringify(el));
                clone.id = newId;
                clone.x += offset;
                clone.y += offset;
                if (clone.props.serialNumber) {
                    clone.props.serialNumber += '-COPY';
                }
                this.elements.push(clone);
                newIds.push(newId);
            }
        });

        this.selectedIds.clear();
        newIds.forEach(id => this.selectedIds.add(id));
        if (this.onSelectionChange) this.onSelectionChange();
        this.render();
    }

    selectElement(id, multi = false) {
        if (!multi) {
            this.selectedIds.clear();
        }
        if (id) {
            if (multi && this.selectedIds.has(id)) {
                this.selectedIds.delete(id);
            } else {
                this.selectedIds.add(id);
            }
        }
        if (this.onSelectionChange) this.onSelectionChange();
        this.render();
    }

    getSelectedElements() {
        return this.elements.filter(e => this.selectedIds.has(e.id));
    }

    getFirstSelected() {
        const firstId = Array.from(this.selectedIds)[0];
        return this.elements.find(e => e.id === firstId) || null;
    }

    rotateSelected(deg = 45) {
        if (this.selectedIds.size === 0) return;
        this.saveState();
        this.selectedIds.forEach(id => {
            const el = this.elements.find(e => e.id === id);
            if (el) {
                el.rotation = (el.rotation + deg) % 360;
                if (el.rotation < 0) el.rotation += 360;
            }
        });
        if (this.onSelectionChange) this.onSelectionChange();
        this.render();
    }

    // --- POŁĄCZENIA KABLOWE ---
    addCable(fromId, toId, type = 'lan', label = '') {
        if (fromId === toId) return;
        // Sprawdź czy już istnieje
        const exists = this.cables.some(c => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId));
        if (exists) return;

        this.saveState();
        const cable = {
            id: 'cable_' + Date.now().toString(36),
            fromId: fromId,
            toId: toId,
            type: type,
            color: CABLE_TYPES[type]?.color || '#3b82f6',
            label: label
        };
        this.cables.push(cable);
        this.render();
    }

    removeCable(cableId) {
        this.saveState();
        this.cables = this.cables.filter(c => c.id !== cableId);
        this.render();
    }

    // --- HIT TESTING (Wyszukiwanie elementu pod kursorem) ---
    getElementAt(worldX, worldY) {
        // Sprawdzamy w odwrotnej kolejności (od góry do dołu warstw)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const el = this.elements[i];
            if (this.isPointInsideElement(worldX, worldY, el)) {
                return el;
            }
        }
        return null;
    }

    isPointInsideElement(px, py, el) {
        // Obróć punkt względem środka obiektu
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const angleRad = -(el.rotation || 0) * (Math.PI / 180);

        const dx = px - cx;
        const dy = py - cy;

        const rotatedX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad) + cx;
        const rotatedY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad) + cy;

        return (
            rotatedX >= el.x &&
            rotatedX <= el.x + el.width &&
            rotatedY >= el.y &&
            rotatedY <= el.y + el.height
        );
    }

    getRotateHandleAt(worldX, worldY, el) {
        if (!el || this.selectedIds.size !== 1) return false;
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const handleDist = (el.height / 2) + 24;
        const angleRad = (el.rotation || 0) * (Math.PI / 180);

        const handleX = cx + Math.sin(angleRad) * handleDist;
        const handleY = cy - Math.cos(angleRad) * handleDist;

        const dist = Math.hypot(worldX - handleX, worldY - handleY);
        return dist <= 12 / this.scale;
    }

    getResizeHandleAt(worldX, worldY, el) {
        const def = ASSET_DEFINITIONS[el.type];
        if (!def?.resizable || this.selectedIds.size !== 1) return null;

        const handles = [
            { id: 'se', x: el.x + el.width, y: el.y + el.height },
            { id: 'e', x: el.x + el.width, y: el.y + el.height / 2 },
            { id: 's', x: el.x + el.width / 2, y: el.y + el.height }
        ];

        for (const h of handles) {
            const dist = Math.hypot(worldX - h.x, worldY - h.y);
            if (dist <= 10 / this.scale) {
                return h.id;
            }
        }
        return null;
    }

    // --- ZDARZENIA MYSZY, DOTYKU I KLAWIATURY ---
    attachEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Obsługa dotyku (ekrany dotykowe / tablety)
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        window.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Drag & Drop z palety bocznej
        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => this.handleDrop(e));

        // Skróty klawiszowe
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        window.addEventListener('blur', () => this.handleWindowBlur());
    }

    handleMouseDown(e) {
        const { x: worldX, y: worldY } = this.screenToWorld(e.clientX, e.clientY);

        // Środkowy przycisk myszy lub Spacja + lewy -> PAN
        if (e.button === 1 || e.button === 2 || (e.button === 0 && this.isSpacePressed)) {
            this.isPanning = true;
            this.startPanX = e.clientX - this.panX;
            this.startPanY = e.clientY - this.panY;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        if (e.button !== 0) return;

        // Tryb łączenia kablem
        if (this.currentTool === 'cable') {
            const target = this.getElementAt(worldX, worldY);
            if (target) {
                if (!this.cableStartElementId) {
                    this.cableStartElementId = target.id;
                    this.selectElement(target.id);
                } else {
                    this.addCable(this.cableStartElementId, target.id, this.cableType);
                    this.cableStartElementId = null;
                }
            } else {
                this.cableStartElementId = null;
            }
            this.render();
            return;
        }

        // Sprawdź uchwyt obrotu dla wybranego elementu
        const singleSelected = this.getFirstSelected();
        if (singleSelected && this.getRotateHandleAt(worldX, worldY, singleSelected)) {
            this.isRotating = true;
            this.rotateCenter = {
                x: singleSelected.x + singleSelected.width / 2,
                y: singleSelected.y + singleSelected.height / 2
            };
            this.rotateStartAngle = Math.atan2(worldY - this.rotateCenter.y, worldX - this.rotateCenter.x);
            this.initialRotation = singleSelected.rotation || 0;
            this.hasActionMoved = false;
            this.preActionState = JSON.stringify({ elements: this.elements, cables: this.cables });
            return;
        }

        // Sprawdź uchwyt skalowania
        if (singleSelected) {
            const handle = this.getResizeHandleAt(worldX, worldY, singleSelected);
            if (handle) {
                this.isResizing = true;
                this.resizeHandle = handle;
                this.resizeInitialRect = {
                    x: singleSelected.x,
                    y: singleSelected.y,
                    width: singleSelected.width,
                    height: singleSelected.height,
                    startX: worldX,
                    startY: worldY
                };
                this.hasActionMoved = false;
                this.preActionState = JSON.stringify({ elements: this.elements, cables: this.cables });
                return;
            }
        }

        // Kliknięcie w element
        const clickedElement = this.getElementAt(worldX, worldY);

        if (clickedElement) {
            if (e.shiftKey) {
                this.selectElement(clickedElement.id, true);
            } else if (!this.selectedIds.has(clickedElement.id)) {
                this.selectElement(clickedElement.id, false);
            }

            // Rozpocznij przesuwanie
            this.isDragging = true;
            this.dragStartX = worldX;
            this.dragStartY = worldY;
            this.draggedElementPositions.clear();
            this.hasActionMoved = false;
            this.preActionState = JSON.stringify({ elements: this.elements, cables: this.cables });

            this.selectedIds.forEach(id => {
                const el = this.elements.find(e => e.id === id);
                if (el) {
                    this.draggedElementPositions.set(id, { x: el.x, y: el.y });
                }
            });
        } else {
            // Kliknięcie w puste tło
            if (!e.shiftKey) {
                this.selectedIds.clear();
                if (this.onSelectionChange) this.onSelectionChange();
            }

            // Rozpocznij zaznaczanie prostokątem
            this.isBoxSelecting = true;
            this.boxSelectStart = { x: worldX, y: worldY };
            this.boxSelectCurrent = { x: worldX, y: worldY };
        }

        this.render();
    }

    handleMouseMove(e) {
        if (this.isPanning) {
            this.panX = e.clientX - this.startPanX;
            this.panY = e.clientY - this.startPanY;
            this.render();
            return;
        }

        const { x: worldX, y: worldY } = this.screenToWorld(e.clientX, e.clientY);

        if (this.isRotating) {
            const currentAngle = Math.atan2(worldY - this.rotateCenter.y, worldX - this.rotateCenter.x);
            let angleDiff = (currentAngle - this.rotateStartAngle) * (180 / Math.PI);
            let newRotation = (this.initialRotation + angleDiff) % 360;
            if (newRotation < 0) newRotation += 360;

            // Przyciąganie do 15 stopni
            if (this.snapToGrid) {
                newRotation = Math.round(newRotation / 15) * 15;
            }

            const singleSelected = this.getFirstSelected();
            if (singleSelected) {
                if (singleSelected.rotation !== Math.round(newRotation)) {
                    singleSelected.rotation = Math.round(newRotation);
                    this.hasActionMoved = true;
                    if (this.onSelectionChange) this.onSelectionChange();
                }
            }
            this.render();
            return;
        }

        if (this.isResizing) {
            const singleSelected = this.getFirstSelected();
            if (singleSelected && this.resizeInitialRect) {
                const dx = worldX - this.resizeInitialRect.startX;
                const dy = worldY - this.resizeInitialRect.startY;

                let newW = this.resizeInitialRect.width;
                let newH = this.resizeInitialRect.height;

                if (this.resizeHandle.includes('e')) newW += dx;
                if (this.resizeHandle.includes('s')) newH += dy;

                const finalW = Math.max(20, this.snap(newW));
                const finalH = Math.max(14, this.snap(newH));

                if (singleSelected.width !== finalW || singleSelected.height !== finalH) {
                    singleSelected.width = finalW;
                    singleSelected.height = finalH;
                    this.hasActionMoved = true;
                }
                this.render();
            }
            return;
        }

        if (this.isDragging) {
            const dx = worldX - this.dragStartX;
            const dy = worldY - this.dragStartY;

            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                this.hasActionMoved = true;
            }

            this.selectedIds.forEach(id => {
                const initial = this.draggedElementPositions.get(id);
                const el = this.elements.find(e => e.id === id);
                if (initial && el) {
                    el.x = this.snap(initial.x + dx);
                    el.y = this.snap(initial.y + dy);
                }
            });
            this.render();
            return;
        }

        if (this.isBoxSelecting) {
            this.boxSelectCurrent = { x: worldX, y: worldY };

            // Zaznacz wszystkie elementy w ramce
            const minX = Math.min(this.boxSelectStart.x, this.boxSelectCurrent.x);
            const maxX = Math.max(this.boxSelectStart.x, this.boxSelectCurrent.x);
            const minY = Math.min(this.boxSelectStart.y, this.boxSelectCurrent.y);
            const maxY = Math.max(this.boxSelectStart.y, this.boxSelectCurrent.y);

            this.elements.forEach(el => {
                const inside = (
                    el.x >= minX &&
                    el.x + el.width <= maxX &&
                    el.y >= minY &&
                    el.y + el.height <= maxY
                );
                if (inside) {
                    this.selectedIds.add(el.id);
                }
            });

            if (this.onSelectionChange) this.onSelectionChange();
            this.render();
            return;
        }

        // Hover test dla kursora
        const hovered = this.getElementAt(worldX, worldY);
        const hoveredId = hovered ? hovered.id : null;
        if (this.hoveredId !== hoveredId) {
            this.hoveredId = hoveredId;
            if (this.onHoverChange) this.onHoverChange(hovered);
            this.render();
        }

        // Zmiana kursora
        if (this.isSpacePressed) {
            this.canvas.style.cursor = 'grab';
        } else {
            const singleSelected = this.getFirstSelected();
            if (singleSelected && this.getRotateHandleAt(worldX, worldY, singleSelected)) {
                this.canvas.style.cursor = 'grab';
            } else if (singleSelected && this.getResizeHandleAt(worldX, worldY, singleSelected)) {
                this.canvas.style.cursor = 'nwse-resize';
            } else if (hovered) {
                this.canvas.style.cursor = this.currentTool === 'cable' ? 'crosshair' : 'pointer';
            } else {
                this.canvas.style.cursor = this.currentTool === 'cable' ? 'crosshair' : 'default';
            }
        }
    }

    handleMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = this.isSpacePressed ? 'grab' : 'default';
        }

        if (this.isDragging) {
            this.isDragging = false;
            if (this.hasActionMoved && this.preActionState) {
                this.undoStack.push(this.preActionState);
                if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
                this.redoStack = [];
                if (this.onElementsChange) this.onElementsChange();
            }
            this.preActionState = null;
            this.hasActionMoved = false;
        }

        if (this.isRotating) {
            this.isRotating = false;
            if (this.hasActionMoved && this.preActionState) {
                this.undoStack.push(this.preActionState);
                if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
                this.redoStack = [];
                if (this.onElementsChange) this.onElementsChange();
            }
            this.preActionState = null;
            this.hasActionMoved = false;
        }

        if (this.isResizing) {
            this.isResizing = false;
            if (this.hasActionMoved && this.preActionState) {
                this.undoStack.push(this.preActionState);
                if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
                this.redoStack = [];
                if (this.onElementsChange) this.onElementsChange();
            }
            this.preActionState = null;
            this.hasActionMoved = false;
        }

        if (this.isBoxSelecting) {
            this.isBoxSelecting = false;
            this.render();
        }
    }

    // --- OBSŁUGA DOTYKU ---
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseDown({
                button: 0,
                clientX: touch.clientX,
                clientY: touch.clientY,
                shiftKey: false
            });
        } else if (e.touches.length === 2) {
            e.preventDefault();
            this.isPanning = true;
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            this.startPanX = midX - this.panX;
            this.startPanY = midY - this.panY;
        }
    }

    handleTouchMove(e) {
        if (e.touches.length === 1 && (this.isDragging || this.isPanning || this.isRotating || this.isResizing || this.isBoxSelecting)) {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        } else if (e.touches.length === 2 && this.isPanning) {
            e.preventDefault();
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            this.panX = midX - this.startPanX;
            this.panY = midY - this.startPanY;
            this.render();
        }
    }

    handleTouchEnd(e) {
        this.handleMouseUp(e);
    }

    handleWheel(e) {
        e.preventDefault();
        const zoomFactor = 1.1;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Zoom względem pozycji kursora
        const oldScale = this.scale;
        let newScale = e.deltaY < 0 ? oldScale * zoomFactor : oldScale / zoomFactor;
        newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));

        if (newScale !== oldScale) {
            this.panX = mouseX - (mouseX - this.panX) * (newScale / oldScale);
            this.panY = mouseY - (mouseY - this.panY) * (newScale / oldScale);
            this.scale = newScale;
            this.render();
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const assetType = e.dataTransfer.getData('application/asset-type');
        if (assetType) {
            const { x: worldX, y: worldY } = this.screenToWorld(e.clientX, e.clientY);
            this.addElement(assetType, worldX, worldY);
        }
    }

    handleKeyDown(e) {
        // Ignoruj gdy użytkownik pisze w polu tekstowym
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
            return;
        }

        // Spacja do przesuwania widoku
        if (e.code === 'Space') {
            e.preventDefault();
            if (!this.isSpacePressed) {
                this.isSpacePressed = true;
                if (!this.isPanning && !this.isDragging && !this.isRotating && !this.isResizing) {
                    this.canvas.style.cursor = 'grab';
                }
            }
            return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            this.removeSelected();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            this.undo();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            this.redo();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            this.duplicateSelected();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
            e.preventDefault();
            this.selectAll();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
            e.preventDefault();
            this.zoomIn();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
            e.preventDefault();
            this.zoomOut();
        } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
            e.preventDefault();
            this.resetView();
        } else if (e.key === 'r' || e.key === 'R') {
            this.rotateSelected(e.shiftKey ? -45 : 45);
        } else if (e.key === 'Escape') {
            this.selectedIds.clear();
            this.cableStartElementId = null;
            this.currentTool = 'select';
            if (this.onSelectionChange) this.onSelectionChange();
            this.render();
        } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const step = e.shiftKey ? this.gridSize * 2 : this.gridSize;
            let dx = 0, dy = 0;
            if (e.key === 'ArrowUp') dy = -step;
            if (e.key === 'ArrowDown') dy = step;
            if (e.key === 'ArrowLeft') dx = -step;
            if (e.key === 'ArrowRight') dx = step;

            this.saveState();
            this.selectedIds.forEach(id => {
                const el = this.elements.find(item => item.id === id);
                if (el) {
                    el.x += dx;
                    el.y += dy;
                }
            });
            this.render();
        }
    }

    handleKeyUp(e) {
        if (e.code === 'Space') {
            this.isSpacePressed = false;
            if (!this.isPanning && !this.isDragging && !this.isRotating && !this.isResizing) {
                this.canvas.style.cursor = this.currentTool === 'cable' ? 'crosshair' : 'default';
            }
        }
    }

    handleWindowBlur() {
        this.isSpacePressed = false;
    }

    selectAll() {
        this.selectedIds.clear();
        this.elements.forEach(el => this.selectedIds.add(el.id));
        if (this.onSelectionChange) this.onSelectionChange();
        this.render();
    }

    // --- CENTROWANIE I ZOOM ---
    zoomIn() {
        this.scale = Math.min(this.maxScale, this.scale * 1.25);
        this.render();
    }

    zoomOut() {
        this.scale = Math.max(this.minScale, this.scale / 1.25);
        this.render();
    }

    resetView() {
        this.scale = 1;
        this.panX = 100;
        this.panY = 60;
        this.render();
    }

    focusElement(id) {
        const el = this.elements.find(e => e.id === id);
        if (!el) return;

        const rect = this.canvas.getBoundingClientRect();
        this.selectElement(id, false);
        this.panX = (rect.width / 2) - (el.x + el.width / 2) * this.scale;
        this.panY = (rect.height / 2) - (el.y + el.height / 2) * this.scale;
        this.render();
    }

    // --- RENDEROWANIE GŁÓWNE ---
    render() {
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;
        const width = this.canvas.width / dpr;
        const height = this.canvas.height / dpr;

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        // 1. Tło siatki
        if (this.showGrid) {
            this.renderGrid(ctx, width, height);
        }

        // Zastosuj Pan i Zoom
        ctx.save();
        ctx.translate(this.panX, this.panY);
        ctx.scale(this.scale, this.scale);

        // 2. Warstwa stref (Zones)
        this.elements.filter(e => e.type === 'zone').forEach(el => this.renderZone(ctx, el));

        // 3. Warstwa mebli i ścian
        this.elements.filter(e => e.type !== 'zone' && !ASSET_DEFINITIONS[e.type]?.isITAsset).forEach(el => {
            this.renderElement(ctx, el);
        });

        // 4. Warstwa połączeń kablowych
        if (this.showCables) {
            this.renderCables(ctx);
        }

        // 5. Warstwa urządzeń IT (na wierzchu mebli)
        this.elements.filter(e => ASSET_DEFINITIONS[e.type]?.isITAsset).forEach(el => {
            this.renderElement(ctx, el);
        });

        // 6. Nakładka zaznaczeń i uchwytów
        this.renderSelectionOverlays(ctx);

        // 7. Zaznaczanie obszarem (Marquee)
        if (this.isBoxSelecting) {
            this.renderBoxSelection(ctx);
        }

        ctx.restore();
        ctx.restore();
    }

    renderGrid(ctx, width, height) {
        const step = this.gridSize * this.scale;
        const offsetX = this.panX % step;
        const offsetY = this.panY % step;

        ctx.save();
        ctx.strokeStyle = document.body.classList.contains('light-theme') ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        for (let x = offsetX; x < width; x += step) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = offsetY; y < height; y += step) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Główne linie siatki (co 5 jednostek)
        const majorStep = step * 5;
        const majorOffsetX = this.panX % majorStep;
        const majorOffsetY = this.panY % majorStep;

        ctx.strokeStyle = document.body.classList.contains('light-theme') ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        for (let x = majorOffsetX; x < width; x += majorStep) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = majorOffsetY; y < height; y += majorStep) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
        ctx.restore();
    }

    renderZone(ctx, el) {
        ctx.save();
        ctx.translate(el.x, el.y);

        ctx.fillStyle = el.props.fillColor || 'rgba(99, 102, 241, 0.08)';
        ctx.strokeStyle = el.props.borderColor || '#6366f1';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);

        ctx.beginPath();
        ctx.roundRect(0, 0, el.width, el.height, 8);
        ctx.fill();
        ctx.stroke();

        // Etykieta strefy
        if (el.props.label) {
            ctx.setLineDash([]);
            ctx.fillStyle = el.props.borderColor || '#6366f1';
            ctx.beginPath();
            ctx.roundRect(12, 10, Math.min(el.width - 24, 180), 22, 4);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(el.props.label, 20, 21);
        }

        ctx.restore();
    }

    renderElement(ctx, el) {
        ctx.save();
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;

        ctx.translate(cx, cy);
        if (el.rotation) {
            ctx.rotate(el.rotation * Math.PI / 180);
        }

        const isHovered = this.hoveredId === el.id;
        const isSelected = this.selectedIds.has(el.id);
        const def = ASSET_DEFINITIONS[el.type];

        // Rysowanie ikony SVG
        const img = this.iconCache.get(el.type);
        if (img && img.complete) {
            ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);
        } else {
            // Zastępczy prostokąt
            ctx.fillStyle = def?.color || '#3b82f6';
            ctx.fillRect(-el.width / 2, -el.height / 2, el.width, el.height);
        }

        // Wskaźnik statusu urządzenia IT (dioda/kropka)
        if (def?.isITAsset && el.props.status) {
            const statusInfo = DEVICE_STATUSES[el.props.status] || DEVICE_STATUSES.active;
            ctx.beginPath();
            ctx.arc(el.width / 2 - 4, -el.height / 2 + 4, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = statusInfo.color;
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();

        // Etykiety tekstowe (Nazwisko pracownika / IP / Model)
        if (this.showLabels && def?.isITAsset) {
            this.renderAssetLabels(ctx, el);
        }
    }

    renderAssetLabels(ctx, el) {
        const cx = el.x + el.width / 2;
        const labelY = el.y + el.height + 12;

        const mainText = el.props.employee || el.props.serialNumber || '';
        const subText = el.props.ipAddress || '';

        if (!mainText && !subText) return;

        ctx.save();
        ctx.font = '500 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (mainText) {
            const textWidth = ctx.measureText(mainText).width;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.beginPath();
            ctx.roundRect(cx - textWidth / 2 - 5, labelY - 7, textWidth + 10, 14, 3);
            ctx.fill();

            ctx.fillStyle = '#f8fafc';
            ctx.fillText(mainText, cx, labelY);
        }

        if (subText) {
            const ipY = labelY + 13;
            ctx.font = '400 9px monospace';
            const ipWidth = ctx.measureText(subText).width;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.beginPath();
            ctx.roundRect(cx - ipWidth / 2 - 4, ipY - 6, ipWidth + 8, 12, 2);
            ctx.fill();

            ctx.fillStyle = '#38bdf8';
            ctx.fillText(subText, cx, ipY);
        }

        ctx.restore();
    }

    renderCables(ctx) {
        this.cables.forEach(cable => {
            const from = this.elements.find(e => e.id === cable.fromId);
            const to = this.elements.find(e => e.id === cable.toId);
            if (!from || !to) return;

            const fromX = from.x + from.width / 2;
            const fromY = from.y + from.height / 2;
            const toX = to.x + to.width / 2;
            const toY = to.y + to.height / 2;

            ctx.save();
            ctx.strokeStyle = cable.color || '#3b82f6';
            ctx.lineWidth = 2;

            const cableDef = CABLE_TYPES[cable.type];
            if (cableDef?.dash?.length) {
                ctx.setLineDash(cableDef.dash);
            }

            // Płynna krzywa Beziera lub linia
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;
            const curveOffset = (midX - fromX) * 0.15;

            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.quadraticCurveTo(midX, midY + curveOffset, toX, toY);
            ctx.stroke();

            // Punkty końcowe
            ctx.fillStyle = cable.color || '#3b82f6';
            ctx.beginPath();
            ctx.arc(fromX, fromY, 3, 0, Math.PI * 2);
            ctx.arc(toX, toY, 3, 0, Math.PI * 2);
            ctx.fill();

            // Etykieta kabla (jeśli istnieje)
            if (cable.label) {
                ctx.font = '9px Inter, sans-serif';
                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                const tw = ctx.measureText(cable.label).width;
                ctx.fillRect(midX - tw / 2 - 3, midY - 6, tw + 6, 12);
                ctx.fillStyle = '#e2e8f0';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(cable.label, midX, midY);
            }

            ctx.restore();
        });
    }

    renderSelectionOverlays(ctx) {
        this.selectedIds.forEach(id => {
            const el = this.elements.find(e => e.id === id);
            if (!el) return;

            ctx.save();
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height / 2;
            ctx.translate(cx, cy);
            if (el.rotation) {
                ctx.rotate(el.rotation * Math.PI / 180);
            }

            // Obwódka zaznaczenia
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(-el.width / 2 - 4, -el.height / 2 - 4, el.width + 8, el.height + 8);
            ctx.setLineDash([]);

            // Uchwyt obrotu (tylko gdy zaznaczony jest 1 obiekt)
            if (this.selectedIds.size === 1) {
                const handleY = -el.height / 2 - 24;

                ctx.strokeStyle = '#38bdf8';
                ctx.beginPath();
                ctx.moveTo(0, -el.height / 2 - 4);
                ctx.lineTo(0, handleY);
                ctx.stroke();

                ctx.fillStyle = '#0284c7';
                ctx.beginPath();
                ctx.arc(0, handleY, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Uchwyty skalowania (dla ścian, stref itp.)
                const def = ASSET_DEFINITIONS[el.type];
                if (def?.resizable) {
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(el.width / 2, el.height / 2, 6, 6);
                }
            }

            ctx.restore();
        });
    }

    renderBoxSelection(ctx) {
        const x = Math.min(this.boxSelectStart.x, this.boxSelectCurrent.x);
        const y = Math.min(this.boxSelectStart.y, this.boxSelectCurrent.y);
        const w = Math.abs(this.boxSelectStart.x - this.boxSelectCurrent.x);
        const h = Math.abs(this.boxSelectStart.y - this.boxSelectCurrent.y);

        ctx.save();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
    }
}
