import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Material Price Intelligence System
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">
          Welcome to Material Price Intel
        </h3>
        <p className="text-muted-foreground mb-4">
          Upload supplier quotes, extract pricing data with AI, and compare
          costs across suppliers and projects.
        </p>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Get Started
        </Button>
      </div>
    </div>
  );
}
