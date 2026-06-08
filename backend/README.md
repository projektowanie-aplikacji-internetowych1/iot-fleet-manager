# IoT Fleet Manager - NestJS Backend

Serwer backendowy dla systemu zarządzenia flotą dronów/urządzeń IoT, zbudowany przy użyciu frameworka **NestJS**, **Prisma** oraz **BullMQ** do obsługi cyklicznych zadań pobierania telemetrycznych danych SNMPv3.

## Główne Funkcjonalności

- **Autoryzacja JWT (Multi-tenancy):**
  - Rejestracja (`POST /auth/register`) automatycznie przypisuje użytkownika do wskazanej organizacji, tworzy ją lub dołącza do istniejącej.
  - Logowanie (`POST /auth/login`) generuje token dostępu.
  - Dwa poziomy uprawnień: `USER` ma dostęp wyłącznie do urządzeń w obrębie swojej organizacji oraz `ADMIN`, który zarządza globalnie wszystkimi organizacjami i urządzeniami.
- **Zarządzanie urządzeniami:**
  - Tworzenie, odczyt, lista oraz usuwanie urządzeń SNMPv3.
  - Pełna kontrola dostępu w oparciu o przypisaną organizację.
- **Cykliczne odpytywanie SNMPv3:**
  - Zadanie w tle uruchamiane automatycznie co **30 sekund**.
  - Odpytywanie wszystkich urządzeń równolegle protokołem SNMPv3, realizowana jest obsługa poziomów bezpieczeństwa: `noAuthNoPriv`, `authNoPriv`, `authPriv` z szyfrowaniem SHA/AES.
  - Automatyczne rejestrowanie statusu `OFFLINE`, jeśli urządzenie nie odpowie na zapytanie w zadanym limicie czasowym.
- **Analityka i Metryki:**
  - Dynamiczne pobieranie historii metryk dla konkretnego urządzenia, w tym: bateria, temperatura, uptime, status.
  - Zagregowane analizy stanu baterii i liczby statusów dla dashboardu.

---

## Wymagania systemowe

Przed uruchomieniem backendu konieczne jest posiadanie zainstalowanych:
- **Node.js** (wersja v18 lub nowsza)
- **npm**
- Uruchomionej bazy **PostgreSQL** oraz serwera **Redis**.

---

## Instalacja i Konfiguracja

1. Przejdź do folderu backendu:
   ```bash
   cd backend
   ```

2. Zainstaluj zależności:
   ```bash
   npm install
   ```

3. Skopiuj plik środowiskowy `.env` i dostosuj dane połączenia, poniżej zawartość domyślnego .env projektu:
   ```env
   DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/iot_fleet_manager?schema=public"
   PORT=3000
   JWT_SECRET="super-secret-iot-jwt-key-998877"
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   ```

---

## Uruchomienie Bazy Danych i Migracji

Przed wystartowaniem aplikacji konieczne jest przygotowanie struktury bazy danych.

1. Wygeneruj klienta Prisma oraz stwórz migrację bazy danych:
   ```bash
   npx prisma migrate dev --name init
   ```

2. Uruchom skrypt seeder:
   ```bash
   npx prisma db seed
   ```

---

## Uruchamianie Aplikacji

Możesz uruchomić serwer backendowy w różnych trybach:

```bash
# Tryb deweloperski
npm run start:dev

# Standardowe uruchomienie
npm run start

# Tryb produkcyjny
npm run build
npm run start:prod
```

Interfejs API Swaggera jest dostępny pod adresem:  
👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

---

## Testy Jednostkowe

Backend posiada zestaw testów jednostkowych weryfikujących poprawność procesów autoryzacji oraz zarządzania urządzeniami:

```bash
# Uruchomienie wszystkich testów
npm run test
```
