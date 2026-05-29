import { Loader2 } from "lucide-react";
import { useState } from "react";

import { oauthIcons } from "@/components/oauth-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { signIn } from "@/lib/auth";
import {
  getEnabledProviders,
  oauthConfig,
  type OAuthProviderName,
} from "tt-shared/oauth-config";

type LoginModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
  title?: string;
  description?: string;
};

export function LoginModal({
  open,
  onOpenChange,
  redirectTo,
  title = "Sign in to continue",
  description = "Create an account or sign in to continue.",
}: LoginModalProps) {
  const enabledProviders = getEnabledProviders();
  const [loadingProvider, setLoadingProvider] =
    useState<OAuthProviderName | null>(null);

  const handleOAuthLogin = async (provider: OAuthProviderName) => {
    try {
      setLoadingProvider(provider);
      const callbackURL = frontendCallbackUrl(redirectTo);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
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
                      <span className="bg-background px-2 text-muted-foreground">
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
                    <Loader2 className="mr-2 size-5 animate-spin" />
                  ) : (
                    <Icon className="mr-2 size-5" />
                  )}
                  Continue with {config.name}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function frontendCallbackUrl(redirect?: string) {
  const fallback = new URL(window.location.pathname, window.location.origin);
  fallback.search = window.location.search;
  fallback.hash = window.location.hash;

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
