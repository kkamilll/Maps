/**
 * STORAGE.JS
 * Obsługa zapisu LocalStorage, importu/eksportu JSON, eksportu PNG oraz eksportu inwentarza do CSV.
 */

const STORAGE_KEY = 'office_it_maps_state_v1';
const ROOMS_KEY = 'office_it_rooms_list_v1';

class StorageManager {
    constructor(canvasInstance) {
        this.canvas = canvasInstance;
        this.currentRoomId = 'room_default';
        this.apiBase = window.location.protocol.startsWith('http') ? '' : 'http://localhost:3000';
        this.serverAvailable = null;
        this.saveTimeout = null;
        this.rooms = this.loadRoomsList();
        this.initServerSync();
    }

    setSaveBadge(status, customText) {
        const badge = document.getElementById('header-save-badge');
        if (!badge) return;
        if (status === 'saving') {
            badge.textContent = '⏳ Zapisywanie...';
            badge.style.background = 'rgba(234, 179, 8, 0.15)';
            badge.style.color = '#eab308';
            badge.style.borderColor = 'rgba(234, 179, 8, 0.3)';
        } else if (status === 'saved_db') {
            badge.textContent = customText || '🟢 Zapisano w bazie';
            badge.style.background = 'rgba(16, 185, 129, 0.15)';
            badge.style.color = '#10b981';
            badge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        } else {
            badge.textContent = customText || '💾 Zapisano lokalnie';
            badge.style.background = 'rgba(59, 130, 246, 0.15)';
            badge.style.color = '#3b82f6';
            badge.style.borderColor = 'rgba(59, 130, 246, 0.3)';
        }
    }

    async initServerSync() {
        try {
            const res = await fetch(`${this.apiBase}/api/status`);
            if (res.ok) {
                const info = await res.json();
                this.serverAvailable = true;
                const dbLabel = info.storageType === 'mongodb' ? 'MongoDB' : 'Baza danych';
                this.setSaveBadge('saved_db', `🟢 Połączono (${dbLabel})`);

                // Synchronizacja listy pokoi
                const rRes = await fetch(`${this.apiBase}/api/rooms`);
                if (rRes.ok) {
                    const serverRooms = await rRes.json();
                    if (Array.isArray(serverRooms) && serverRooms.length > 0) {
                        this.rooms = serverRooms;
                        this.saveRoomsListLocally();
                        if (typeof window.refreshRoomOptions === 'function') {
                            window.refreshRoomOptions();
                        }
                    }
                }

                // Pobranie stanu aktualnego pokoju z bazy serwera
                const stateRes = await fetch(`${this.apiBase}/api/room/${this.currentRoomId}`);
                if (stateRes.ok) {
                    const data = await stateRes.json();
                    if (data && Array.isArray(data.elements)) {
                        this.canvas.elements = data.elements;
                        this.canvas.cables = data.cables || [];
                        if (data.panX !== undefined) this.canvas.panX = data.panX;
                        if (data.panY !== undefined) this.canvas.panY = data.panY;
                        if (data.scale !== undefined) this.canvas.scale = data.scale;
                        this.canvas.render();
                        this.saveLocally(data);
                        if (this.canvas.onElementsChange) this.canvas.onElementsChange();
                    }
                }
            } else {
                this.serverAvailable = false;
                this.setSaveBadge('local');
            }
        } catch (e) {
            this.serverAvailable = false;
            this.setSaveBadge('local');
        }
    }

    loadRoomsList() {
        try {
            const saved = localStorage.getItem(ROOMS_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Błąd odczytu listy pomieszczeń:', e);
        }
        return [
            { id: 'room_default', name: 'Główne Biuro IT (Floor 1)' }
        ];
    }

    saveRoomsListLocally() {
        try {
            localStorage.setItem(ROOMS_KEY, JSON.stringify(this.rooms));
        } catch (e) {
            console.error('Błąd zapisu listy pomieszczeń:', e);
        }
    }

    saveRoomsList() {
        this.saveRoomsListLocally();
        if (this.serverAvailable !== false) {
            fetch(`${this.apiBase}/api/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.rooms)
            }).catch(() => {});
        }
    }

    saveLocally(data) {
        try {
            localStorage.setItem(`${STORAGE_KEY}_${this.currentRoomId}`, JSON.stringify(data));
        } catch (e) {
            console.error('Błąd autozapisu localStorage:', e);
        }
    }

    autoSave() {
        const data = {
            currentRoomId: this.currentRoomId,
            elements: this.canvas.elements,
            cables: this.canvas.cables,
            panX: this.canvas.panX,
            panY: this.canvas.panY,
            scale: this.canvas.scale,
            updatedAt: new Date().toISOString()
        };

        this.saveLocally(data);
        this.setSaveBadge('saving');

        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(async () => {
            if (this.serverAvailable !== false) {
                try {
                    const res = await fetch(`${this.apiBase}/api/room/${this.currentRoomId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    if (res.ok) {
                        this.serverAvailable = true;
                        this.setSaveBadge('saved_db', '🟢 Zapisano w bazie');
                        return;
                    }
                } catch (e) {
                    this.serverAvailable = false;
                }
            }
            this.setSaveBadge('local', '💾 Zapisano lokalnie');
        }, 300);
    }

    loadCurrentRoom() {
        try {
            const saved = localStorage.getItem(`${STORAGE_KEY}_${this.currentRoomId}`);
            if (saved) {
                const data = JSON.parse(saved);
                this.canvas.elements = data.elements || [];
                this.canvas.cables = data.cables || [];
                this.canvas.panX = data.panX ?? 100;
                this.canvas.panY = data.panY ?? 60;
                this.canvas.scale = data.scale ?? 1;
                this.canvas.render();
                return true;
            }
        } catch (e) {
            console.error('Błąd odczytu stanu:', e);
        }
        return false;
    }

