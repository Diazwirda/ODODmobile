import * as Keychain from 'react-native-keychain';

const SERVICE_PREFIX = 'odob-mobile';

// Legacy support (backwards compatible with old single-backend approach)
const LEGACY_SERVICE = 'odob-daily-token';

/**
 * Generic secure storage functions
 */

export async function setItem(key: string, value: string): Promise<void> {
  const service = `${SERVICE_PREFIX}-${key}`;
  await Keychain.setGenericPassword(key, value, { service });
}

export async function getItem(key: string): Promise<string | null> {
  const service = `${SERVICE_PREFIX}-${key}`;
  const result = await Keychain.getGenericPassword({ service });
  return result ? result.password : null;
}

export async function removeItem(key: string): Promise<void> {
  const service = `${SERVICE_PREFIX}-${key}`;
  await Keychain.resetGenericPassword({ service });
}

/**
 * Legacy functions (for backward compatibility)
 * Maps to OdobDaily backend token
 */

export async function saveToken(token: string): Promise<void> {
  // Save to both legacy location and new location
  await Keychain.setGenericPassword('auth', token, { service: LEGACY_SERVICE });
  await setItem('odob_token', token);
}

export async function getToken(): Promise<string | null> {
  // Try new location first, fallback to legacy
  let token = await getItem('odob_token');
  if (!token) {
    const result = await Keychain.getGenericPassword({ service: LEGACY_SERVICE });
    token = result ? result.password : null;
    // Migrate to new location if found in legacy
    if (token) {
      await setItem('odob_token', token);
    }
  }
  return token;
}

export async function removeToken(): Promise<void> {
  // Remove from both locations
  await Keychain.resetGenericPassword({ service: LEGACY_SERVICE });
  await removeItem('odob_token');
}
