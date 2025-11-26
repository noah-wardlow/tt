import { StrictMode, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { AuthProvider, useAuth } from "./lib/auth-context";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";

const queryClient = new QueryClient();

export interface RouterContext {
  queryClient: QueryClient;
  auth: ReturnType<typeof useAuth>;
}

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    // This will be set properly when wrapped with AuthProvider
    auth: undefined!,
  },
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const auth = useAuth();

  // Invalidate router when auth state changes to trigger redirects
  useEffect(() => {
    router.invalidate();
  }, [auth.isAuthenticated]);

  return <RouterProvider router={router} context={{ queryClient, auth }} />;
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <InnerApp />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
