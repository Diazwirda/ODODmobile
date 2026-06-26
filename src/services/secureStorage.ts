import * as Keychain from 'react-native-keychain';

const SERVICE = 'odob-mobile-token';

/**
 * Saves the JWT token to the secure Keychain storage.
 */
export async function saveToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('auth', token, { service: SERVICE });
}

/**
 * Retrieves the JWT token from secure storage.
 * Returns null if no token is stored.
 */
export async function getToken(): Promise<string | null> {
  const result = await Keychain.getGenericPassword({ service: SERVICE });
  if (!result) {
    return null;
  }
  return result.password;
}

/**
 * Removes the JWT token from secure storage.
 */
export async function removeToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}

/**
 * Checks whether the token needs to be refreshed based on its remaining lifetime.
 *
 * @param remainingSeconds - Seconds until the token expires.
 * @param threshold        - Seconds before expiry at which a refresh is triggered (default: 300).
 * @returns `true` if the token should be refreshed, `false` otherwise.
 */
export function checkTokenNeedsRefresh(remainingSeconds: number, threshold: number = 300): boolean {
  return remainingSeconds <= threshold;
}
