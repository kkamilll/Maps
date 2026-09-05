# Office IT Maps 📐

Prosty planer rzutu biura i ewidencji sprzętu IT z automatycznym zapisem w bazie. Pozwala rozstawiać komputery, meble, łączyć urządzenia kablami i prowadzić spis sprzętu.

---

## Jak uruchomić (zapis w bazie danych)

Wystarczy wpisać w terminalu:
```bash
npm start
```
(lub `npm run dev`), a potem wejść w przeglądarce pod adres: **`http://localhost:3000`**.

### Gdzie zapisują się dane?
- **Domyślnie (baza lokalna):** Serwer automatycznie zapisuje wszystkie pomieszczenia i sprzęty w katalogu **`./data/`** na Twoim dysku. Żadne zmiany nie znikają po odświeżeniu strony, restarcie przeglądarki ani restarcie komputera.
- **Opcjonalnie (MongoDB):** Jeśli chcesz trzymać dane w MongoDB (np. darmowy MongoDB Atlas w chmurze), przed uruchomieniem ustaw zmienną:
  ```bash
  MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/office_maps" npm start
  ```
- **Bez serwera (offline):** Możesz też po prostu kliknąć dwukrotnie w plik `index.html` – aplikacja zadziała w trybie lokalnym (`localStorage`).

---

## Instrukcja obsługi (co, gdzie i jak)

### 1. Rozmieszczanie obiektów (Lewy panel)
- Wybierz kategorię z lewej palety (Komputery, Sieć, Peryferia, Meble, Ściany).
- Kliknij element lub przeciągnij go na siatkę.
- Kliknij element na siatce, aby go zaznaczyć i przesuwać myszą.
- Chwyć za narożny uchwyt, aby zmienić jego rozmiar.

### 2. Wprowadzanie danych sprzętu (Prawy panel)
- Po kliknięciu w dowolny komputer lub switch po prawej stronie pojawią się pola:
  - Pracownik i dział,
  - Model i parametry (CPU / RAM / Dysk),
  - Numer seryjny, IP, MAC i port switcha,
  - Status (aktywny, w naprawie, zapasowy, wycofany).
- Zmiany zapisują się **automatycznie i natychmiast** (status w nagłówku: `🟢 Zapisano w bazie`).

### 3. Łączenie kablami (Górny pasek)
- Kliknij przycisk **🔌 Połącz Kablem**.
- Wybierz typ: LAN (Ethernet), Światłowód, Zasilanie lub HDMI.
- Kliknij pierwsze urządzenie, a następnie drugie – kabel połączy je automatycznie.

### 4. Szukanie i spis sprzętu
- **Pasek na samej górze:** Wpisz nazwisko, IP lub model, a mapa natychmiast wycentruje szukany komputer.
- **Przycisk 📋 Spis Sprzętu:** Otwiera tabelę ze wszystkimi urządzeniami, filtrami i opcją pobrania pliku CSV (do Excela).

### 5. Eksport i kopia zapasowa
- **🖼️ Zapisz PNG** – pobiera czysty obraz rzutu biura w wysokiej jakości.
- **💾 Eksport / 📂 Import JSON** – pozwala zapisać kopię projektu do pliku i przenieść na inny komputer.

---

## Skróty klawiszowe

| Skrót | Działanie |
|---|---|
| `Spacja + Przeciągnij myszą` | Przesuwanie całej mapy |
| `Kółko myszy` | Przybliżanie / oddalanie (Zoom) |
| `R` / `Shift + R` | Obrót zaznaczonego elementu o 45° |
| `Ctrl + D` | Zduplikowanie zaznaczonego elementu |
| `Delete` | Usunięcie zaznaczonego elementu |
| `Ctrl + Z` / `Ctrl + Y` | Cofnij / Ponów |
| `Ctrl + A` | Zaznacz wszystkie elementy |
| `Escape` | Odznaczenie / zamknięcie okna |

---

## Pliki w projekcie

- `server.js` – Serwer Node.js z obsługą bazy danych (lokalnie w `./data/` lub przez MongoDB)
- `data/` – Folder z fizycznie zapisanymi stanami pomieszczeń i sprzętu
- `index.html` – Główny widok aplikacji ze statusem zapisu w nagłówku
- `style.css` – Wygląd i motywy (jasny/ciemny)
- `app.js` – Logika interfejsu i panelu bocznego
- `canvas.js` – Silnik rysowania, siatka, kable i zoom
- `inventory.js` – Wyszukiwarka i tabela spisu sprzętu
- `storage.js` – Moduł łączący aplikację z bazą serwera i autozapisem
- `assets-data.js` – Ikony urządzeń i mebli
