/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║        IoT Fleet Manager — Testy End-to-End (E2E)           ║
 * ║                                                              ║
 * ║  Uruchom po starcie środowiska Docker:                       ║
 * ║    node e2e/run-tests.mjs                                    ║
 * ║                                                              ║
 * ║  Wymagania: Node.js 18+ (wbudowany fetch API)                ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;
const errors = [];

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  return { status: res.status, data };
}

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(testName);
  } else {
    failed++;
    errors.push(testName);
    console.log(testName);
  }
}

async function login(email, password) {
  const { status, data } = await request('POST', '/auth/login', { email, password });
  return { status, token: data?.accessToken, user: data?.user };
}

async function testHealthCheck() {
  console.log('\nTest Suite: Health Check');
  const { status, data } = await request('GET', '/health');
  assert(status === 200, 'GET /health zwraca status 200');
  assert(data.status === 'UP', 'Pole status === "UP"');
  assert(typeof data.uptime === 'number', 'Pole uptime jest liczbą');
  assert(typeof data.timestamp === 'string', 'Pole timestamp jest ciągiem znaków');
}

async function testWelcomePage() {
  console.log('\nTest Suite: Strona Powitalna');
  const { status, data } = await request('GET', '/');
  assert(status === 200, 'GET / zwraca status 200');
  assert(typeof data === 'string' && data.includes('IoT Fleet Manager'), 'Odpowiedź zawiera nazwę aplikacji');
}

async function testAuthLogin() {
  console.log('\nTest Suite: Logowanie (Auth)');

  // Poprawne logowanie — admin
  const admin = await login('admin@iot.com', 'admin123');
  assert(admin.status === 200, 'Admin: logowanie zwraca status 200');
  assert(typeof admin.token === 'string' && admin.token.length > 20, 'Admin: zwrócono token JWT');
  assert(admin.user?.role === 'ADMIN', 'Admin: rola === ADMIN');

  // Poprawne logowanie — zwykły użytkownik A
  const userA = await login('usera@iot.com', 'user123');
  assert(userA.status === 200, 'User A: logowanie zwraca status 200');
  assert(userA.user?.role === 'USER', 'User A: rola === USER');

  // Poprawne logowanie — zwykły użytkownik B
  const userB = await login('userb@iot.com', 'user123');
  assert(userB.status === 200, 'User B: logowanie zwraca status 200');

  // Poprawne logowanie — zwykły użytkownik C
  const userC = await login('userc@iot.com', 'user123');
  assert(userC.status === 200, 'User C: logowanie zwraca status 200');

  // Poprawne logowanie — zwykły użytkownik D
  const userD = await login('userd@iot.com', 'user123');
  assert(userD.status === 200, 'User D: logowanie zwraca status 200');

  // Poprawne logowanie — admin B
  const adminB = await login('adminb@iot.com', 'admin123');
  assert(adminB.status === 200, 'Admin B: logowanie zwraca status 200');
  assert(adminB.user?.role === 'ADMIN', 'Admin B: rola === ADMIN');

  // Niepoprawne hasło
  const badPwd = await login('admin@iot.com', 'zlehaslo');
  assert(badPwd.status === 401, 'Błędne hasło: zwraca status 401 Unauthorized');

  // Nieistniejący użytkownik
  const noUser = await login('nieistnieje@iot.com', 'haslo');
  assert(noUser.status === 400 || noUser.status === 401, 'Nieistniejący użytkownik: zwraca status 400 lub 401');
}

async function testAuthRegister() {
  console.log('\nTest Suite: Rejestracja');

  const timestamp = Date.now();
  const email = `test_${timestamp}@e2e.com`;
  const orgName = `E2E Org ${timestamp}`;

  const { status, data } = await request('POST', '/auth/register', {
    email,
    password: 'testpass123',
    organizationName: orgName,
  });
  assert(status === 201, 'Rejestracja nowego konta zwraca status 201');
  assert(typeof data.accessToken === 'string', 'Rejestracja zwraca token JWT');
  assert(data.user?.email === email, 'E-mail zarejestrowanego użytkownika jest poprawny');

  // Próba ponownej rejestracji z tym samym emailem
  const duplicate = await request('POST', '/auth/register', {
    email,
    password: 'inne_haslo',
    organizationName: 'Inna Org',
  });
  assert(duplicate.status === 409, 'Ponowna rejestracja tego samego emaila zwraca 409 Conflict');

  // Sprzątanie po teście rejestracji za pomocą Admina
  if (data?.user?.organizationId) {
    const admin = await login('admin@iot.com', 'admin123');
    const cleanupRes = await request('DELETE', `/organizations/${data.user.organizationId}`, null, admin.token);
    assert(cleanupRes.status === 200, 'Sprzątanie po rejestracji: usunięcie organizacji zwraca 200');
  } else {
    assert(false, 'Sprzątanie po rejestracji: brak organizationId do usunięcia');
  }
}

