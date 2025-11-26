import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { auth } = Route.useRouteContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome Back!</CardTitle>
        <CardDescription>
          You are authenticated and viewing a protected route.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">User Information</p>
          <div className="mt-2 space-y-1">
            <p>
              <span className="font-semibold">Name:</span> {auth.session?.user?.name || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {auth.session?.user?.email || "N/A"}
            </p>
          </div>
        </div>

        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            This route is protected by the <code className="text-xs bg-muted px-1 py-0.5 rounded">_authenticated</code> layout.
            Only authenticated users can access this page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
