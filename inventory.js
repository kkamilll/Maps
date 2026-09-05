/**
 * INVENTORY.JS
 * Obsługa ewidencji sprzętu, wyszukiwarki na żywo oraz modala tabeli inwentaryzacyjnej.
 */

class InventoryManager {
    constructor(canvasInstance, storageInstance) {
        this.canvas = canvasInstance;
        this.storage = storageInstance;
        this.modal = document.getElementById('inventory-modal');
        this.tableBody = document.getElementById('inventory-table-body');
        this.searchInput = document.getElementById('inventory-search');
        this.filterType = document.getElementById('inventory-filter-type');
        this.filterStatus = document.getElementById('inventory-filter-status');
        this.quickSearchInput = document.getElementById('header-quick-search');
        this.searchResultsDropdown = document.getElementById('search-results-dropdown');

        this.init();
    }

    init() {
        // Szybkie wyszukiwanie w nagłówku
        if (this.quickSearchInput) {
            this.quickSearchInput.addEventListener('input', (e) => this.handleQuickSearch(e.target.value));
            this.quickSearchInput.addEventListener('focus', (e) => this.handleQuickSearch(e.target.value));
            this.quickSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.searchResultsDropdown.classList.add('hidden');
                } else if (e.key === 'Enter') {
                    const firstResult = this.searchResultsDropdown.querySelector('.search-result-item');
                    if (firstResult) firstResult.click();
                }
            });
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#search-container')) {
                    this.searchResultsDropdown.classList.add('hidden');
                }
            });
        }

        // Filtry w modalu
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.renderInventoryTable());
        }
        if (this.filterType) {
            this.filterType.addEventListener('change', () => this.renderInventoryTable());
        }
        if (this.filterStatus) {
            this.filterStatus.addEventListener('change', () => this.renderInventoryTable());
        }

        // Przyciski modala
        document.getElementById('btn-open-inventory')?.addEventListener('click', () => this.openModal());
        document.getElementById('btn-close-inventory')?.addEventListener('click', () => this.closeModal());
        document.getElementById('btn-export-csv-modal')?.addEventListener('click', () => this.storage.exportToCSV());

        // Zamknięcie modala kliknięciem w tło lub klawiszem Escape
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        }
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    handleQuickSearch(query) {
        const q = query.trim().toLowerCase();
        if (!q) {
            this.searchResultsDropdown.classList.add('hidden');
            return;
        }

        const itAssets = this.canvas.elements.filter(e => ASSET_DEFINITIONS[e.type]?.isITAsset);
        const matches = itAssets.filter(el => {
            const def = ASSET_DEFINITIONS[el.type];
            const p = el.props || {};
            return (
                (def?.name && def.name.toLowerCase().includes(q)) ||
                (p.employee && p.employee.toLowerCase().includes(q)) ||
                (p.department && p.department.toLowerCase().includes(q)) ||
                (p.serialNumber && p.serialNumber.toLowerCase().includes(q)) ||
                (p.ipAddress && p.ipAddress.toLowerCase().includes(q)) ||
                (p.model && p.model.toLowerCase().includes(q)) ||
                (p.macAddress && p.macAddress.toLowerCase().includes(q))
            );
        });

        this.renderSearchResults(matches);
    }

    renderSearchResults(results) {
        this.searchResultsDropdown.innerHTML = '';
        if (results.length === 0) {
            this.searchResultsDropdown.innerHTML = `<div class="search-empty">Nie znaleziono urządzeń pasujących do zapytania</div>`;
            this.searchResultsDropdown.classList.remove('hidden');
            return;
        }

        results.slice(0, 8).forEach(el => {
            const def = ASSET_DEFINITIONS[el.type];
            const p = el.props || {};
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <div class="result-icon">${def.svg ? def.svg : '💻'}</div>
                <div class="result-info">
                    <div class="result-title">${p.employee || def.name} <span class="result-badge">${p.serialNumber || ''}</span></div>
                    <div class="result-subtitle">${p.department || ''} &bull; ${p.ipAddress ? 'IP: ' + p.ipAddress : ''} &bull; ${p.model || ''}</div>
                </div>
            `;

            item.addEventListener('click', () => {
                this.canvas.focusElement(el.id);
                this.searchResultsDropdown.classList.add('hidden');
                this.quickSearchInput.value = '';
            });

            this.searchResultsDropdown.appendChild(item);
        });

        this.searchResultsDropdown.classList.remove('hidden');
    }

    openModal() {
        this.populateFilterDropdowns();
        this.renderInventoryTable();
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }

    populateFilterDropdowns() {
        if (!this.filterType) return;
        this.filterType.innerHTML = '<option value="all">Wszystkie typy urządzeń</option>';
        Object.keys(ASSET_DEFINITIONS).forEach(type => {
            const def = ASSET_DEFINITIONS[type];
            if (def.isITAsset) {
                const opt = document.createElement('option');
                opt.value = type;
                opt.textContent = def.name;
                this.filterType.appendChild(opt);
            }
        });
    }

    renderInventoryTable() {
        if (!this.tableBody) return;
        const q = (this.searchInput?.value || '').trim().toLowerCase();
        const typeFilter = this.filterType?.value || 'all';
        const statusFilter = this.filterStatus?.value || 'all';

        const itAssets = this.canvas.elements.filter(e => ASSET_DEFINITIONS[e.type]?.isITAsset);

        const filtered = itAssets.filter(el => {
            const def = ASSET_DEFINITIONS[el.type];
            const p = el.props || {};

            if (typeFilter !== 'all' && el.type !== typeFilter) return false;
            if (statusFilter !== 'all' && (p.status || 'active') !== statusFilter) return false;

            if (q) {
                const match = (
                    (def?.name && def.name.toLowerCase().includes(q)) ||
                    (p.employee && p.employee.toLowerCase().includes(q)) ||
                    (p.department && p.department.toLowerCase().includes(q)) ||
                    (p.serialNumber && p.serialNumber.toLowerCase().includes(q)) ||
                    (p.ipAddress && p.ipAddress.toLowerCase().includes(q)) ||
                    (p.model && p.model.toLowerCase().includes(q))
                );
                if (!match) return false;
            }
            return true;
        });

        // Licznik
        document.getElementById('inventory-count').textContent = `${filtered.length} z ${itAssets.length} urządzeń`;

        this.tableBody.innerHTML = '';
        if (filtered.length === 0) {
            this.tableBody.innerHTML = `<tr><td colspan="8" class="table-empty">Brak wyników spełniających kryteria.</td></tr>`;
            return;
        }

        filtered.forEach(el => {
            const def = ASSET_DEFINITIONS[el.type];
            const p = el.props || {};
            const statusInfo = DEVICE_STATUSES[p.status] || DEVICE_STATUSES.active;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="table-device-cell">
                        <span class="table-dev-icon">${def.svg}</span>
                        <div>
                            <strong>${def.name}</strong>
                            <div class="text-muted small">${p.model || '-'}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <strong>${p.employee || '<span class="text-muted">Nieprzypisany</span>'}</strong>
                    <div class="text-muted small">${p.department || '-'}</div>
                </td>
                <td><code>${p.serialNumber || '-'}</code></td>
                <td><code class="text-cyan">${p.ipAddress || '-'}</code></td>
                <td><span class="text-muted small">${p.macAddress || '-'}</span></td>
                <td><span class="badge-tag">${p.switchPort || '-'}</span></td>
                <td>
                    <span class="status-pill" style="color: ${statusInfo.color}; background: ${statusInfo.bg}">
                        <span class="status-dot" style="background: ${statusInfo.color}"></span>
                        ${statusInfo.name}
                    </span>
                </td>
                <td class="table-actions">
                    <button class="btn-icon-small btn-focus" title="Pokaż na rzucie biura">🎯</button>
                    <button class="btn-icon-small btn-del" title="Usuń z mapy">🗑️</button>
                </td>
            `;

            tr.querySelector('.btn-focus').addEventListener('click', () => {
                this.closeModal();
                this.canvas.focusElement(el.id);
            });

            tr.querySelector('.btn-del').addEventListener('click', () => {
                if (confirm(`Czy na pewno usunąć "${p.employee || def.name}"?`)) {
                    this.canvas.removeElement(el.id);
                    this.renderInventoryTable();
                }
            });

            this.tableBody.appendChild(tr);
        });
    }
}
