# IoT Fleet Manager

System klasy **IoT Fleet Manager** umożliwiający monitorowanie urządzeń IoT za pośrednictwem protokołu **SNMPv3** z uwierzytelnianiem SHA i szyfrowaniem AES.

Projekt został zaprojektowany z architekturą izolacji najemcóm, w której użytkownicy są przypisywani do konkretnych organizacji, a administratorzy mają globalny wgląd w całą flotę.

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
   3 oddzielne kontenery symulujące drony (Alpha, Beta, Gamma) ze spersonalizowanymi parametrami początkowymi i cyklicznymi zmianami telemetrii.

---

## Szybkie Uruchomienie (Docker Compose)

Wszystkie serwisy systemu mogą zostać uruchomione jedną komendą:

1. Upewnij się, że masz zainstalowany program **Docker** oraz **Docker Compose**.
2. W głównym katalogu projektu uruchom:
   ```bash
   docker compose up --build
   ```
3. Docker pobierze obrazy bazowe, skompiluje frontend i backend, uruchomi bazę danych wraz z automatycznymi migracjami Prisma oraz zasili bazę danymi demonstracyjnymi.

### Dostępne Adresy URL:
- **Panel Frontend:** [http://localhost:5173](http://localhost:5173)
- **Dokumentacja API Swagger:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Serwer API Backend:** [http://localhost:3000](http://localhost:3000)

---

## Konta Demonstracyjne

Po starcie bazy danych, seeder tworzy testową strukturę organizacji, użytkowników i urządzeń:

| Adres E-mail | Hasło | Rola | Organizacja (Tenant) | Widoczne urządzenia |
| :--- | :--- | :--- | :--- | :--- |
| **admin@iot.com** | `admin123` | **ADMIN** | SpaceX Fleet | Wszystkie urządzenia w systemie |
| **userA@iot.com** | `user123` | **USER** | SpaceX Fleet | Drone Alpha, Drone Beta |
| **userB@iot.com** | `user123` | **USER** | Blue Origin Fleet | Drone Gamma |

---

## Instrukcja Testowania Manualnego

Aby przetestować funkcjonalność systemu krok po kroku:

### Krok 1: Logowanie jako Użytkownik A
1. Otwórz w przeglądarce [http://localhost:5173](http://localhost:5173).
2. Zaloguj się danymi: **userA@iot.com** / `user123`.
3. Zostaniesz przekierowany na **Panel Główny**. Zobaczysz wskaźniki podsumowujące urządzenia w Twojej organizacji (np. 2 urządzenia online, średni stan baterii floty).
4. Zwróć uwagę, że dane automatycznie odświeżają się w tle.

### Krok 2: Sprawdzenie Izolacji Danych
1. Przejdź do zakładki **Urządzenia Fleet** w menu bocznym.
2. Na liście zobaczysz wyłącznie urządzenia `Drone Alpha` oraz `Drone Beta` należące do Twojej organizacji. Urządzenie `Drone Gamma` z Blue Origin Fleet jest dla Ciebie niewidoczne.
3. Kliknij przycisk ikony oka przy `Drone Alpha` aby wejść w **Szczegóły Urządzenia**. Zobaczysz tam konfigurację SNMPv3 oraz wykresy parametrów.

### Krok 3: Logowanie jako Administrator i dodanie nowego urządzenia
1. Kliknij **Wyloguj się** w dolnej części panelu bocznego.
2. Zaloguj się danymi administratora: **admin@iot.com** / `admin123`.
3. Przejdź do zakładki **Urządzenia Fleet**. Jako administrator widzisz teraz urządzenia ze **wszystkich** organizacji (`Drone Alpha`, `Drone Beta` oraz `Drone Gamma`).
4. Kliknij przycisk **Dodaj urządzenie**:
   - Wpisz nazwę (np. `Drone Delta`).
   - Podaj host/IP oraz port (np. dla symulowanego urządzenia 3 podaj `mock-device-3` i port `161`).
   - W polu wyboru organizacji wybierz organizację (funkcja dostępna wyłącznie dla roli ADMIN).
   - Wprowadź poświadczenia SNMPv3 (możesz pozostawić domyślne).
   - Kliknij **Zapisz**. Nowe urządzenie pojawi się na liście i system automatycznie rozpocznie jego odpytywanie w tle.