async function testMultiTenancyDevices() {
  console.log('\nTest Suite: Multi-Tenancy — Izolacja Urządzeń');

  const admin = await login('admin@iot.com', 'admin123');
  const userA = await login('usera@iot.com', 'user123');
  const userB = await login('userb@iot.com', 'user123');
  const userC = await login('userc@iot.com', 'user123');
  const userD = await login('userd@iot.com', 'user123');

  // Admin widzi wszystkie urządzenia
  const adminDevices = await request('GET', '/devices', null, admin.token);
  assert(adminDevices.status === 200, 'Admin: GET /devices zwraca 200');
  assert(adminDevices.data.length >= 10, `Admin: widzi >= 10 urządzeń (faktycznie: ${adminDevices.data.length})`);

  // User A (SpaceX Fleet) — widzi 4 urządzenia
  const userADevices = await request('GET', '/devices', null, userA.token);
  assert(userADevices.status === 200, 'User A: GET /devices zwraca 200');
  assert(userADevices.data.length === 4, `User A (SpaceX): widzi dokładnie 4 urządzenia (faktycznie: ${userADevices.data.length})`);
  const userANames = userADevices.data.map(d => d.name).sort();
  assert(userANames.includes('Drone Alpha'), 'User A: widzi Drone Alpha');
  assert(userANames.includes('Drone Beta'), 'User A: widzi Drone Beta');
  assert(userANames.includes('Sensor Temp-1'), 'User A: widzi Sensor Temp-1');
  assert(userANames.includes('Mars Rover X'), 'User A: widzi Mars Rover X');
  assert(!userANames.includes('Drone Gamma'), 'User A: NIE widzi Drone Gamma (inna org)');

  // User B (Blue Origin Fleet) — widzi 3 urządzenia
  const userBDevices = await request('GET', '/devices', null, userB.token);
  assert(userBDevices.data.length === 3, `User B (Blue Origin): widzi dokładnie 3 urządzenia (faktycznie: ${userBDevices.data.length})`);
  const userBNames = userBDevices.data.map(d => d.name).sort();
  assert(userBNames.includes('Drone Gamma'), 'User B: widzi Drone Gamma');
  assert(userBNames.includes('Sensor Press-2'), 'User B: widzi Sensor Press-2');
  assert(userBNames.includes('Gateway Lunar'), 'User B: widzi Gateway Lunar');

  // User C (DJI Enterprise) — widzi 3 urządzenia
  const userCDevices = await request('GET', '/devices', null, userC.token);
  assert(userCDevices.data.length === 3, `User C (DJI): widzi dokładnie 3 urządzenia (faktycznie: ${userCDevices.data.length})`);
  const userCNames = userCDevices.data.map(d => d.name).sort();
  assert(userCNames.includes('Drone Delta'), 'User C: widzi Drone Delta');
  assert(userCNames.includes('Sensor Humid-3'), 'User C: widzi Sensor Humid-3');
  assert(userCNames.includes('Security Cam-1'), 'User C: widzi Security Cam-1');

  // User D (SpaceX Fleet) — te same urządzenia co User A
  const userDDevices = await request('GET', '/devices', null, userD.token);
  assert(userDDevices.data.length === 4, `User D (SpaceX): widzi dokładnie 4 urządzenia (faktycznie: ${userDDevices.data.length})`);
  const userDNames = userDDevices.data.map(d => d.name).sort();
  assert(
    JSON.stringify(userANames) === JSON.stringify(userDNames),
    'User A i User D (ta sama org) widzą identyczne urządzenia'
  );
}

