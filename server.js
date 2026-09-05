/**
 * SERVER.JS
 * Lekki serwer bazy danych i aplikacji dla Office IT Maps.
 * Zapisuje wszystkie zmiany trwale na dysku w katalogu ./data/
 * Opcjonalnie obsługuje MongoDB, jeśli podano MONGODB_URI.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const ROOMS_DIR = path.join(DATA_DIR, 'rooms');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');

// Tworzenie katalogu bazy danych, jeśli nie istnieje
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ROOMS_DIR)) fs.mkdirSync(ROOMS_DIR, { recursive: true });

// Opcjonalne połączenie z MongoDB
let mongoDb = null;
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
    try {
        const { MongoClient } = require('mongodb');
        const client = new MongoClient(MONGODB_URI);
        client.connect().then(() => {
            mongoDb = client.db('office_maps');
            console.log(' [Baza danych] Połączono z MongoDB.');
        }).catch(err => {
            console.error(' [Baza danych] Błąd połączenia z MongoDB:', err.message);
            console.log(' [Baza danych] Przełączono na lokalną bazę plikową ./data/');
        });
    } catch (e) {
        console.log(' [Baza danych] Brak pakietu mongodb. Używam lokalnej bazy plikowej ./data/');
    }
}

// Typy MIME dla serwera statycznego
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Pomocnik do odczytu body z żądania HTTP
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
            if (body.length > 50 * 1024 * 1024) { // limit 50MB
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

// Serwer HTTP
const server = http.createServer(async (req, res) => {
    // Nagłówki CORS (umożliwiają zapis nawet przy otwarciu pliku z file:///)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // --- API: STATUS BAZY DANYCH ---
    if (pathname === '/api/status' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ok: true,
            storageType: mongoDb ? 'mongodb' : 'file',
            dataDir: DATA_DIR
        }));
        return;
    }

    // --- API: LISTA POMIESZCZEŃ ---
    if (pathname === '/api/rooms') {
        if (req.method === 'GET') {
            try {
                if (mongoDb) {
                    const roomsCol = mongoDb.collection('rooms');
                    const rooms = await roomsCol.find({}).toArray();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(rooms.length ? rooms : [{ id: 'room_default', name: 'Główne Biuro IT (Floor 1)' }]));
                    return;
                }

                if (fs.existsSync(ROOMS_FILE)) {
                    const data = fs.readFileSync(ROOMS_FILE, 'utf-8');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(data);
                } else {
                    const defaultRooms = [{ id: 'room_default', name: 'Główne Biuro IT (Floor 1)' }];
                    fs.writeFileSync(ROOMS_FILE, JSON.stringify(defaultRooms, null, 2), 'utf-8');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(defaultRooms));
                }
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
            return;
        }

        if (req.method === 'POST') {
            try {
                const body = await getRequestBody(req);
                if (Array.isArray(body)) {
                    if (mongoDb) {
                        const roomsCol = mongoDb.collection('rooms');
                        await roomsCol.deleteMany({});
                        if (body.length > 0) await roomsCol.insertMany(body);
                    } else {
                        fs.writeFileSync(ROOMS_FILE, JSON.stringify(body, null, 2), 'utf-8');
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, count: body.length }));
                    return;
                }
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Oczekiwano tablicy pomieszczeń' }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
            return;
        }
    }

    // --- API: STAN POJEDYNCZEGO POMIESZCZENIA ---
    if (pathname.startsWith('/api/room/')) {
        const roomId = pathname.replace('/api/room/', '').replace(/[^a-zA-Z0-9_-]/g, '');
        const roomFilePath = path.join(ROOMS_DIR, `${roomId}.json`);

        if (req.method === 'GET') {
            try {
                if (mongoDb) {
                    const statesCol = mongoDb.collection('room_states');
                    const state = await statesCol.findOne({ roomId });
                    if (state) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(state));
                        return;
                    }
                } else if (fs.existsSync(roomFilePath)) {
                    const data = fs.readFileSync(roomFilePath, 'utf-8');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(data);
                    return;
                }

                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Brak zapisanego stanu dla tego pomieszczenia' }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
            return;
        }

        if (req.method === 'POST') {
            try {
                const body = await getRequestBody(req);
                body.roomId = roomId;
                body.savedAt = new Date().toISOString();

                if (mongoDb) {
                    const statesCol = mongoDb.collection('room_states');
                    await statesCol.updateOne({ roomId }, { $set: body }, { upsert: true });
                } else {
                    fs.writeFileSync(roomFilePath, JSON.stringify(body, null, 2), 'utf-8');
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, savedAt: body.savedAt }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
            return;
        }
    }

    // --- SERWOWANIE PLIKÓW STATYCZNYCH (Frontend) ---
    let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    let filePath = path.join(__dirname, relativePath);

    // Zabezpieczenie przed wyjściem z katalogu
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Dostęp zabroniony');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Nie znaleziono pliku');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`\n====================================================`);
        console.log(` [Informacja] Port ${PORT} jest już zajęty.`);
        console.log(` Twoja aplikacja prawdopodobnie już działa w tle:`);
        console.log(` 👉 http://localhost:${PORT}`);
        console.log(`====================================================\n`);
        process.exit(0);
    } else {
        console.error('Błąd serwera:', err);
    }
});

server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Office IT Maps - Serwer uruchomiony!`);
    console.log(` Adres aplikacji: http://localhost:${PORT}`);
    console.log(` Baza danych:     ${mongoDb ? 'MongoDB' : 'Folder ./data/ (trwały zapis)'}`);
    console.log(`====================================================`);
});
