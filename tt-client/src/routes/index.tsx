import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "../logo.svg";
import { useSuspenseQuery } from "@tanstack/react-query";
import { usersQueryOptions } from "@/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { Suspense } from "react";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) => {
    try {
      queryClient.ensureQueryData(usersQueryOptions);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  },
  component: App,
});

function App() {
  const { auth } = Route.useRouteContext();

  return (
    <div className="text-center">
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)] gap-6">
        <img
          src={logo}
          className="h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
          alt="logo"
        />

        <div className="flex flex-col gap-4 items-center">
          {auth.isAuthenticated ? (
            <div className="flex flex-col gap-3 items-center">
              <div className="text-base">
                Welcome, {auth.session?.user?.name || auth.session?.user?.email}
                !
              </div>
              <Button asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-base mb-2">You are not signed in</p>
              <Button asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
        <ErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>
            <UsersPanel />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    // Optionally log
    console.error("UsersPanel error:", error, info);
  }
  handleReset = () => this.setState({ hasError: false, error: null });
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl w-full text-left text-white/90">
          <div className="mb-2 font-semibold">Failed to load users.</div>
          <pre className="text-xs opacity-80 overflow-auto max-h-48">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            className="mt-3 px-3 py-1 rounded bg-white/10 hover:bg-white/20"
            onClick={this.handleReset}
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

function UsersPanel() {
  const { data: users, refetch } = useSuspenseQuery(usersQueryOptions);
  return (
    <>
      <div className="flex gap-4">
        <Button variant="secondary" onClick={() => refetch()}>
          Refresh Users
        </Button>
      </div>
      <Card className="max-w-xl w-full bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-left text-base text-white">
            <span className="font-semibold">/users</span>{" "}
            <span className="opacity-80">(GET)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-left text-sm whitespace-pre-wrap break-all text-white">
            {JSON.stringify(users, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </>
  );
}
