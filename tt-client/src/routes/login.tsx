import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { signIn } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  oauthConfig,
  getEnabledProviders,
  type OAuthProviderName,
} from "tt-shared/oauth-config";
import { oauthIcons } from "@/components/oauth-icons";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface LoginSearch {
  redirect?: string;
  error?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    return {
      redirect: search.redirect as string | undefined,
      error: search.error as string | undefined,
    };
  },
  beforeLoad: ({ context, search }) => {
    if (context.auth.isPending) {
      return;
    }

    if (context.auth.isAuthenticated) {
      throw redirect({ to: frontendRedirectPath(search.redirect) });
    }
  },
  component: Login,
});

function Login() {
  const search = Route.useSearch();
  const auth = useAuth();
  const enabledProviders = getEnabledProviders();
  const [loadingProvider, setLoadingProvider] =
    useState<OAuthProviderName | null>(null);

  const handleOAuthLogin = async (provider: OAuthProviderName) => {
    try {
      setLoadingProvider(provider);
      const callbackURL = frontendCallbackUrl(search.redirect);
      const errorCallbackURL = `${window.location.origin}/login`;
      await signIn.social({
        provider,
        callbackURL,
        errorCallbackURL,
      });
    } catch (error) {
      console.error("OAuth login failed:", error);
      setLoadingProvider(null);
    }
  };

  if (auth.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {search.error ? (
            <div className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">
              Sign-in could not finish. Try again from this page.
            </div>
          ) : null}
          {enabledProviders.map((provider, index) => {
            const config = oauthConfig[provider];
            const Icon = oauthIcons[provider];

            return (
              <div key={provider}>
                {index > 0 && (
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthLogin(provider)}
                  disabled={loadingProvider !== null}
                >
                  {loadingProvider === provider ? (
                    <Loader2 className="size-5 mr-2 animate-spin" />
                  ) : (
                    <Icon className="size-5 mr-2" />
                  )}
                  Continue with {config.name}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Button variant="link" asChild>
        <Link to="/">Home</Link>
      </Button>
    </div>
  );
}

function frontendCallbackUrl(redirect?: string) {
  const fallback = new URL("/", window.location.origin);
  if (!redirect) return fallback.toString();

  try {
    const url = new URL(redirect, window.location.origin);
    if (url.origin !== window.location.origin) {
      return fallback.toString();
    }
    return url.toString();
  } catch {
    return fallback.toString();
  }
}

function frontendRedirectPath(redirect?: string) {
  if (!redirect) return "/";

  try {
    const url = new URL(redirect, "http://app.local");
    if (url.origin !== "http://app.local") {
      return "/";
    }
    return `${url.pathname}${url.search}${url.hash}` || "/";
  } catch {
    return "/";
  }
}
