# IoT Fleet Manager

System klasy **IoT Fleet Manager** umożliwiający monitorowanie urządzeń IoT za pośrednictwem protokołu **SNMPv3** z uwierzytelnianiem SHA i szyfrowaniem AES.

Projekt został zaprojektowany z architekturą izolacji najemców, w której użytkownicy są przypisywani do konkretnych organizacji, a administratorzy mają globalny wgląd w całą flotę.

---

## Architektura Systemu

System składa się z pięciu głównych komponentów uruchamianych w odrębnych kontenerach:

1. **Frontend (Vite + React + TypeScript):**
   Ciemny, responsywny interfejs użytkownika zaprojektowany w stylu glassmorphism. Wizualizuje stan floty w postaci wykresów kołowych i słupkowych oraz pobiera historię odczytów dla każdego urządzenia.
2. **Backend (NestJS + TypeScript):**
   Dostarcza zabezpieczone interfejsy REST API. Obsługuje walidację wejściową DTO, logowanie JWT oraz udostępnia dokumentację OpenAPI Swagger pod adresem `/api/docs`.
3. **Baza Danych (PostgreSQL + Prisma ORM):**
   Przechowuje konta użytkowników, organizacje, konfiguracje zabezpieczeń urządzeń oraz historię odczytów parametrów.
4. **Kolejka Zadań & Cache (BullMQ + Redis):**
   Uruchamia asynchroniczny worker w tle, który co **30 sekund** pobiera dane ze wszystkich zarejestrowanych urządzeń IoT za pomocą protokołu SNMPv3 i zapisuje wyniki w bazie danych.
5. **Symulator Urządzeń SNMP (Docker Net-SNMP):**
   Oddzielne kontenery symulujące drony ze spersonalizowanymi parametrami początkowymi i cyklicznymi zmianami telemetrii.

---

## Szybkie Uruchomienie (Docker Compose)

Wszystkie serwisy systemu mogą zostać uruchomione jedną komendą:

1. Upewnij się, że masz zainstalowany program **Docker** oraz **Docker Compose**.
2. W głównym katalogu projektu (`iot-fleet-manager/`) uruchom:
   ```bash
   docker compose up --build
   ```
3. Docker pobierze obrazy bazowe, skompiluje frontend i backend, uruchomi bazę danych wraz z automatycznymi migracjami Prisma oraz zasili bazę danymi demonstracyjnymi.

> **Uwaga:** Komendę należy uruchamiać z katalogu głównego projektu, w którym znajduje się plik `docker-compose.yml`.

