/**
 * ASSETS-DATA.JS
 * Definicje urządzeń IT, mebli, elementów konstrukcyjnych, ikon SVG oraz szablonów.
 */

const ASSET_CATEGORIES = {
    it_workstation: { id: 'it_workstation', name: 'Stanowiska & Komputery', icon: '💻' },
    it_network: { id: 'it_network', name: 'Sieć & Serwerownia', icon: '🖧' },
    it_peripherals: { id: 'it_peripherals', name: 'Urządzenia Peryferyjne', icon: '🖨️' },
    furniture: { id: 'furniture', name: 'Meble Biurowe', icon: '🪑' },
    infrastructure: { id: 'infrastructure', name: 'Ściany & Architektura', icon: '🧱' },
    zones: { id: 'zones', name: 'Strefy & Działy', icon: '🏷️' }
};

const DEVICE_STATUSES = {
    active: { id: 'active', name: 'Aktywny', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    repair: { id: 'repair', name: 'W naprawie', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    spare: { id: 'spare', name: 'Zapasowy / Magazyn', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    decommissioned: { id: 'decommissioned', name: 'Wycofany', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' }
};

const CABLE_TYPES = {
    lan: { id: 'lan', name: 'Ethernet RJ45 (LAN)', color: '#3b82f6', dash: [] },
    fiber: { id: 'fiber', name: 'Światłowód (Fiber)', color: '#ec4899', dash: [4, 4] },
    power: { id: 'power', name: 'Zasilanie (230V)', color: '#ef4444', dash: [] },
    hdmi: { id: 'hdmi', name: 'Wideo (HDMI/DP)', color: '#8b5cf6', dash: [2, 2] }
};

const ASSET_DEFINITIONS = {
    // --- STANOWISKA IT ---
    pc_workstation: {
        type: 'pc_workstation',
        category: 'it_workstation',
        name: 'Komputer Stacjonarny (PC)',
        width: 48,
        height: 48,
        color: '#3b82f6',
        isITAsset: true,
        defaultProps: {
            employee: '',
            department: 'IT / Dev',
            model: 'Dell OptiPlex 7090 MT',
            cpuRam: 'i7-11700 / 32GB RAM / 1TB SSD',
            serialNumber: 'SN-PC-00',
            ipAddress: '192.168.1.10',
            macAddress: '00:1A:2B:3C:4D:5E',
            switchPort: 'SW1-P01',
            status: 'active'
        },
        svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="6" width="40" height="26" rx="3" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
            <rect x="7" y="9" width="34" height="20" rx="1.5" fill="#0f172a"/>
            <path d="M12 15h12M12 19h8" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="35" cy="19" r="3" fill="#3b82f6"/>
            <rect x="20" y="32" width="8" height="6" fill="#334155"/>
            <path d="M14 38h20" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>
            <rect x="36" y="24" width="8" height="16" rx="1.5" fill="#0f172a" stroke="#60a5fa" stroke-width="1.5"/>
            <circle cx="40" cy="27" r="1" fill="#10b981"/>
            <line x1="38" y1="31" x2="42" y2="31" stroke="#475569" stroke-width="1"/>
            <line x1="38" y1="34" x2="42" y2="34" stroke="#475569" stroke-width="1"/>
        </svg>`
    },

    laptop: {
        type: 'laptop',
        category: 'it_workstation',
        name: 'Laptop / Stacja Dokująca',
        width: 44,
        height: 36,
        color: '#6366f1',
        isITAsset: true,
        defaultProps: {
            employee: '',
            department: 'Marketing / Sales',
            model: 'Lenovo ThinkPad T14 Gen 4',
            cpuRam: 'i5-1340P / 16GB / 512GB SSD',
            serialNumber: 'SN-LTP-00',
            ipAddress: '192.168.1.50',
            macAddress: 'AA:BB:CC:DD:EE:01',
            switchPort: 'Wi-Fi / Dock',
            status: 'active'
        },
        svg: `<svg viewBox="0 0 44 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="4" width="28" height="20" rx="2" fill="#1e293b" stroke="#6366f1" stroke-width="2"/>
            <rect x="11" y="7" width="22" height="14" rx="1" fill="#0f172a"/>
            <circle cx="22" cy="14" r="2.5" fill="#818cf8"/>
            <path d="M3 24h38a2 2 0 012 2v2a2 2 0 01-2 2H3a2 2 0 01-2-2v-2a2 2 0 012-2z" fill="#334155" stroke="#6366f1" stroke-width="1.5"/>
            <rect x="18" y="25" width="8" height="3" rx="0.5" fill="#0f172a"/>
        </svg>`
    },

    dual_monitor: {
        type: 'dual_monitor',
        category: 'it_workstation',
        name: 'Stanowisko Dual-Monitor',
        width: 64,
        height: 38,
        color: '#0ea5e9',
        isITAsset: true,
        defaultProps: {
            employee: '',
            department: 'Development',
            model: '2x Dell UltraSharp 27" 4K',
            cpuRam: 'Stacja dokująca USB-C + 2x 4K',
            serialNumber: 'SN-DSK-00',
            ipAddress: '',
            macAddress: '',
            switchPort: '',
            status: 'active'
        },
        svg: `<svg viewBox="0 0 64 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="rotate(-6 16 16)">
                <rect x="2" y="3" width="28" height="20" rx="2" fill="#0f172a" stroke="#0ea5e9" stroke-width="1.5"/>
                <rect x="4" y="5" width="24" height="16" fill="#1e293b"/>
                <path d="M7 10h10M7 14h6" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/>
            </g>
            <g transform="rotate(6 48 16)">
                <rect x="34" y="3" width="28" height="20" rx="2" fill="#0f172a" stroke="#0ea5e9" stroke-width="1.5"/>
                <rect x="36" y="5" width="24" height="16" fill="#1e293b"/>
                <circle cx="48" cy="13" r="3" fill="#0ea5e9"/>
            </g>
            <path d="M22 28h20M32 23v5" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },

    // --- SIEĆ & SERWEROWNIA ---
    server_rack: {
        type: 'server_rack',
        category: 'it_network',
        name: 'Szafa Rack 42U / Serwer',
        width: 52,
        height: 52,
        color: '#10b981',
        isITAsset: true,
        defaultProps: {
            employee: 'Administratorzy IT',
            department: 'Infrastruktura IT',
            model: 'Szafa RACK 42U + 3x Dell PowerEdge R650',
            cpuRam: '2x Xeon Gold 6330 / 256GB RAM / 12TB NVMe',
            serialNumber: 'RACK-SRV-01',
            ipAddress: '192.168.1.2',
            macAddress: 'BC:24:11:99:88:77',
            switchPort: 'Trunk-Core01',
            status: 'active'
        },
        svg: `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="46" height="46" rx="4" fill="#090d16" stroke="#10b981" stroke-width="2.5"/>
            <rect x="7" y="7" width="38" height="7" rx="1" fill="#1e293b" stroke="#334155"/>
            <circle cx="11" cy="10.5" r="1.5" fill="#10b981"/>
            <circle cx="15" cy="10.5" r="1.5" fill="#3b82f6"/>
            <line x1="20" y1="10.5" x2="40" y2="10.5" stroke="#475569" stroke-width="1.5" stroke-dasharray="2 2"/>
            
            <rect x="7" y="16" width="38" height="7" rx="1" fill="#1e293b" stroke="#334155"/>
            <circle cx="11" cy="19.5" r="1.5" fill="#10b981"/>
            <line x1="20" y1="19.5" x2="40" y2="19.5" stroke="#475569" stroke-width="1.5" stroke-dasharray="2 2"/>
            
            <rect x="7" y="25" width="38" height="7" rx="1" fill="#1e293b" stroke="#334155"/>
            <circle cx="11" cy="28.5" r="1.5" fill="#10b981"/>
            <line x1="20" y1="28.5" x2="40" y2="28.5" stroke="#475569" stroke-width="1.5" stroke-dasharray="2 2"/>
            
            <rect x="7" y="34" width="38" height="9" rx="1" fill="#1e293b" stroke="#334155"/>
            <circle cx="11" cy="38.5" r="1.5" fill="#f59e0b"/>
            <line x1="20" y1="38.5" x2="40" y2="38.5" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 3"/>
        </svg>`
    },

    network_switch: {
        type: 'network_switch',
        category: 'it_network',
        name: 'Switch Sieciowy / Router',
        width: 48,
        height: 28,
        color: '#06b6d4',
        isITAsset: true,
        defaultProps: {
            employee: 'Sieć / IT',
            department: 'Infrastruktura',
            model: 'Cisco Catalyst 2960X 48-Port PoE+',
            cpuRam: '48x 1Gbps + 4x 10G SFP+',
            serialNumber: 'SN-SW-48P-01',
            ipAddress: '192.168.1.254',
            macAddress: '00:0C:29:4F:8E:11',
            switchPort: 'Uplink 10Gbps',
            status: 'active'
        },
        svg: `<svg viewBox="0 0 48 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="44" height="20" rx="2" fill="#0f172a" stroke="#06b6d4" stroke-width="2"/>
            <circle cx="7" cy="10" r="1.5" fill="#10b981"/>
            <circle cx="7" cy="16" r="1.5" fill="#10b981"/>
            <line x1="12" y1="6" x2="12" y2="22" stroke="#334155" stroke-width="1"/>
            <rect x="15" y="8" width="4" height="4" fill="#38bdf8"/>
            <rect x="21" y="8" width="4" height="4" fill="#38bdf8"/>
            <rect x="27" y="8" width="4" height="4" fill="#38bdf8"/>
            <rect x="33" y="8" width="4" height="4" fill="#38bdf8"/>
            <rect x="39" y="8" width="5" height="4" fill="#f59e0b"/>
            
            <rect x="15" y="15" width="4" height="4" fill="#38bdf8"/>
            <rect x="21" y="15" width="4" height="4" fill="#38bdf8"/>
            <rect x="27" y="15" width="4" height="4" fill="#38bdf8"/>
            <rect x="33" y="15" width="4" height="4" fill="#38bdf8"/>
            <rect x="39" y="15" width="5" height="4" fill="#f59e0b"/>
        </svg>`
    },

    wifi_ap: {
        type: 'wifi_ap',
        category: 'it_network',
        name: 'Access Point Wi-Fi 6',
        width: 32,
        height: 32,
        color: '#14b8a6',
        isITAsset: true,
        defaultProps: {
            employee: 'Ogólnodostępny',
            department: 'Sieć Wi-Fi',
            model: 'Ubiquiti UniFi U6-Pro',
            cpuRam: 'Wi-Fi 6 (802.11ax), PoE 48V',
            serialNumber: 'SN-AP-U6-01',
            ipAddress: '192.168.1.15',
            macAddress: '74:83:C2:55:1A:99',
            switchPort: 'SW1-P48 (PoE)',
            status: 'active'
        },
        svg: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#0f172a" stroke="#14b8a6" stroke-width="2"/>
            <circle cx="16" cy="16" r="4" fill="#14b8a6"/>
            <path d="M10 11a8 8 0 0112 0" stroke="#2dd4bf" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M6 7a14 14 0 0120 0" stroke="#2dd4bf" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="16" cy="16" r="1.5" fill="#ffffff"/>
        </svg>`
    },

    lan_wall_socket: {
        type: 'lan_wall_socket',
        category: 'it_network',
        name: 'Gniazdo Sieciowe LAN / 230V',
        width: 26,
        height: 26,
        color: '#38bdf8',
        isITAsset: false,
        defaultProps: {
            label: 'Gniazdo G-01',
            patchPort: 'PatchPanel-A12',
            switchPort: 'SW1-P12'
        },
        svg: `<svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="22" height="22" rx="3" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
            <rect x="5" y="6" width="6" height="6" rx="1" fill="#38bdf8"/>
            <rect x="15" y="6" width="6" height="6" rx="1" fill="#38bdf8"/>
            <circle cx="8" cy="18" r="2" fill="#ef4444"/>
            <circle cx="18" cy="18" r="2" fill="#ef4444"/>
        </svg>`
    },

    // --- PERYFERIA ---
    printer: {
        type: 'printer',
        category: 'it_peripherals',
        name: 'Drukarka Sieciowa / Ksero',
        width: 44,
        height: 44,
        color: '#f59e0b',
        isITAsset: true,
        defaultProps: {
            employee: 'Wszyscy pracownicy',
            department: 'Biuro / Administracja',
            model: 'HP LaserJet Enterprise MFP M528',
            cpuRam: 'Laser Mono / LAN / Duplex',
            serialNumber: 'SN-PRN-01',
            ipAddress: '192.168.1.100',
            macAddress: '10:65:30:E1:92:44',
            switchPort: 'SW1-P24',
            status: 'active'
        },
        svg: `<svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="14" width="32" height="20" rx="3" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
            <path d="M12 14V6a2 2 0 012-2h16a2 2 0 012 2v8" fill="#334155" stroke="#f59e0b" stroke-width="1.5"/>
            <path d="M12 28h20v8a2 2 0 01-2 2H14a2 2 0 01-2-2v-8z" fill="#0f172a" stroke="#fbbf24" stroke-width="1.5"/>
            <line x1="16" y1="32" x2="28" y2="32" stroke="#e2e8f0" stroke-width="1.5"/>
            <circle cx="32" cy="19" r="1.5" fill="#10b981"/>
            <rect x="10" y="18" width="16" height="3" rx="1" fill="#475569"/>
        </svg>`
    },

    voip_phone: {
        type: 'voip_phone',
        category: 'it_peripherals',
        name: 'Telefon VoIP / SIP',
        width: 28,
        height: 28,
        color: '#a855f7',
        isITAsset: true,
        defaultProps: {
            employee: '',
            department: 'Obsługa Klienta',
            model: 'Yealink SIP-T46U',
            cpuRam: 'PoE, Kolorowy LCD 4.3"',
            serialNumber: 'SN-VOIP-01',
            ipAddress: '192.168.1.80',
            macAddress: '80:5E:C0:11:22:33',
            switchPort: 'SW1-P18',
            status: 'active'
        },
        svg: `<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="22" height="22" rx="3" fill="#0f172a" stroke="#a855f7" stroke-width="2"/>
            <rect x="6" y="5" width="8" height="18" rx="2" fill="#334155"/>
            <rect x="16" y="5" width="7" height="6" rx="1" fill="#818cf8"/>
            <circle cx="17" cy="14" r="1" fill="#cbd5e1"/>
            <circle cx="21" cy="14" r="1" fill="#cbd5e1"/>
            <circle cx="17" cy="18" r="1" fill="#cbd5e1"/>
            <circle cx="21" cy="18" r="1" fill="#cbd5e1"/>
        </svg>`
    },

    ups_battery: {
        type: 'ups_battery',
        category: 'it_peripherals',
        name: 'Zasilacz Awaryjny UPS',
        width: 26,
        height: 34,
        color: '#eab308',
        isITAsset: true,
        defaultProps: {
            employee: 'Zasilanie stanowiska/szafy',
            department: 'Infrastruktura',
            model: 'APC Smart-UPS 1500VA LCD',
            cpuRam: '1000W / AVR / 8x IEC C13',
            serialNumber: 'SN-UPS-01',
            ipAddress: '192.168.1.190',
            macAddress: '',
            switchPort: '',
            status: 'active'
        },
        svg: `<svg viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="22" height="30" rx="3" fill="#0f172a" stroke="#eab308" stroke-width="2"/>
            <rect x="5" y="5" width="16" height="8" rx="1" fill="#1e293b"/>
            <path d="M14 6l-3 4h3l-2 3" stroke="#eab308" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="7" cy="18" r="1.5" fill="#10b981"/>
            <circle cx="7" cy="23" r="1.5" fill="#eab308"/>
            <line x1="13" y1="18" x2="20" y2="18" stroke="#475569" stroke-width="2"/>
            <line x1="13" y1="23" x2="20" y2="23" stroke="#475569" stroke-width="2"/>
        </svg>`
    },

    // --- MEBLE BIUROWE ---
    desk_single: {
        type: 'desk_single',
        category: 'furniture',
        name: 'Biurko Pojedyncze (140x70)',
        width: 100,
        height: 60,
        color: '#64748b',
        isITAsset: false,
        defaultProps: {
            label: 'Biurko 1',
            assignedTo: ''
        },
        svg: `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="96" height="56" rx="4" fill="#1e293b" stroke="#475569" stroke-width="2"/>
            <rect x="6" y="6" width="88" height="48" rx="2" fill="#0f172a" stroke="#334155" stroke-width="1" stroke-dasharray="3 3"/>
            <circle cx="85" cy="15" r="4" fill="#334155" stroke="#64748b"/>
        </svg>`
    },

    desk_bench_double: {
        type: 'desk_bench_double',
        category: 'furniture',
        name: 'Biurko Podwójne Bench (2x)',
        width: 110,
        height: 120,
        color: '#64748b',
        isITAsset: false,
        defaultProps: {
            label: 'Wyspa Bench'
        },
        svg: `<svg viewBox="0 0 110 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="106" height="116" rx="4" fill="#1e293b" stroke="#475569" stroke-width="2"/>
            <line x1="2" y1="60" x2="108" y2="60" stroke="#0ea5e9" stroke-width="4"/>
            <circle cx="95" cy="15" r="4" fill="#334155" stroke="#64748b"/>
            <circle cx="95" cy="105" r="4" fill="#334155" stroke="#64748b"/>
        </svg>`
    },

    conf_table: {
        type: 'conf_table',
        category: 'furniture',
        name: 'Stół Konferencyjny',
        width: 160,
        height: 90,
        color: '#64748b',
        isITAsset: false,
        defaultProps: {
            label: 'Stół Konferencyjny'
        },
        svg: `<svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="154" height="84" rx="20" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
            <rect x="65" y="33" width="30" height="24" rx="3" fill="#0f172a" stroke="#0284c7" stroke-width="1.5"/>
            <circle cx="73" cy="45" r="2.5" fill="#ef4444"/>
            <circle cx="80" cy="45" r="2.5" fill="#38bdf8"/>
            <circle cx="87" cy="45" r="2.5" fill="#a855f7"/>
        </svg>`
    },

    office_chair: {
        type: 'office_chair',
        category: 'furniture',
        name: 'Fotel Biurowy',
        width: 32,
        height: 32,
        color: '#475569',
        isITAsset: false,
        defaultProps: {},
        svg: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="11" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
            <path d="M7 16a9 9 0 0118 0" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M4 14v4M28 14v4" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },

    // --- ARCHITEKTURA & ŚCIANY ---
    wall: {
        type: 'wall',
        category: 'infrastructure',
        name: 'Ściana (Dowolna dł.)',
        width: 160,
        height: 14,
        color: '#94a3b8',
        isITAsset: false,
        resizable: true,
        defaultProps: {
            thickness: 14
        },
        svg: `<svg viewBox="0 0 160 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="160" height="14" fill="#475569" stroke="#94a3b8" stroke-width="1.5"/>
            <line x1="25" y1="0" x2="25" y2="14" stroke="#334155" stroke-width="1"/>
            <line x1="60" y1="0" x2="60" y2="14" stroke="#334155" stroke-width="1"/>
            <line x1="95" y1="0" x2="95" y2="14" stroke="#334155" stroke-width="1"/>
            <line x1="130" y1="0" x2="130" y2="14" stroke="#334155" stroke-width="1"/>
        </svg>`
    },

    door: {
        type: 'door',
        category: 'infrastructure',
        name: 'Drzwi Biurowe',
        width: 50,
        height: 40,
        color: '#e2e8f0',
        isITAsset: false,
        defaultProps: {},
        svg: `<svg viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="2" y1="38" x2="48" y2="38" stroke="#64748b" stroke-width="3"/>
            <path d="M2 38C2 18 18 2 38 2" stroke="#38bdf8" stroke-width="2" stroke-dasharray="3 3" fill="none"/>
            <line x1="2" y1="38" x2="38" y2="2" stroke="#38bdf8" stroke-width="2.5"/>
            <circle cx="2" cy="38" r="3" fill="#38bdf8"/>
        </svg>`
    },

    window_elem: {
        type: 'window_elem',
        category: 'infrastructure',
        name: 'Okno Ścienne',
        width: 100,
        height: 14,
        color: '#38bdf8',
        isITAsset: false,
        resizable: true,
        defaultProps: {},
        svg: `<svg viewBox="0 0 100 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="100" height="14" fill="#0369a1" stroke="#38bdf8" stroke-width="1.5"/>
            <line x1="0" y1="7" x2="100" y2="7" stroke="#bae6fd" stroke-width="1.5"/>
            <line x1="50" y1="0" x2="50" y2="14" stroke="#38bdf8" stroke-width="1.5"/>
        </svg>`
    },

    // --- STREFY ---
    zone: {
        type: 'zone',
        category: 'zones',
        name: 'Strefa / Dział Biura',
        width: 240,
        height: 180,
        color: '#6366f1',
        isITAsset: false,
        resizable: true,
        defaultProps: {
            label: 'Strefa / Dział',
            fillColor: 'rgba(99, 102, 241, 0.08)',
            borderColor: '#6366f1'
        },
        svg: `<svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="236" height="176" rx="8" fill="rgba(99, 102, 241, 0.08)" stroke="#6366f1" stroke-width="2" stroke-dasharray="6 4"/>
            <rect x="12" y="10" width="120" height="22" rx="4" fill="#4f46e5"/>
            <text x="72" y="25" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">STREFA IT</text>
        </svg>`
    }
};

// Domyślny szablon startowy (Przykładowe nowoczesne biuro IT)
const DEMO_OFFICE_TEMPLATE = {
    name: "Główne Biuro IT (Floor 1)",
    gridSize: 20,
    width: 1200,
    height: 800,
    elements: [
        // --- STREFY ---
        {
            id: 'zone_dev',
            type: 'zone',
            x: 60,
            y: 60,
            width: 560,
            height: 480,
            rotation: 0,
            props: { label: 'Open Space - Dział Programistów', fillColor: 'rgba(59, 130, 246, 0.06)', borderColor: '#3b82f6' }
        },
        {
            id: 'zone_server',
            type: 'zone',
            x: 660,
            y: 60,
            width: 320,
            height: 280,
            rotation: 0,
            props: { label: 'Serwerownia (Klimatyzowana)', fillColor: 'rgba(16, 185, 129, 0.08)', borderColor: '#10b981' }
        },
        {
            id: 'zone_conf',
            type: 'zone',
            x: 660,
            y: 380,
            width: 440,
            height: 320,
            rotation: 0,
            props: { label: 'Sala Konferencyjna "Apollo"', fillColor: 'rgba(168, 85, 247, 0.06)', borderColor: '#a855f7' }
        },

        // --- ŚCIANY & ARCHITEKTURA ---
        { id: 'w1', type: 'wall', x: 50, y: 50, width: 950, height: 14, rotation: 0, props: {} },
        { id: 'w2', type: 'wall', x: 50, y: 50, width: 14, height: 680, rotation: 0, props: {} },
        { id: 'w3', type: 'wall', x: 50, y: 716, width: 1060, height: 14, rotation: 0, props: {} },
        { id: 'w4', type: 'wall', x: 990, y: 50, width: 14, height: 340, rotation: 0, props: {} },
        { id: 'w5', type: 'wall', x: 1100, y: 380, width: 14, height: 350, rotation: 0, props: {} },
        
        // Ściany serwerowni
        { id: 'w_srv_v', type: 'wall', x: 650, y: 50, width: 14, height: 290, rotation: 0, props: {} },
        { id: 'w_srv_h', type: 'wall', x: 650, y: 330, width: 350, height: 14, rotation: 0, props: {} },
        
        // Okna
        { id: 'win1', type: 'window_elem', x: 160, y: 48, width: 140, height: 14, rotation: 0, props: {} },
        { id: 'win2', type: 'window_elem', x: 380, y: 48, width: 140, height: 14, rotation: 0, props: {} },

        // Drzwi
        { id: 'door_srv', type: 'door', x: 680, y: 330, width: 50, height: 40, rotation: 0, props: {} },
        { id: 'door_conf', type: 'door', x: 650, y: 400, width: 50, height: 40, rotation: 90, props: {} },

        // --- SPRZĘT W SERWEROWNI ---
        {
            id: 'rack_main',
            type: 'server_rack',
            x: 700,
            y: 90,
            width: 54,
            height: 54,
            rotation: 0,
            props: {
                employee: 'Admin Team',
                department: 'Infrastruktura IT',
                model: 'Szafa RACK 42U - HP ProLiant DL380 Gen10',
                cpuRam: '2x Intel Xeon Gold 6248R / 512GB RAM / 24TB NVMe',
                serialNumber: 'SRV-MAIN-01',
                ipAddress: '192.168.1.10',
                macAddress: '00:50:56:A3:B1:01',
                switchPort: 'Port 1-2 (LACP 20G)',
                status: 'active'
            }
        },
        {
            id: 'sw_core',
            type: 'network_switch',
            x: 800,
            y: 90,
            width: 50,
            height: 30,
            rotation: 0,
            props: {
                employee: 'Admin Team',
                department: 'Infrastruktura IT',
                model: 'Cisco Catalyst 3850 48P PoE+',
                cpuRam: 'Core Switch 48x 1Gbps PoE + 4x 10G SFP+',
                serialNumber: 'SW-CORE-01',
                ipAddress: '192.168.1.1',
                macAddress: '00:1E:F7:88:99:00',
                switchPort: 'Uplink Fiber 10Gbps',
                status: 'active'
            }
        },
        {
            id: 'ups_rack',
            type: 'ups_battery',
            x: 700,
            y: 190,
            width: 30,
            height: 38,
            rotation: 0,
            props: {
                employee: 'Infrastruktura',
                department: 'Serwerownia',
                model: 'APC Smart-UPS RT 3000VA On-Line',
                cpuRam: '2700W / Podtrzymanie 45 min',
                serialNumber: 'UPS-SRV-01',
                ipAddress: '192.168.1.250',
                macAddress: '00:C0:B7:12:34:56',
                switchPort: 'SW-CORE-P46',
                status: 'active'
            }
        },

        // --- STANOWISKA PROGRAMISTÓW ---
        // Biurko Podwójne 1
        { id: 'desk_b1', type: 'desk_bench_double', x: 100, y: 120, width: 110, height: 120, rotation: 0, props: { label: 'Wyspa DEV 1' } },
        { id: 'chair1_a', type: 'office_chair', x: 135, y: 80, width: 34, height: 34, rotation: 180, props: {} },
        { id: 'chair1_b', type: 'office_chair', x: 135, y: 245, width: 34, height: 34, rotation: 0, props: {} },
        
        {
            id: 'pc_dev_01',
            type: 'dual_monitor',
            x: 125,
            y: 130,
            width: 60,
            height: 36,
            rotation: 0,
            props: {
                employee: 'Jan Kowalski',
                department: 'Senior Frontend Dev',
                model: 'Dell Precision 3660 + 2x Dell U2723QE 4K',
                cpuRam: 'i9-13900K / 64GB DDR5 / RTX 4070 / 2TB NVMe',
                serialNumber: 'PC-DEV-01',
                ipAddress: '192.168.1.101',
                macAddress: 'E8:6A:64:11:22:33',
                switchPort: 'SW-CORE-P01',
                status: 'active'
            }
        },
        {
            id: 'pc_dev_02',
            type: 'laptop',
            x: 130,
            y: 190,
            width: 46,
            height: 36,
            rotation: 0,
            props: {
                employee: 'Anna Nowak',
                department: 'UX/UI Designer',
                model: 'Apple MacBook Pro 16" M3 Max + Studio Display',
                cpuRam: 'Apple M3 Max 16-core / 48GB Unified / 1TB SSD',
                serialNumber: 'MAC-UX-02',
                ipAddress: '192.168.1.102',
                macAddress: 'F0:18:98:AA:BB:CC',
                switchPort: 'SW-CORE-P02',
                status: 'active'
            }
        },

        // Biurko Podwójne 2
        { id: 'desk_b2', type: 'desk_bench_double', x: 300, y: 120, width: 110, height: 120, rotation: 0, props: { label: 'Wyspa DEV 2' } },
        { id: 'chair2_a', type: 'office_chair', x: 335, y: 80, width: 34, height: 34, rotation: 180, props: {} },
        { id: 'chair2_b', type: 'office_chair', x: 335, y: 245, width: 34, height: 34, rotation: 0, props: {} },
        
        {
            id: 'pc_dev_03',
            type: 'pc_workstation',
            x: 330,
            y: 130,
            width: 48,
            height: 44,
            rotation: 0,
            props: {
                employee: 'Piotr Wiśniewski',
                department: 'Backend Tech Lead',
                model: 'Lenovo ThinkStation P3 Tower + 34" Curved',
                cpuRam: 'i7-13700 / 32GB RAM / 2TB NVMe SSD',
                serialNumber: 'PC-DEV-03',
                ipAddress: '192.168.1.103',
                macAddress: 'D4:5D:64:99:88:77',
                switchPort: 'SW-CORE-P03',
                status: 'active'
            }
        },
        {
            id: 'voip_dev_03',
            type: 'voip_phone',
            x: 380,
            y: 135,
            width: 24,
            height: 24,
            rotation: 0,
            props: {
                employee: 'Piotr Wiśniewski',
                department: 'Backend Tech Lead',
                model: 'Yealink SIP-T46U',
                cpuRam: 'Wewn. 103 / PoE',
                serialNumber: 'VOIP-DEV-03',
                ipAddress: '192.168.1.183',
                macAddress: '80:5E:C0:44:55:66',
                switchPort: 'SW-CORE-P04',
                status: 'active'
            }
        },
        {
            id: 'pc_dev_04',
            type: 'pc_workstation',
            x: 330,
            y: 185,
            width: 48,
            height: 44,
            rotation: 0,
            props: {
                employee: 'Magdalena Kaczmarek',
                department: 'QA & DevOps Engineer',
                model: 'HP Z2 Mini G9 Workstation',
                cpuRam: 'i7-12700K / 64GB RAM / 1TB SSD',
                serialNumber: 'PC-QA-04',
                ipAddress: '192.168.1.104',
                macAddress: 'A4:BB:6D:77:88:99',
                switchPort: 'SW-CORE-P05',
                status: 'active'
            }
        },

        // --- DRUKARKA CENTRALNA & AP WI-FI ---
        {
            id: 'prn_central',
            type: 'printer',
            x: 500,
            y: 140,
            width: 46,
            height: 46,
            rotation: 0,
            props: {
                employee: 'Współdzielona (Piętro 1)',
                department: 'Administracja & Dev',
                model: 'Canon imageRUNNER ADVANCE DX C3830i',
                cpuRam: 'Kolorowy laser wielofunkcyjny A3/A4, Duplex, LAN',
                serialNumber: 'PRN-CANON-01',
                ipAddress: '192.168.1.200',
                macAddress: '00:1B:A9:74:32:11',
                switchPort: 'SW-CORE-P24',
                status: 'active'
            }
        },
        {
            id: 'ap_openspace',
            type: 'wifi_ap',
            x: 280,
            y: 320,
            width: 36,
            height: 36,
            rotation: 0,
            props: {
                employee: 'Dostęp Ogólny & Goście',
                department: 'Sieć Bezprzewodowa',
                model: 'Ubiquiti UniFi U6 Enterprise',
                cpuRam: 'Wi-Fi 6E (2.4/5/6 GHz) 10.2 Gbps PoE+',
                serialNumber: 'AP-WIFI6-01',
                ipAddress: '192.168.1.20',
                macAddress: '74:83:C2:FF:EE:DD',
                switchPort: 'SW-CORE-P48 (PoE+)',
                status: 'active'
            }
        },

        // --- SALA KONFERENCYJNA ---
        { id: 'conf_tbl_apollo', type: 'conf_table', x: 740, y: 470, width: 180, height: 90, rotation: 0, props: { label: 'Stół Apollo' } },
        { id: 'chair_c1', type: 'office_chair', x: 770, y: 425, width: 32, height: 32, rotation: 180, props: {} },
        { id: 'chair_c2', type: 'office_chair', x: 820, y: 425, width: 32, height: 32, rotation: 180, props: {} },
        { id: 'chair_c3', type: 'office_chair', x: 870, y: 425, width: 32, height: 32, rotation: 180, props: {} },
        { id: 'chair_c4', type: 'office_chair', x: 770, y: 570, width: 32, height: 32, rotation: 0, props: {} },
        { id: 'chair_c5', type: 'office_chair', x: 820, y: 570, width: 32, height: 32, rotation: 0, props: {} },
        { id: 'chair_c6', type: 'office_chair', x: 870, y: 570, width: 32, height: 32, rotation: 0, props: {} },
        
        {
            id: 'conf_system',
            type: 'dual_monitor',
            x: 795,
            y: 485,
            width: 70,
            height: 42,
            rotation: 0,
            props: {
                employee: 'System Wideokonferencji',
                department: 'Sala Apollo',
                model: 'Logitech Rally Bar + Ekran 75" 4K Sony BRAVIA',
                cpuRam: 'Kamera 4K Ultra-HD z AI, 6x mikrofon beamforming',
                serialNumber: 'VC-APOLLO-01',
                ipAddress: '192.168.1.150',
                macAddress: '00:04:F2:99:11:22',
                switchPort: 'SW-CORE-P15',
                status: 'active'
            }
        }
    ],
    cables: [
        { id: 'c1', fromId: 'sw_core', toId: 'rack_main', type: 'fiber', color: '#ec4899', label: 'Fiber 20G Trunk' },
        { id: 'c2', fromId: 'sw_core', toId: 'ups_rack', type: 'lan', color: '#3b82f6', label: 'Zarządzanie UPS' },
        { id: 'c3', fromId: 'sw_core', toId: 'ap_openspace', type: 'lan', color: '#3b82f6', label: 'PoE+ AP Wi-Fi' },
        { id: 'c4', fromId: 'sw_core', toId: 'prn_central', type: 'lan', color: '#3b82f6', label: 'LAN Drukarka' },
        { id: 'c5', fromId: 'sw_core', toId: 'pc_dev_01', type: 'lan', color: '#3b82f6', label: 'Gniazdo DEV 1' },
        { id: 'c6', fromId: 'sw_core', toId: 'pc_dev_03', type: 'lan', color: '#3b82f6', label: 'Gniazdo DEV 3' },
        { id: 'c7', fromId: 'sw_core', toId: 'conf_system', type: 'lan', color: '#3b82f6', label: 'LAN Konferencja' }
    ]
};
