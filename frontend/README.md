# IoT Fleet Manager - React SPA Frontend

Aplikacja kliencka Single Page Application dla systemu zarządzenia flotą urządzeń IoT. Zbudowana przy użyciu stosu technologicznego: **Vite**, **React**, **TypeScript**, **Tailwind CSS v4** oraz biblioteki wykresów **Recharts**.

## Główne Funkcjonalności

- **Panel Główny (Dashboard):**
  - Podsumowanie floty: liczba urządzeń online/offline, średni poziom baterii, średnie RAM, średni sygnał oraz aktywne alarmy.
  - Wykres kołowy rozkładu statusów urządzeń.
  - Wykres słupkowy poziomu naładowania baterii poszczególnych urządzeń.
  - Przycisk wymuszający natychmiastowe odświeżenie danych telemetrycznych dla całej organizacji.
  - Panel ostrzeżeń dla urządzeń o krytycznie niskim poziomie baterii.
- **Zarządzanie Urządzeniami:**
  - Tabela ze szczegółowymi informacjami tj.: Nazwa, IP, Port, Status, Poziom baterii, Organizacja.
  - Wyszukiwarka urządzeń po nazwie i adresie IP oraz filtry statusów.
  - Formularz dodawania nowego urządzenia z konfiguracją SNMPv3.
  - Możliwość modyfikacji danych urządzenia oraz usuwania z floty.
- **Szczegóły Urządzenia:**
  - Odczyty telemetryczne w czasie rzeczywistym i przycisk natychmiastowej aktualizacji danych z urządzenia (indywidualne odpytanie SNMP).
  - Wykresy historyczne (bateria, temperatura, RAM, sygnał, uptime).
- **Autoryzacja i Izolacja Dzierżawców (Multi-tenancy):**
  - Formularze logowania (`/login`) oraz rejestracji z automatycznym dołączeniem do organizacji (`/register`).
  - Dostęp do widoków chroniony przez `PrivateRoute`.
  - Wsparcie dla ról użytkowników:
    - `USER` widzi wyłącznie urządzenia i analitykę swojej organizacji.
    - `ADMIN` widzi dane wszystkich organizacji w systemie, a przy dodawaniu urządzenia może wybrać organizację docelową.

---

## Wygląd i Stylistyka

Interfejs użytkownika został zaprojektowany z dbałością o estetykę premium:
- **Ciemny motyw:** Głębokie tło z kontrastującym tekstem.
- **Glassmorphism:** Karty i paski boczne stylizowane na półprzezroczyste szkło, delikatne obramowania z przezroczystością.
- **Mikro-animacje:** Efekty najechania myszką, pulsujące diody statusu online.
- **Typografia:** Zaimplementowana czcionka geometryczna `Outfit` z Google Fonts.

---

## Instalacja i Uruchomienie

1. Przejdź do folderu frontendowego:
   ```bash
   cd frontend
   ```

2. Zainstaluj zależności:
   ```bash
   npm install
   ```

3. Uruchom serwer deweloperski z przeładowaniem na żywo:
   ```bash
   npm run dev
   ```

Aplikacja domyślnie uruchomi się pod adresem:  
👉 **[http://localhost:5173](http://localhost:5173)**

---

## Budowanie Produkcyjne

Aby przygotować zoptymalizowaną paczkę produkcyjną:
```bash
# Kompilacja TypeScript oraz build Vite
npm run build

# Podgląd zbudowanej aplikacji lokalnie
npm run preview
```
Paczka wynikowa zostanie zapisana w katalogu `dist/`.
