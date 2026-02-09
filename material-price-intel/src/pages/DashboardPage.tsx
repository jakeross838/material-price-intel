import { useAuth } from "@/hooks/useAuth";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Welcome, {user?.email}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">
          Material Price Intelligence System
        </h3>
        <p className="text-muted-foreground mb-4">
          Upload supplier quotes to build your pricing database. Every quote
          logged makes the next negotiation stronger.
        </p>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Quote
        </Button>
      </div>
    </div>
  );
}
