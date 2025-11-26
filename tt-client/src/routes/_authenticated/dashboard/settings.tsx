import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  component: Settings,
});

function Settings() {
  const { auth } = Route.useRouteContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>
          Manage your account settings and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Profile Information</p>
          <div className="mt-2 space-y-1">
            <p>
              <span className="font-semibold">Name:</span> {auth.session?.user?.name || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {auth.session?.user?.email || "N/A"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
