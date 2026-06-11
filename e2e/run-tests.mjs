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
  assert(adminDevices.data.length >= 5, `Admin: widzi >= 5 urządzeń (faktycznie: ${adminDevices.data.length})`);

  // User A (SpaceX Fleet) — widzi 2 urządzenia
  const userADevices = await request('GET', '/devices', null, userA.token);
  assert(userADevices.status === 200, 'User A: GET /devices zwraca 200');
  assert(userADevices.data.length === 2, `User A (SpaceX): widzi dokładnie 2 urządzenia (faktycznie: ${userADevices.data.length})`);
  const userANames = userADevices.data.map(d => d.name).sort();
  assert(userANames.includes('Drone Alpha'), 'User A: widzi Drone Alpha');
  assert(userANames.includes('Drone Beta'), 'User A: widzi Drone Beta');
  assert(!userANames.includes('Drone Gamma'), 'User A: NIE widzi Drone Gamma (inna org)');

  // User B (Blue Origin Fleet) — widzi 2 urządzenia
  const userBDevices = await request('GET', '/devices', null, userB.token);
  assert(userBDevices.data.length === 2, `User B (Blue Origin): widzi dokładnie 2 urządzenia (faktycznie: ${userBDevices.data.length})`);
  const userBNames = userBDevices.data.map(d => d.name).sort();
  assert(userBNames.includes('Drone Gamma'), 'User B: widzi Drone Gamma');
  assert(userBNames.includes('Drone Delta'), 'User B: widzi Drone Delta');

  // User C (DJI Enterprise) — widzi 1 urządzenie
  const userCDevices = await request('GET', '/devices', null, userC.token);
  assert(userCDevices.data.length === 1, `User C (DJI): widzi dokładnie 1 urządzenie (faktycznie: ${userCDevices.data.length})`);
  assert(userCDevices.data[0].name === 'Sensor Hub X1', 'User C: widzi Sensor Hub X1');

  // User D (SpaceX Fleet) — te same urządzenia co User A
  const userDDevices = await request('GET', '/devices', null, userD.token);
  assert(userDDevices.data.length === 2, `User D (SpaceX): widzi dokładnie 2 urządzenia (faktycznie: ${userDDevices.data.length})`);
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
  assert(adminStatus.data.total >= 5, `Admin: total urządzeń >= 5 (faktycznie: ${adminStatus.data.total})`);

  // User A — analityka ograniczona do organizacji
  const userABattery = await request('GET', '/analytics/battery', null, userA.token);
  assert(userABattery.status === 200, 'User A: GET /analytics/battery zwraca 200');
  assert(
    userABattery.data.devices.length <= adminBattery.data.devices.length,
    'User A: widzi mniej lub równo urządzeń w analityce niż admin'
  );

  const userAStatus = await request('GET', '/analytics/status', null, userA.token);
  assert(userAStatus.data.total === 2, `User A: analityka statusów total === 2 (faktycznie: ${userAStatus.data.total})`);
}

async function testOrganizations() {
  console.log('\nTest Suite: Organizacje');

  const admin = await login('admin@iot.com', 'admin123');

  const orgs = await request('GET', '/organizations', null, admin.token);
  assert(orgs.status === 200, 'GET /organizations zwraca status 200');
  assert(Array.isArray(orgs.data), 'Organizacje zwracane jako tablica');

  const orgNames = orgs.data.map(o => o.name);
  assert(orgNames.includes('SpaceX Fleet'), 'Istnieje organizacja SpaceX Fleet');
  assert(orgNames.includes('Blue Origin Fleet'), 'Istnieje organizacja Blue Origin Fleet');
  assert(orgNames.includes('DJI Enterprise'), 'Istnieje organizacja DJI Enterprise');

  // Szczegóły organizacji
  const spaceX = orgs.data.find(o => o.name === 'SpaceX Fleet');
  const orgDetail = await request('GET', `/organizations/${spaceX.id}`, null, admin.token);
  assert(orgDetail.status === 200, 'GET /organizations/:id zwraca 200');
  assert(orgDetail.data.name === 'SpaceX Fleet', 'Szczegóły organizacji: nazwa poprawna');
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
    console.error(`\n❌ Nie można połączyć się z API pod adresem ${API_URL}`);
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
  await testMultiTenancyDevices();
  await testDeviceDetails();
  await testDeviceMetrics();
  await testDeviceCRUD();
  await testValidation();
  await testDeviceNotFound();
  await testAnalytics();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n══════════════════════════════════════════════════════════');
  console.log(`  Wynik: ${passed} /  ${failed} (${duration}s)`);

  if (errors.length > 0) {
    console.log('\n  Nieudane testy:');
    errors.forEach(e => console.log(`    ❌ ${e}`));
  }

  console.log('══════════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

main();