async function testDeviceDetails() {
  console.log('\nTest Suite: Szczegóły Urządzenia');

  const admin = await login('admin@iot.com', 'admin123');
  const devices = await request('GET', '/devices', null, admin.token);
  const droneAlpha = devices.data.find(d => d.name === 'Drone Alpha');

  assert(droneAlpha !== undefined, 'Znaleziono urządzenie Drone Alpha');

  const detail = await request('GET', `/devices/${droneAlpha.id}`, null, admin.token);
  assert(detail.status === 200, 'GET /devices/:id zwraca status 200');
  assert(detail.data.name === 'Drone Alpha', 'Szczegóły: nazwa === Drone Alpha');
  assert(detail.data.ipAddress === 'mock-device-1', 'Szczegóły: ipAddress === mock-device-1');
  assert(detail.data.port === 161, 'Szczegóły: port === 161');
  assert(detail.data.authProtocol === 'SHA', 'Szczegóły: authProtocol === SHA');
  assert(detail.data.privacyProtocol === 'AES', 'Szczegóły: privacyProtocol === AES');
  assert(detail.data.snmpUsername === 'bootstrapUser', 'Szczegóły: snmpUsername === bootstrapUser');
  assert(detail.data.organization !== undefined, 'Szczegóły: zawiera obiekt organization');
}

async function testDeviceMetrics() {
  console.log('\nTest Suite: Metryki Urządzenia');

  const admin = await login('admin@iot.com', 'admin123');
  const devices = await request('GET', '/devices', null, admin.token);
  const droneAlpha = devices.data.find(d => d.name === 'Drone Alpha');

  const metrics = await request('GET', `/devices/${droneAlpha.id}/metrics`, null, admin.token);
  assert(metrics.status === 200, 'GET /devices/:id/metrics zwraca status 200');
  assert(Array.isArray(metrics.data), 'Metryki zwracane jako tablica');

  if (metrics.data.length > 0) {
    const m = metrics.data[0];
    assert(typeof m.battery === 'number', 'Metryka: pole battery jest liczbą');
    assert(typeof m.uptime === 'number', 'Metryka: pole uptime jest liczbą');
    assert(typeof m.status === 'string', 'Metryka: pole status jest ciągiem znaków');
    assert(typeof m.temperature === 'number', 'Metryka: pole temperature jest liczbą');
    assert(typeof m.collectedAt === 'string', 'Metryka: pole collectedAt jest datą (string)');
    assert(m.battery >= 0 && m.battery <= 100, `Metryka: bateria w zakresie 0-100 (wartość: ${m.battery})`);
  } else {
    console.log('Brak metryk — poczekaj 30s na pierwszy cykl SNMP i uruchom testy ponownie');
  }
}

async function testDeviceCRUD() {
  console.log('\nTest Suite: CRUD Urządzeń (Dodawanie/Usuwanie)');

  const admin = await login('admin@iot.com', 'admin123');

  // Pobierz listę organizacji
  const orgs = await request('GET', '/organizations', null, admin.token);
  assert(orgs.status === 200, 'GET /organizations zwraca status 200');
  assert(orgs.data.length >= 3, `Istnieje >= 3 organizacji (faktycznie: ${orgs.data.length})`);

  const djiOrg = orgs.data.find(o => o.name === 'DJI Enterprise');
  assert(djiOrg !== undefined, 'Znaleziono organizację DJI Enterprise');

  // Dodanie nowego urządzenia
  const newDevice = await request('POST', '/devices', {
    name: 'E2E Test Drone',
    ipAddress: 'mock-device-3',
    port: 161,
    authProtocol: 'SHA',
    authPasswordHash: 'authPassword123',
    privacyProtocol: 'AES',
    privacyPasswordHash: 'privPassword456',
    snmpUsername: 'bootstrapUser',
    organizationId: djiOrg.id,
  }, admin.token);
  assert(newDevice.status === 201, 'POST /devices (dodanie urządzenia) zwraca status 201');
  assert(newDevice.data.name === 'E2E Test Drone', 'Nowe urządzenie: nazwa === E2E Test Drone');

  const newDeviceId = newDevice.data.id;

  // Weryfikacja, że nowe urządzenie jest widoczne na liście
  const afterAdd = await request('GET', '/devices', null, admin.token);
  const found = afterAdd.data.find(d => d.id === newDeviceId);
  assert(found !== undefined, 'Nowe urządzenie jest widoczne na liście po dodaniu');

  // User C (DJI Enterprise) powinien teraz widzieć 2 urządzenia
  const userC = await login('userc@iot.com', 'user123');
  const userCDevices = await request('GET', '/devices', null, userC.token);
  assert(
    userCDevices.data.some(d => d.id === newDeviceId),
    'User C (DJI): widzi nowo dodane urządzenie w swojej organizacji'
  );

  // Usunięcie urządzenia
  const deleteRes = await request('DELETE', `/devices/${newDeviceId}`, null, admin.token);
  assert(deleteRes.status === 200, 'DELETE /devices/:id zwraca status 200');

  // Weryfikacja, że urządzenie zostało usunięte
  const afterDelete = await request('GET', '/devices', null, admin.token);
  const stillExists = afterDelete.data.find(d => d.id === newDeviceId);
  assert(stillExists === undefined, 'Urządzenie nie istnieje na liście po usunięciu');
}

