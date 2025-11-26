import { createContext, useContext, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "./auth";

interface AuthContextType {
  session: ReturnType<typeof useSession>["data"];
  isPending: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const value: AuthContextType = {
    session: session ?? null,
    isPending: isPending,
    isAuthenticated: !!session,
  };

  // Show loading state while initial session is being fetched
  // This prevents the router from redirecting before we know auth status
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-12 animate-spin mx-auto" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