### Dostępne Adresy URL:
- **Panel Frontend:** [http://localhost:5173](http://localhost:5173)
- **Dokumentacja API Swagger:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Serwer API Backend:** [http://localhost:3000](http://localhost:3000)
- **Health Check:** [http://localhost:3000/health](http://localhost:3000/health)

---

## Konta Demonstracyjne

Po starcie bazy danych, seeder automatycznie tworzy testową strukturę **3 organizacji**, **6 użytkowników** oraz **10 urządzeń IoT**:

### Organizacje

| Nazwa organizacji | Liczba użytkowników | Liczba urządzeń | Domyślne urządzenia |
| :--- | :---: | :---: | :--- |
| **SpaceX Fleet** | 3 (1 Admin + 2 User) | 4 | Drone Alpha, Drone Beta, Sensor Temp-1, Mars Rover X |
| **Blue Origin Fleet** | 2 (1 Admin + 1 User) | 3 | Drone Gamma, Sensor Press-2, Gateway Lunar |
| **DJI Enterprise** | 1 (1 User) | 3 | Drone Delta, Sensor Humid-3, Security Cam-1 |

### Użytkownicy

| Adres E-mail | Hasło | Rola | Organizacja (Tenant) | Widoczne urządzenia |
| :--- | :--- | :--- | :--- | :--- |
| **admin@iot.com** | `admin123` | **ADMIN** | SpaceX Fleet | Wszystkie urządzenia w systemie |
| **adminb@iot.com** | `admin123` | **ADMIN** | Blue Origin Fleet | Wszystkie urządzenia w systemie |
| **usera@iot.com** | `user123` | **USER** | SpaceX Fleet | Drone Alpha, Drone Beta, Sensor Temp-1, Mars Rover X |
| **userd@iot.com** | `user123` | **USER** | SpaceX Fleet | Drone Alpha, Drone Beta, Sensor Temp-1, Mars Rover X |
| **userb@iot.com** | `user123` | **USER** | Blue Origin Fleet | Drone Gamma, Sensor Press-2, Gateway Lunar |
| **userc@iot.com** | `user123` | **USER** | DJI Enterprise | Drone Delta, Sensor Humid-3, Security Cam-1 |

### Urządzenia IoT

| Nazwa urządzenia | Typ | Adres IP (host Docker) | Port | Protokół Auth | Protokół Priv | Organizacja |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **Drone Alpha** | Drone | `mock-device-1` | 161 | SHA | AES | SpaceX Fleet |
| **Drone Beta** | Drone | `mock-device-2` | 161 | SHA | AES | SpaceX Fleet |
| **Sensor Temp-1** | Sensor | `mock-device-3` | 161 | SHA | AES | SpaceX Fleet |
| **Mars Rover X** | Rover | `mock-device-4` | 161 | SHA | AES | SpaceX Fleet |
| **Drone Gamma** | Drone | `mock-device-5` | 161 | SHA | AES | Blue Origin Fleet |
| **Sensor Press-2** | Sensor | `mock-device-6` | 161 | SHA | AES | Blue Origin Fleet |
| **Gateway Lunar** | Gateway | `mock-device-7` | 161 | SHA | AES | Blue Origin Fleet |
| **Drone Delta** | Drone | `mock-device-8` (OFFLINE) | 161 | SHA | AES | DJI Enterprise |
| **Sensor Humid-3** | Sensor | `mock-device-9` | 161 | SHA | AES | DJI Enterprise |
| **Security Cam-1** | Camera | `mock-device-10` | 161 | SHA | AES | DJI Enterprise |

## Dodawanie i Konfiguracja Nowych Urządzeń

W systemie IoT Fleet Manager możesz elastycznie rozszerzać flotę monitorowanych dronów i sensorów. Działa to dwuetapowo: od strony panelu użytkownika oraz opcjonalnie w środowisku deweloperskim od strony wirtualnych kontenerów Docker.

### 1. Dodawanie urządzenia z poziomu Panelu Użytkownika

Użytkownik z rolą Administratora lub zalogowany członek danej organizacji może dodać nowe urządzenie za pomocą przycisku **Dodaj urządzenie** na liście urządzeń (`/devices`).

* **Scenariusz A (Urządzenie istnieje w sieci):**
  Jeśli podasz adres IP rzeczywistego fizycznego urządzenia w sieci lokalnej lub działającego kontenera Docker, które ma poprawnie skonfigurowanego agenta SNMPv3 z tymi samymi poświadczeniami, system automatycznie nawiąże z nim połączenie i pobierze unikalne, rzeczywiste dane telemetryczne.

* **Scenariusz B (Urządzenie nie istnieje / błędny adres IP):**
  Jeśli wpiszesz losowy lub błędny adres IP np. `192.168.1.99` lub `mock-device-99`, pod którym nie działa żaden agent SNMP, próba połączenia w tle odbywająca się cyklicznie co 30 sekund zakończy się niepowodzeniem. W takim przypadku system zapisze w bazie informację, że urządzenie jest **OFFLINE**, a wykresy oraz parametry na karcie szczegółów urządzenia nie wyświetlą żadnych danych telemetrycznych.

---

### 2. Dodawanie nowego, unikalnego urządzenia testowego w środowisku Docker

Jeśli chcesz przetestować dodanie kolejnego wirtualnego urządzenia z unikalnymi wartościami telemetrycznymi w środowisku lokalnym:

1. Otwórz plik `docker-compose.yml` i dodaj kolejny serwis (np. `mock-device-6`):
   ```yaml
     mock-device-6:
       build:
         context: ./docker/snmp-mock
         dockerfile: Dockerfile
       container_name: mock-device-6
       restart: always
       environment:
         CONTAINER_NAME: "mock-device-6"
         BATTERY_SEED: 95
         BATTERY_DRAIN_SPEED: 0.8
         TEMP_SEED: 22
         TEMP_FLUCTUATION: 4.5
         SIGNAL_SEED: -65
         MEMORY_SEED: 45
       ports:
         - "166:161/udp"
   ```
2. Uruchom nowy kontener w terminalu:
   ```bash
   docker compose up -d mock-device-6
   ```
3. Zaloguj się do panelu aplikacji i dodaj nowe urządzenie wpisując:
   * **Nazwa urządzenia:** np. `Drone Epsilon`
   * **Adres IP / Host:** `mock-device-6`
   * **Port UDP:** `161`
4. **Efekt:** System w tle nawiąże komunikację z nowo powstałym kontenerem i po pierwszym cyklu odpytywania zacznie rejestrować unikalne odczyty zaczynające się od baterii 95% (która będzie spadać z szybkością 0.8%/cykl) oraz temperatury oscylującej w granicach +/- 4.5°C od 22°C.
5. **Konfigurowalne parametry środowiskowe symulatora:**
   * `BATTERY_SEED` - Wartość początkowa baterii (domyślnie `100`).
   * `BATTERY_DRAIN_SPEED` - Prędkość rozładowywania na cykl (domyślnie `0.2`). Jeśli ustawiona na `0`, bateria nie rozładowuje się.
   * `TEMP_SEED` - Wartość początkowa/średnia temperatury (domyślnie `25`).
   * `TEMP_FLUCTUATION` - Maksymalna amplituda losowych zmian temperatury na cykl (domyślnie `1.0`).
   * `SIGNAL_SEED` - Bazowa moc sygnału RSSI w dBm (domyślnie `-50`).
   * `MEMORY_SEED` - Bazowy poziom procentowy użycia pamięci RAM (domyślnie `35`).

---

## Instrukcja Testowania Manualnego

Poniższa instrukcja prowadzi krok po kroku przez wszystkie kluczowe funkcjonalności systemu. Każdy krok weryfikuje inny aspekt aplikacji.

### Test 1: Logowanie i autoryzacja

1. Otwórz w przeglądarce [http://localhost:5173](http://localhost:5173).
2. Zostaniesz przekierowany na stronę logowania.
3. Zaloguj się danymi: **usera@iot.com** / `user123`.
4. **Oczekiwany wynik:** Zostaniesz przekierowany na **Panel Główny**. W lewym dolnym rogu paska bocznego widoczny jest zalogowany e-mail oraz rola użytkownika.

### Test 2: Dashboard

1. Na Panelu Głównym sprawdź, czy wyświetlają się karty podsumowujące:
   - **Urządzenia Online** — powinno wskazywać liczbę urządzeń ze statusem SPRAWNY w Twojej organizacji.
   - **Średnia Bateria** — procentowy wskaźnik średniego naładowania baterii floty.
2. Sprawdź, czy wykresy statusów i wykres baterii poprawnie się renderują.
3. **Oczekiwany wynik:** Dane powinny automatycznie odświeżać się co kilka sekund bez przeładowania strony.

### Test 3: Izolacja danych

1. Przejdź do zakładki **Urządzenia Fleet** w menu bocznym.
2. **Oczekiwany wynik:** Na liście widoczne są wyłącznie urządzenia Twojej organizacji: `Drone Alpha` i `Drone Beta`. Urządzenia `Drone Gamma`, `Drone Delta` i `Sensor Hub X1` z innych organizacji są **niewidoczne**.
3. Wyloguj się i zaloguj jako **userb@iot.com** / `user123`.
4. Przejdź do **Urządzenia Fleet**.
5. **Oczekiwany wynik:** Widzisz tylko `Drone Gamma` i `Drone Delta`.
6. Wyloguj się i zaloguj jako **userc@iot.com** / `user123`.
7. Przejdź do **Urządzenia Fleet**.
8. **Oczekiwany wynik:** Widzisz wyłącznie `Sensor Hub X1`.

### Test 4: Widok administratora

1. Wyloguj się i zaloguj jako **admin@iot.com** / `admin123`.
2. Przejdź do **Urządzenia Fleet**.
3. **Oczekiwany wynik:** Lista zawiera **wszystkie 5 urządzeń** ze wszystkich organizacji: Drone Alpha, Drone Beta, Drone Gamma, Drone Delta, Sensor Hub X1.
4. Na Panelu Głównym wykresy powinny agregować dane ze **wszystkich** organizacji.

### Test 5: Szczegóły urządzenia i wykresy telemetryczne

1. Jako administrator, na liście urządzeń kliknij ikonę oka (👁) przy urządzeniu `Drone Alpha`.
2. **Oczekiwany wynik:** Otwiera się widok szczegółów urządzenia zawierający:
   - Kartę informacyjną z nazwą, adresem IP, portem, organizacją.
   - Konfigurację SNMPv3 (protokół Auth: SHA, protokół Privacy: AES, użytkownik: bootstrapUser).
   - Wykresy historyczne: **Bateria (%)**, **Temperatura (°C)**, **Czas pracy (uptime)**.
3. Sprawdź, czy wykresy posiadają punkty danych i linie trendu.

### Test 6: Wyszukiwarka i filtry na liście urządzeń

1. Jako admin na stronie **Urządzenia Fleet**, wpisz w pole wyszukiwania tekst `Gamma`.
2. **Oczekiwany wynik:** Lista filtruje się i pokazuje tylko `Drone Gamma`.
3. Wyczyść pole wyszukiwania, a następnie zmień filtr statusu na jeden z dostępnych (np. `Sprawny`).
4. **Oczekiwany wynik:** Lista pokazuje tylko urządzenia z wybranym statusem.

### Test 7: Dodawanie nowego urządzenia

1. Jako administrator, przejdź do **Urządzenia Fleet** i kliknij przycisk **+ Dodaj urządzenie**.
2. Wypełnij formularz:
   - Nazwa: `Drone Epsilon`
   - Adres IP: `mock-device-3`
   - Port: `161`
   - Protokół Auth: `SHA`
   - Hasło Auth: `authPassword123`
   - Protokół Privacy: `AES`
   - Hasło Privacy: `privPassword456`
   - Użytkownik SNMP: `bootstrapUser`
   - Organizacja: wybierz `DJI Enterprise`
3. Kliknij **Zapisz**.
4. **Oczekiwany wynik:** Nowe urządzenie pojawia się na liście i po ok. 30 sekundach system automatycznie pobierze z niego dane telemetryczne, status zmieni się na SPRAWNY.

### Test 8: Usuwanie urządzenia

1. Jako administrator, znajdź na liście nowo dodane urządzenie `Drone Epsilon`.
2. Kliknij przycisk usuwania przy tym urządzeniu.
3. **Oczekiwany wynik:** Urządzenie znika z listy. Przy ponownym zalogowaniu jako `userc@iot.com` urządzenie `Drone Epsilon` nie powinno być widoczne.

### Test 9: Walidacja formularzy

1. Jako administrator, kliknij **+ Dodaj urządzenie**.
2. Spróbuj wysłać formularz **bez podania nazwy** urządzenia.
3. **Oczekiwany wynik:** Formularz nie pozwala na wysłanie lub wyświetla komunikat o błędzie walidacji.
4. Wpisz w pole portu wartość `99999` (poza zakresem 1–65535).
5. **Oczekiwany wynik:** Backend zwraca błąd walidacji (HTTP 400).

### Test 10: Rejestracja nowego konta

1. Wyloguj się z aplikacji.
2. Na stronie logowania kliknij link do rejestracji lub przejdź do `/register`.
3. Wypełnij formularz: e-mail `nowy@iot.com`, hasło `haslo123`, nazwa organizacji `Nowa Firma`.
4. **Oczekiwany wynik:** Konto zostaje utworzone, nowa organizacja `Nowa Firma` jest automatycznie tworzona, a użytkownik zostaje zalogowany.

### Test 11: Weryfikacja Swagger API

1. Otwórz w przeglądarce [http://localhost:3000/api/docs](http://localhost:3000/api/docs).
2. **Oczekiwany wynik:** Wyświetla się interaktywna dokumentacja Swagger z listą wszystkich endpointów pogrupowanych według modułów (Health Check, Auth, Organizations, Devices, Analytics).
3. Kliknij na endpoint `POST /auth/login`, a następnie przycisk **Try it out**.
4. Wpisz body: `{ "email": "admin@iot.com", "password": "admin123" }` i kliknij **Execute**.
5. **Oczekiwany wynik:** Odpowiedź HTTP 201 z obiektem zawierającym pole `accessToken`.

### Test 12: Health Check

1. Otwórz w przeglądarce [http://localhost:3000/health](http://localhost:3000/health).
2. **Oczekiwany wynik:** Odpowiedź JSON: `{ "status": "UP", "timestamp": "...", "uptime": ... }`.

### Test 13: Porównanie dwóch użytkowników w tej samej organizacji

1. Zaloguj się jako **usera@iot.com** / `user123`.
2. Zanotuj widoczne urządzenia i dane na dashboardzie.
3. Wyloguj się i zaloguj jako **userd@iot.com** / `user123`.
4. **Oczekiwany wynik:** Obaj użytkownicy widzą **identyczne** dane: te same urządzenia oraz identyczne wykresy analityczne, ponieważ należą do tej samej organizacji.

### Test 14: Próba nieautoryzowanego dostępu

1. Wyloguj się z aplikacji.
2. Spróbuj wejść bezpośrednio na adres [http://localhost:5173/dashboard](http://localhost:5173/dashboard).
3. **Oczekiwany wynik:** Aplikacja automatycznie przekierowuje na stronę logowania, ponieważ brak tokenu JWT.

---

## Automatyczne Testy End-to-End

Oprócz testów manualnych, w projekcie dostępny jest skrypt automatycznych testów E2E, który weryfikuje **90 przypadków testowych** pokrywających wszystkie kluczowe funkcjonalności API.

### Wymagania:
- Działające środowisko Docker (`docker compose up --build`)
- Node.js 18+ zainstalowany lokalnie (wbudowane API `fetch`)

### Uruchomienie:
```bash
node e2e/run-tests.mjs
```

### Pokrycie testów E2E:

| Moduł testowy | Liczba testów | Co weryfikuje |
| :--- | :---: | :--- |
| Health Check | 4 | Endpoint `/health`, poprawność pól odpowiedzi |
| Strona Powitalna | 2 | Dostępność strony głównej API |
| Logowanie (Auth) | 12 | Logowanie 6 użytkowników, błędne hasła, nieistniejące konta |
| Rejestracja | 4 | Tworzenie nowego konta, duplikacja e-maila |
| Dostęp Nieautoryzowany | 4 | Brak tokenu JWT, fałszywy token |
| Organizacje | 7 | Lista i szczegóły organizacji |
| Multi-Tenancy | 14 | Izolacja urządzeń per organizacja dla 5 użytkowników |
| Szczegóły Urządzenia | 9 | Pola konfiguracji SNMPv3 |
| Metryki Urządzenia | 8 | Dane telemetryczne z pollingu SNMP |
| CRUD Urządzeń | 9 | Dodawanie, widoczność, usuwanie urządzenia |
| Walidacja Danych | 4 | Brak wymaganych pól, port poza zakresem, błędny enum |
| Obsługa Błędów (404) | 2 | Pobieranie/usuwanie nieistniejącego urządzenia |
| Analityka (OLAP) | 11 | Agregacje baterii i statusów, filtrowanie per organizacja |
| **Razem** | **90** | |

