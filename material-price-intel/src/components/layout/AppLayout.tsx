import { Outlet, NavLink } from "react-router";
import { LayoutDashboard, Upload, FileText, Layers, Search, BarChart3, FolderKanban, LogOut, Palette, Calculator } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/quotes", label: "Quotes", icon: FileText },
  { to: "/materials", label: "Materials", icon: Layers },
  { to: "/search", label: "Search", icon: Search },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/projects", label: "Projects", icon: FolderKanban },
];

const adminItems = [
  { to: "/admin/catalog", label: "Catalog", icon: Palette },
  { to: "/admin/estimator", label: "Estimator", icon: Calculator },
];

export function AppLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="no-print w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-lg font-semibold text-foreground">
            Material Price Intel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ross Built Custom Homes
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}

          {/* Admin section */}
          <div className="pt-4 mt-4 border-t border-border">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Admin
            </p>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-border space-y-2">
          <p className="text-sm text-muted-foreground truncate">
            {user?.email}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
