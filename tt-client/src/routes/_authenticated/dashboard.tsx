import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProfileDropdown } from "@/components/profile-dropdown";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { auth } = Route.useRouteContext();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <ProfileDropdown
            user={{
              name: auth.session?.user?.name || undefined,
              email: auth.session?.user?.email || undefined,
              image: auth.session?.user?.image || undefined,
            }}
          />
        </div>

        <Outlet />
      </div>
    </div>
  );
}
