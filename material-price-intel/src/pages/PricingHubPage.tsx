import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  FileText,
  Layers,
  Search,
  BarChart3,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import existing components/logic from the individual pages
import { QuotesListContent } from "@/components/pricing/QuotesListContent";
import { MaterialsContent } from "@/components/pricing/MaterialsContent";
import { SearchContent } from "@/components/pricing/SearchContent";
import { ReportsContent } from "@/components/pricing/ReportsContent";

type TabId = "quotes" | "materials" | "search" | "analytics";

const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "quotes", label: "Quotes", icon: FileText },
  { id: "materials", label: "Materials", icon: Layers },
  { id: "search", label: "Price Search", icon: Search },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export function PricingHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId) || "quotes";
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
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Pricing Hub</h2>
            <p className="text-sm text-muted-foreground">
              Manage quotes, materials, search prices, and view analytics
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1" aria-label="Pricing tabs">
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
        {activeTab === "quotes" && <QuotesListContent />}
        {activeTab === "materials" && <MaterialsContent />}
        {activeTab === "search" && <SearchContent />}
        {activeTab === "analytics" && <ReportsContent />}
      </div>
    </div>
  );
}
