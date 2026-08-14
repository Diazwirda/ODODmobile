/**
 * Backend Configuration
 * 
 * Defines the single active backend for this app:
 * - Spot Slimrich: Slimrich API integration, @humanplus.co.id only
 */

export type BackendType = 'odob' | 'spot';

export interface BackendConfig {
  id: BackendType;
  name: string;
  baseURL: string;
  features: {
    manualDepartments: boolean;
    slimrichIntegration: boolean;
    emailRestriction: string | null;
    googleOAuth: boolean;
  };
}

export const BACKENDS: Record<BackendType, BackendConfig> = {
  odob: {
    id: 'odob',
    name: 'Spot Slimrich',
    baseURL: 'https://spot.slimrich.id/api',
    features: {
      manualDepartments: false,
      slimrichIntegration: true,
      emailRestriction: '@humanplus.co.id',
      googleOAuth: false,
    },
  },
  spot: {
    id: 'spot',
    name: 'Spot Slimrich',
    baseURL: 'https://spot.slimrich.id/api',
    features: {
      manualDepartments: false,
      slimrichIntegration: true,
      emailRestriction: '@humanplus.co.id',
      googleOAuth: false,
    },
  },
};

/**
 * Get backend config by type
 */
export const getBackendConfig = (type: BackendType): BackendConfig => {
  return BACKENDS[type];
};

/**
 * Validate email against backend restrictions
 */
export const validateEmailForBackend = (
  email: string,
  backend: BackendType,
): boolean => {
  const config = BACKENDS[backend];
  
  if (!config.features.emailRestriction) {
    return true; // No restriction
  }
  
  return email.endsWith(config.features.emailRestriction);
};