async function testValidation() {
  console.log('\nTest Suite: Walidacja Danych (Schema Validation)');

  const admin = await login('admin@iot.com', 'admin123');
  const orgs = await request('GET', '/organizations', null, admin.token);
  const orgId = orgs.data[0]?.id;

  // Brak wymaganego pola "name"
  const noName = await request('POST', '/devices', {
    ipAddress: 'mock-device-1',
    organizationId: orgId,
  }, admin.token);
  assert(noName.status === 400, 'Brak pola name: zwraca 400 Bad Request');

  // Brak wymaganego pola "ipAddress"
  const noIp = await request('POST', '/devices', {
    name: 'Test',
    organizationId: orgId,
  }, admin.token);
  assert(noIp.status === 400, 'Brak pola ipAddress: zwraca 400 Bad Request');

  // Port poza zakresem (>65535)
  const badPort = await request('POST', '/devices', {
    name: 'Test',
    ipAddress: 'mock-device-1',
    port: 99999,
    organizationId: orgId,
  }, admin.token);
  assert(badPort.status === 400, 'Port 99999 (poza zakresem): zwraca 400 Bad Request');

  // Nieprawidłowy enum authProtocol
  const badEnum = await request('POST', '/devices', {
    name: 'Test',
    ipAddress: 'mock-device-1',
    authProtocol: 'INVALID_PROTO',
    organizationId: orgId,
  }, admin.token);
  assert(badEnum.status === 400, 'Nieprawidłowy authProtocol: zwraca 400 Bad Request');
}

async function testUnauthorizedAccess() {
  console.log('\nTest Suite: Dostęp Nieautoryzowany');

  // Brak tokenu JWT
  const noToken = await request('GET', '/devices');
  assert(noToken.status === 401, 'GET /devices bez tokenu: zwraca 401 Unauthorized');

  const noTokenAnalytics = await request('GET', '/analytics/battery');
  assert(noTokenAnalytics.status === 401, 'GET /analytics/battery bez tokenu: zwraca 401');

  const noTokenOrgs = await request('GET', '/organizations');
  assert(noTokenOrgs.status === 401, 'GET /organizations bez tokenu: zwraca 401');

  // Nieprawidłowy token JWT
  const fakeToken = await request('GET', '/devices', null, 'faketoken12345');
  assert(fakeToken.status === 401, 'GET /devices z fałszywym tokenem: zwraca 401');
}

async function testDeviceNotFound() {
  console.log('\nTest Suite: Obsługa Błędów (404)');

  const admin = await login('admin@iot.com', 'admin123');

  const notFound = await request('GET', '/devices/nieistniejace-id-12345', null, admin.token);
  assert(notFound.status === 404, 'GET /devices/:id z nieistniejącym ID: zwraca 404 Not Found');

  const deleteNotFound = await request('DELETE', '/devices/nieistniejace-id-12345', null, admin.token);
  assert(deleteNotFound.status === 404, 'DELETE /devices/:id z nieistniejącym ID: zwraca 404');
}

