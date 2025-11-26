import type { OAuthProviderName } from "gg-shared/oauth-config";

type AuthEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  TWITCH_CLIENT_ID?: string;
  TWITCH_CLIENT_SECRET?: string;
  BETTER_AUTH_SECRET?: string;
};

export function getClientIdEnvVar(provider: OAuthProviderName): keyof AuthEnv {
  return `${provider.toUpperCase()}_CLIENT_ID` as keyof AuthEnv;
}

export function getClientSecretEnvVar(provider: OAuthProviderName): keyof AuthEnv {
  return `${provider.toUpperCase()}_CLIENT_SECRET` as keyof AuthEnv;
}

// Profile mappers for each provider
export const profileMappers: Record<OAuthProviderName, (profile: any) => { username?: string }> = {
  google: (profile) => ({
    username: profile.email?.split("@")[0] || profile.name,
  }),
  discord: (profile) => ({
    username: profile.username || profile.global_name,
  }),
  twitch: (profile) => ({
    username: profile.login || profile.display_name,
  }),
};