    loadDemoTemplate() {
        this.canvas.elements = JSON.parse(JSON.stringify(DEMO_OFFICE_TEMPLATE.elements));
        this.canvas.cables = JSON.parse(JSON.stringify(DEMO_OFFICE_TEMPLATE.cables));
        this.canvas.resetView();
        this.autoSave();
    }

    // --- EKSPORT I IMPORT JSON ---
    exportToJSON() {
        const roomName = this.rooms.find(r => r.id === this.currentRoomId)?.name || 'Biuro';
        const projectData = {
            version: '1.0',
            roomName: roomName,
            exportedAt: new Date().toISOString(),
            elements: this.canvas.elements,
            cables: this.canvas.cables
        };

        const jsonStr = JSON.stringify(projectData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `office-it-map-${roomName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (Array.isArray(data.elements)) {
                        this.canvas.saveState();
                        this.canvas.elements = data.elements;
                        this.canvas.cables = data.cables || [];
                        this.canvas.selectedIds.clear();
                        this.canvas.render();
                        this.autoSave();
                        resolve(data);
                    } else {
                        reject(new Error('Nieprawidłowy format pliku JSON.'));
                    }
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    }

    // --- EKSPORT DO WYSOKIEJ JAKOŚCI OBRAZU PNG ---
    exportToPNG() {
        if (this.canvas.elements.length === 0) {
            alert('Brak elementów na mapie do wyeksportowania.');
            return;
        }

        // Oblicz granice wszystkich elementów
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.canvas.elements.forEach(el => {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
        });

        // Dodaj margines
        const padding = 60;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const width = Math.max(800, maxX - minX);
        const height = Math.max(600, maxY - minY);

        // Tworzymy tymczasowy canvas wysokiej rozdzielczości
        const offCanvas = document.createElement('canvas');
        const dpr = 2; // Jakość Retina/HiDPI
        offCanvas.width = width * dpr;
        offCanvas.height = (height + 70) * dpr; // +70px na nagłówek i stopkę
        const ctx = offCanvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // Tło
        const isLight = document.body.classList.contains('light-theme');
        ctx.fillStyle = isLight ? '#f8fafc' : '#0b0f19';
        ctx.fillRect(0, 0, width, height + 70);

        // Nagłówek
        const roomName = this.rooms.find(r => r.id === this.currentRoomId)?.name || 'Plan Biura IT';
        ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.fillText(roomName, 30, 36);

        ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(`Wygenerowano: ${new Date().toLocaleString('pl-PL')} | Sprzęt IT: ${this.canvas.elements.filter(e => ASSET_DEFINITIONS[e.type]?.isITAsset).length} szt.`, 30, 56);

        // Rysuj obiekty
        ctx.save();
        ctx.translate(-minX, -minY + 70);

        // Strefy
        this.canvas.elements.filter(e => e.type === 'zone').forEach(el => this.canvas.renderZone(ctx, el));

        // Meble i ściany
        this.canvas.elements.filter(e => e.type !== 'zone' && !ASSET_DEFINITIONS[e.type]?.isITAsset).forEach(el => {
            this.canvas.renderElement(ctx, el);
        });

        // Kable
        this.canvas.renderCables(ctx);

        // Sprzęt IT
        this.canvas.elements.filter(e => ASSET_DEFINITIONS[e.type]?.isITAsset).forEach(el => {
            this.canvas.renderElement(ctx, el);
        });

        ctx.restore();

        // Pobierz plik PNG
        const link = document.createElement('a');
        link.download = `plan-biura-it-${Date.now()}.png`;
        link.href = offCanvas.toDataURL('image/png');
        link.click();
    }

    // --- EKSPORT SPISU SPRZĘTU DO CSV (EXCEL) ---
    exportToCSV() {
        const itAssets = this.canvas.elements.filter(e => ASSET_DEFINITIONS[e.type]?.isITAsset);
        if (itAssets.length === 0) {
            alert('Brak sprzętu komputerowego na mapie do wyeksportowania.');
            return;
        }

        const headers = [
            'ID Elementu',
            'Typ Urządzenia',
            'Przypisany Pracownik / Stanowisko',
            'Dział / Pokój',
            'Model i Specyfikacja',
            'Numer Seryjny / Kod Inwentarzowy',
            'Adres IP',
            'Adres MAC',
            'Port Switcha / Gniazdo',
            'Status',
            'Pozycja X',
            'Pozycja Y'
        ];

        const rows = itAssets.map(el => {
            const def = ASSET_DEFINITIONS[el.type];
            const p = el.props || {};
            const statusName = DEVICE_STATUSES[p.status]?.name || p.status || 'Aktywny';

            const modelSpec = `${p.model || ''}${p.cpuRam ? ' (' + p.cpuRam + ')' : ''}`;

            return [
                `"${el.id}"`,
                `"${def?.name || el.type}"`,
                `"${(p.employee || '').replace(/"/g, '""')}"`,
                `"${(p.department || '').replace(/"/g, '""')}"`,
                `"${modelSpec.replace(/"/g, '""')}"`,
                `"${(p.serialNumber || '').replace(/"/g, '""')}"`,
                `"${p.ipAddress || ''}"`,
                `"${p.macAddress || ''}"`,
                `"${p.switchPort || ''}"`,
                `"${statusName}"`,
                el.x,
                el.y
            ].join(';');
        });

        // UTF-8 BOM dla poprawnego otwierania w polskim MS Excel
        const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ewidencja-sprzetu-it-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