async function testAnalytics() {
  console.log('\nTest Suite: Analityka (OLAP)');

  const admin = await login('admin@iot.com', 'admin123');
  const userA = await login('usera@iot.com', 'user123');

  // Admin — globalna analityka baterii
  const adminBattery = await request('GET', '/analytics/battery', null, admin.token);
  assert(adminBattery.status === 200, 'Admin: GET /analytics/battery zwraca 200');
  assert(typeof adminBattery.data.averageBattery === 'number', 'Analityka baterii: pole averageBattery jest liczbą');
  assert(Array.isArray(adminBattery.data.devices), 'Analityka baterii: pole devices jest tablicą');

  // Admin — globalna analityka statusów
  const adminStatus = await request('GET', '/analytics/status', null, admin.token);
  assert(adminStatus.status === 200, 'Admin: GET /analytics/status zwraca 200');
  assert(typeof adminStatus.data.ONLINE === 'number', 'Analityka statusów: pole ONLINE jest liczbą');
  assert(typeof adminStatus.data.OFFLINE === 'number', 'Analityka statusów: pole OFFLINE jest liczbą');
  assert(typeof adminStatus.data.total === 'number', 'Analityka statusów: pole total jest liczbą');
  assert(adminStatus.data.total >= 10, `Admin: total urządzeń >= 10 (faktycznie: ${adminStatus.data.total})`);

  // User A — analityka ograniczona do organizacji
  const userABattery = await request('GET', '/analytics/battery', null, userA.token);
  assert(userABattery.status === 200, 'User A: GET /analytics/battery zwraca 200');
  assert(
    userABattery.data.devices.length <= adminBattery.data.devices.length,
    'User A: widzi mniej lub równo urządzeń w analityce niż admin'
  );

  const userAStatus = await request('GET', '/analytics/status', null, userA.token);
  assert(userAStatus.data.total === 4, `User A: analityka statusów total === 4 (faktycznie: ${userAStatus.data.total})`);
}

async function testOrganizations() {
  console.log('\nTest Suite: Organizacje');

  const admin = await login('admin@iot.com', 'admin123');
  const userA = await login('usera@iot.com', 'user123');

  // Pobranie listy organizacji przez admina
  const orgs = await request('GET', '/organizations', null, admin.token);
  assert(orgs.status === 200, 'GET /organizations zwraca status 200');
  assert(Array.isArray(orgs.data), 'Organizacje zwracane jako tablica');

  const orgNames = orgs.data.map(o => o.name);
  assert(orgNames.includes('SpaceX Fleet'), 'Istnieje organizacja SpaceX Fleet');
  assert(orgNames.includes('Blue Origin Fleet'), 'Istnieje organizacja Blue Origin Fleet');
  assert(orgNames.includes('DJI Enterprise'), 'Istnieje organizacja DJI Enterprise');

  // Szczegóły organizacji dla Admina
  const spaceX = orgs.data.find(o => o.name === 'SpaceX Fleet');
  const orgDetail = await request('GET', `/organizations/${spaceX.id}`, null, admin.token);
  assert(orgDetail.status === 200, 'GET /organizations/:id zwraca 200');
  assert(orgDetail.data.name === 'SpaceX Fleet', 'Szczegóły organizacji: nazwa SpaceX Fleet poprawna');

  // Izolacja tenantów: Użytkownik A próbuje pobrać szczegóły innej organizacji
  const dji = orgs.data.find(o => o.name === 'DJI Enterprise');
  const forbiddenOrg = await request('GET', `/organizations/${dji.id}`, null, userA.token);
  assert(forbiddenOrg.status === 403, 'Użytkownik A: próba pobrania szczegółów innej org zwraca 403 Forbidden');

  // Użytkownik A widzi tylko swoją organizację na liście
  const userAOrgs = await request('GET', '/organizations', null, userA.token);
  assert(userAOrgs.data.length === 1, 'Użytkownik A: widzi dokładnie jedną organizację na liście');
  assert(userAOrgs.data[0].name === 'SpaceX Fleet', 'Użytkownik A: widzi wyłącznie SpaceX Fleet');

  // Tworzenie nowej organizacji przez Admina
  const newOrgRes = await request('POST', '/organizations', { name: 'E2E Test Org 99' }, admin.token);
  assert(newOrgRes.status === 201, 'Admin: POST /organizations (utworzenie nowej org) zwraca 201');
  const createdOrgId = newOrgRes.data.id;

  // Próba usunięcia organizacji przez nie-admina
  const deleteForbidden = await request('DELETE', `/organizations/${createdOrgId}`, null, userA.token);
  assert(deleteForbidden.status === 403, 'Użytkownik A: próba usunięcia org zwraca 403 Forbidden');

  // Usunięcie nowej organizacji przez Admina
  const deleteSuccess = await request('DELETE', `/organizations/${createdOrgId}`, null, admin.token);
  assert(deleteSuccess.status === 200, 'Admin: DELETE /organizations/:id (usunięcie org) zwraca 200');
}

