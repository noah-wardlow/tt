import { createFileRoute, redirect } from "@tanstack/react-router";
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
} from "gg-shared/oauth-config";
import { oauthIcons } from "@/components/oauth-icons";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    return {
      redirect: search.redirect as string | undefined,
    };
  },
  beforeLoad: ({ context, search }) => {
    // If user is already authenticated, redirect to home or the intended page
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || "/" });
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
      const callbackURL = search.redirect
        ? `${window.location.origin}${search.redirect}`
        : window.location.origin;
      await signIn.social({
        provider,
        callbackURL,
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
    </div>
  );
}
