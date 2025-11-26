/**
 * OAuth Provider Configuration
 *
 * This file defines which OAuth providers are enabled in your application.
 * Set enabled: true to activate a provider (you'll also need to add credentials to .dev.vars and production secrets).
 * Set enabled: false to hide a provider from the UI and disable it on the server.
 */

export type OAuthProviderName = 'google' | 'discord' | 'twitch';

export interface OAuthProviderConfig {
  enabled: boolean;
  name: string;
}

export type OAuthConfig = {
  [K in OAuthProviderName]: OAuthProviderConfig;
};

// Configure which OAuth providers to enable
export const oauthConfig: OAuthConfig = {
  google: {
    enabled: true,
    name: 'Google',
  },
  discord: {
    enabled: false,
    name: 'Discord',
  },
  twitch: {
    enabled: false,
    name: 'Twitch',
  },
};

// Helper to get enabled providers
export function getEnabledProviders(): OAuthProviderName[] {
  return (Object.keys(oauthConfig) as OAuthProviderName[]).filter(
    (provider) => oauthConfig[provider].enabled
  );
}

// Helper to check if a provider is enabled
export function isProviderEnabled(provider: OAuthProviderName): boolean {
  return oauthConfig[provider]?.enabled ?? false;
}