async function testUsers() {
  console.log('\nTest Suite: Zarządzanie Użytkownikami i Profil');

  const admin = await login('admin@iot.com', 'admin123');
  const userA = await login('usera@iot.com', 'user123');

  // Zwykły użytkownik próbuje uzyskać dostęp do listy zarządzania użytkownikami
  const forbiddenUsersList = await request('GET', '/users', null, userA.token);
  assert(forbiddenUsersList.status === 403, 'Użytkownik A: próba pobrania listy użytkowników zwraca 403 Forbidden');

  // Administrator pobiera listę użytkowników
  const usersList = await request('GET', '/users', null, admin.token);
  assert(usersList.status === 200, 'Admin: GET /users zwraca status 200');
  assert(Array.isArray(usersList.data), 'Lista użytkowników zwracana jako tablica');
  const userEmails = usersList.data.map(u => u.email);
  assert(userEmails.includes('admin@iot.com'), 'Lista użytkowników zawiera admin@iot.com');

  // Użytkownik A pobiera własny profil
  const profileRes = await request('GET', '/users/me', null, userA.token);
  assert(profileRes.status === 200, 'Użytkownik A: GET /users/me zwraca status 200');
  assert(profileRes.data.email === 'usera@iot.com', 'Profil: email jest prawidłowy (usera@iot.com)');
  assert(profileRes.data.role === 'USER', 'Profil: rola jest prawidłowa (USER)');

  // Użytkownik A aktualizuje adres e-mail własnego profilu
  const tempEmail = `usera_temp_${Date.now()}@iot.com`;
  const updateProfileRes = await request('PUT', '/users/me', { email: tempEmail }, userA.token);
  assert(updateProfileRes.status === 200, 'Użytkownik A: PUT /users/me (zmiana emaila) zwraca 200');

  // Weryfikacja możliwości zalogowania się z nowym e-mailem
  const loginTemp = await login(tempEmail, 'user123');
  assert(loginTemp.token !== undefined, 'Logowanie: nowe dane autoryzacyjne działają');

  // Przywrócenie pierwotnego adresu e-mail Użytkownika A, aby uniknąć błędów w innych testach
  const restoreProfileRes = await request('PUT', '/users/me', { email: 'usera@iot.com' }, loginTemp.token);
  assert(restoreProfileRes.status === 200, 'Użytkownik A: przywrócenie domyślnego emaila zwraca 200');

  // Admin CRUD - Walidacja tworzenia użytkownika (zbyt krótkie hasło)
  const validationRes = await request('POST', '/users', {
    email: `new_user_${Date.now()}@iot.com`,
    password: '123',
    role: 'USER',
    organizationId: profileRes.data.organizationId
  }, admin.token);
  assert(validationRes.status === 400, 'Admin: POST /users z hasłem < 6 znaków zwraca 400 Bad Request');

  // Admin CRUD - Poprawne utworzenie użytkownika
  const newUserEmail = `new_e2e_user_${Date.now()}@iot.com`;
  const createRes = await request('POST', '/users', {
    email: newUserEmail,
    password: 'secretPassword123',
    role: 'USER',
    organizationId: profileRes.data.organizationId
  }, admin.token);
  assert(createRes.status === 201, 'Admin: POST /users (utworzenie użytkownika) zwraca 201 Created');
  const createdUserId = createRes.data.id;

  // Admin CRUD - Aktualizacja użytkownika
  const updateRes = await request('PUT', `/users/${createdUserId}`, {
    email: newUserEmail,
    role: 'ADMIN',
  }, admin.token);
  assert(updateRes.status === 200, 'Admin: PUT /users/:id (promocja na ADMINa) zwraca 200');

  // Weryfikacja logowania i roli awansowanego użytkownika
  const loginPromoted = await login(newUserEmail, 'secretPassword123');
  assert(loginPromoted.user?.role === 'ADMIN', 'Logowanie: promowany użytkownik ma rolę ADMIN');

  // Admin CRUD - Usunięcie użytkownika
  const deleteRes = await request('DELETE', `/users/${createdUserId}`, null, admin.token);
  assert(deleteRes.status === 200, 'Admin: DELETE /users/:id (usunięcie konta) zwraca 200');

  // Samousunięcie
  const selfDeleteEmail = `self_delete_user_${Date.now()}@iot.com`;
  const registerSelfRes = await request('POST', '/auth/register', {
    email: selfDeleteEmail,
    password: 'password123',
    organizationName: `Org Self Delete ${Date.now()}`
  });
  assert(registerSelfRes.status === 201, 'Rejestracja tymczasowego użytkownika do samousunięcia');
  const selfToken = registerSelfRes.data.accessToken;

  const selfDeleteRes = await request('DELETE', '/users/me', null, selfToken);
  assert(selfDeleteRes.status === 200, 'Użytkownik: DELETE /users/me (samousunięcie) zwraca 200');

  const getProfileAfterDelete = await request('GET', '/users/me', null, selfToken);
  assert(getProfileAfterDelete.status === 404 || getProfileAfterDelete.status === 401, 'Próba pobrania profilu usuniętego użytkownika zwraca 404 Not Found lub 401');

  const loginAfterDelete = await request('POST', '/auth/login', { email: selfDeleteEmail, password: 'password123' });
  assert(loginAfterDelete.status === 401 || loginAfterDelete.status === 400, 'Próba logowania na usunięte konto zwraca błąd autoryzacji');
}

