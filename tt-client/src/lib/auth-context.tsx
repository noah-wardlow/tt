import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { sessionQueryOptions } from "./auth";

type Session = Awaited<ReturnType<typeof sessionQueryOptions.queryFn>>;

interface AuthContextType {
  session: Session | null;
  isPending: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Uses TanStack Query - data is prefetched in __root.tsx beforeLoad
  // so there's no loading flash on initial render
  const { data: session, isPending } = useQuery(sessionQueryOptions);

  const value: AuthContextType = {
    session: session ?? null,
    isPending,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
