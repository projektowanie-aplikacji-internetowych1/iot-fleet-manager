export function translateError(message: string | string[]): string {
  if (Array.isArray(message)) {
    return message.map(m => translateError(m)).join(', ');
  }

  if (!message) {
    return 'Wystąpił nieznany błąd';
  }

  if (message.includes(', ') && !message.includes('must be one of the following values')) {
    return message.split(', ').map(m => translateError(m)).join(', ');
  }

  const msg = message.trim();
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes('failed to fetch')) {
    return 'Brak połączenia z serwerem. Upewnij się, że backend jest uruchomiony.';
  }
  if (lowerMsg.includes('unauthorized') || lowerMsg === 'unauthorized') {
    return 'Brak autoryzacji. Zaloguj się ponownie.';
  }
  if (lowerMsg.includes('forbidden')) {
    return 'Brak uprawnień do wykonania tej operacji.';
  }
  if (lowerMsg.includes('not found') || lowerMsg === 'not found') {
    return 'Zasób nie został znaleziony.';
  }
  if (lowerMsg.includes('internal server error')) {
    return 'Wystąpił wewnętrzny błąd serwera.';
  }

  if (lowerMsg.includes('invalid email or password')) {
    return 'Nieprawidłowy adres e-mail lub hasło.';
  }
  if (lowerMsg.includes('password must be at least 6 characters long')) {
    return 'Hasło musi składać się z co najmniej 6 znaków.';
  }
  if (lowerMsg.includes('invalid email address format') || lowerMsg.includes('must be an email')) {
    return 'Niepoprawny format adresu e-mail.';
  }
  if (lowerMsg.includes('email already exists') || lowerMsg.includes('user with this email already exists') || lowerMsg.includes('409')) {
    return 'Użytkownik o tym adresie e-mail już istnieje.';
  }
  if (lowerMsg.includes('organization name is required')) {
    return 'Nazwa organizacji jest wymagana.';
  }
  if (lowerMsg.includes('organizationname must be a string')) {
    return 'Nazwa organizacji musi być ciągiem znaków.';
  }

  if (lowerMsg.includes('device name cannot be empty')) {
    return 'Nazwa urządzenia nie może być pusta.';
  }
  if (lowerMsg.includes('name must be a string')) {
    return 'Nazwa urządzenia musi być ciągiem znaków.';
  }
  if (lowerMsg.includes('ip address or hostname is required')) {
    return 'Adres IP lub host jest wymagany.';
  }
  if (lowerMsg.includes('ipaddress must be a string')) {
    return 'Adres IP lub host musi być ciągiem znaków.';
  }
  if (lowerMsg.includes('port must be an integer number') || lowerMsg.includes('port must be an integer')) {
    return 'Port musi być liczbą całkowitą.';
  }
  if (lowerMsg.includes('port must not be less than 1')) {
    return 'Port nie może być mniejszy niż 1.';
  }
  if (lowerMsg.includes('port must not be greater than 65535')) {
    return 'Port nie może być większy niż 65535.';
  }
  if (lowerMsg.includes('authprotocol must be one of the following values')) {
    return 'Protokół uwierzytelniania (Auth) musi mieć jedną z wartości: MD5, SHA, NONE.';
  }
  if (lowerMsg.includes('authpasswordhash must be a string')) {
    return 'Hasło uwierzytelniania (Auth) musi być ciągiem znaków.';
  }
  if (lowerMsg.includes('privacyprotocol must be one of the following values')) {
    return 'Protokół prywatności (Privacy) musi mieć jedną z wartości: DES, AES, NONE.';
  }
  if (lowerMsg.includes('privacypasswordhash must be a string')) {
    return 'Hasło prywatności (Privacy) musi być ciągiem znaków.';
  }
  if (lowerMsg.includes('snmpusername must be a string')) {
    return 'Nazwa użytkownika SNMP musi być ciągiem znaków.';
  }
  if (lowerMsg.includes('organizationid must be a string')) {
    return 'Identyfikator organizacji musi być ciągiem znaków.';
  }

  return message;
}