async function testOnDemandPolling() {
  console.log('\nTest Suite: Odpytywanie SNMP na żądanie');

  const admin = await login('admin@iot.com', 'admin123');
  const userA = await login('usera@iot.com', 'user123');

  // Brak autoryzacji
  const noToken = await request('POST', '/devices/poll');
  assert(noToken.status === 401, 'POST /devices/poll bez tokenu zwraca 401 Unauthorized');

  // Poprawne odpytywanie wszystkich urządzeń przez Admina
  const adminPoll = await request('POST', '/devices/poll', null, admin.token);
  assert(adminPoll.status === 201, 'Admin: POST /devices/poll (odpytanie wszystkich) zwraca 201 Created');

  // Poprawne odpytywanie urządzeń w organizacji przez User A
  const userAPoll = await request('POST', '/devices/poll', null, userA.token);
  assert(userAPoll.status === 201, 'User A: POST /devices/poll (odpytanie org) zwraca 201 Created');

  // Pobranie urządzenia w celu odpytania pojedynczego
  const devices = await request('GET', '/devices', null, admin.token);
  const droneAlpha = devices.data.find(d => d.name === 'Drone Alpha');
  const droneDelta = devices.data.find(d => d.name === 'Drone Delta'); // Delta należy do org DJI (User C)

  // Odpytanie własnego urządzenia (User A dla Drone Alpha w SpaceX Fleet)
  const userAOnePoll = await request('POST', `/devices/${droneAlpha.id}/poll`, null, userA.token);
  assert(userAOnePoll.status === 201, 'User A: POST /devices/:id/poll własnego urządzenia zwraca 201 Created');

  // Próba odpytania cudzego urządzenia (User A próbuje odpytać Drone Delta z DJI)
  const forbiddenPoll = await request('POST', `/devices/${droneDelta.id}/poll`, null, userA.token);
  assert(forbiddenPoll.status === 403, 'User A: POST /devices/:id/poll urządzenia z innej org zwraca 403 Forbidden');

  // Odpytanie urządzenia przez Admina (dowolne urządzenie)
  const adminOnePoll = await request('POST', `/devices/${droneDelta.id}/poll`, null, admin.token);
  assert(adminOnePoll.status === 201, 'Admin: POST /devices/:id/poll dowolnego urządzenia zwraca 201 Created');
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║      IoT Fleet Manager — Testy End-to-End (E2E)         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nTarget API: ${API_URL}`);

  // Sprawdź, czy API jest dostępne
  try {
    await fetch(`${API_URL}/health`);
  } catch (e) {
    console.error(`\n Nie można połączyć się z API pod adresem ${API_URL}`);
    console.error('   Upewnij się, że środowisko Docker jest uruchomione:');
    console.error('   docker compose up --build\n');
    process.exit(1);
  }

  const startTime = Date.now();

  await testHealthCheck();
  await testWelcomePage();
  await testAuthLogin();
  await testAuthRegister();
  await testUnauthorizedAccess();
  await testOrganizations();
  await testUsers();
  await testMultiTenancyDevices();
  await testDeviceDetails();
  await testDeviceMetrics();
  await testDeviceCRUD();
  await testValidation();
  await testDeviceNotFound();
  await testAnalytics();
  await testOnDemandPolling();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n══════════════════════════════════════════════════════════');
  console.log(`  Wynik: ${passed} /  ${failed} (${duration}s)`);

  if (errors.length > 0) {
    console.log('\n  Nieudane testy:');
    errors.forEach(e => console.log(`    ${e}`));
  }

  console.log('══════════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

main();
