import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  Settings,
  Palette,
  Calculator,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import admin content components
import { CatalogContent, EstimatorConfigContent, LeadsContent } from "@/components/admin";

type TabId = "catalog" | "estimator" | "leads";

const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "catalog", label: "Catalog", icon: Palette },
  { id: "estimator", label: "Pricing", icon: Calculator },
  { id: "leads", label: "Leads", icon: Users },
];

export function AdminHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId) || "catalog";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    setSearchParams({ tab });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Admin</h2>
            <p className="text-sm text-muted-foreground">
              Manage catalog, estimator pricing, and leads
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1" aria-label="Admin tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "catalog" && <CatalogContent />}
        {activeTab === "estimator" && <EstimatorConfigContent />}
        {activeTab === "leads" && <LeadsContent />}
      </div>
    </div>
  );
}
