import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import type { EstimatorConfig, FinishLevel } from "@/lib/types";

const FINISH_LEVELS: { value: FinishLevel; label: string }[] = [
  { value: "builder", label: "Builder Grade" },
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
  { value: "luxury", label: "Luxury" },
];

function fmt(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(val);
}

export function EstimatorConfigContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FinishLevel>("standard");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLow, setEditLow] = useState("");
  const [editHigh, setEditHigh] = useState("");

  const { data: configs, isLoading } = useQuery({
    queryKey: ["admin_estimator_config", activeTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimator_config")
        .select("*")
        .eq("finish_level", activeTab)
        .order("sort_order");
      if (error) throw error;
      return data as EstimatorConfig[];
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({
      id,
      cost_per_sqft_low,
      cost_per_sqft_high,
    }: {
      id: string;
      cost_per_sqft_low: number;
      cost_per_sqft_high: number;
    }) => {
      const { error } = await supabase
        .from("estimator_config")
        .update({ cost_per_sqft_low, cost_per_sqft_high })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_estimator_config"] });
      queryClient.invalidateQueries({ queryKey: ["estimator_config"] });
      setEditingId(null);
    },
  });

  function startEdit(config: EstimatorConfig) {
    setEditingId(config.id);
    setEditLow(String(config.cost_per_sqft_low));
    setEditHigh(String(config.cost_per_sqft_high));
  }

  function saveEdit(id: string) {
    const low = parseFloat(editLow);
    const high = parseFloat(editHigh);
    if (isNaN(low) || isNaN(high) || low < 0 || high < 0 || low > high) return;
    updateConfig.mutate({ id, cost_per_sqft_low: low, cost_per_sqft_high: high });
  }

  return (
    <div className="space-y-4">
      {/* Finish Level Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {FINISH_LEVELS.map((fl) => (
          <button
            key={fl.value}
            onClick={() => {
              setActiveTab(fl.value);
              setEditingId(null);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === fl.value
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {fl.label}
          </button>
        ))}
      </div>

      {/* Config Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cost per Square Foot</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-left font-semibold w-8">#</th>
                    <th className="px-4 py-3 text-left font-semibold">Category</th>
                    <th className="px-4 py-3 text-right font-semibold">Low ($/sqft)</th>
                    <th className="px-4 py-3 text-right font-semibold">High ($/sqft)</th>
                    <th className="px-4 py-3 text-right font-semibold">Est. 2,500 sqft</th>
                    <th className="px-4 py-3 text-center font-semibold w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {configs?.map((config, idx) => {
                    const isEditing = editingId === config.id;
                    const estLow = config.cost_per_sqft_low * 2500;
                    const estHigh = config.cost_per_sqft_high * 2500;

                    return (
                      <tr
                        key={config.id}
                        className={`border-b last:border-0 transition-colors ${
                          isEditing ? "bg-primary/5" : idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                        }`}
                      >
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">
                          {config.sort_order}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{config.display_name}</div>
                          {config.notes && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {config.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              value={editLow}
                              onChange={(e) => setEditLow(e.target.value)}
                              className="w-24 h-8 text-right text-sm ml-auto"
                              autoFocus
                            />
                          ) : (
                            <span className="tabular-nums">${config.cost_per_sqft_low}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              value={editHigh}
                              onChange={(e) => setEditHigh(e.target.value)}
                              className="w-24 h-8 text-right text-sm ml-auto"
                            />
                          ) : (
                            <span className="tabular-nums">${config.cost_per_sqft_high}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground tabular-nums text-xs">
                          {isEditing
                            ? `${fmt(parseFloat(editLow || "0") * 2500)} – ${fmt(parseFloat(editHigh || "0") * 2500)}`
                            : `${fmt(estLow)} – ${fmt(estHigh)}`}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                className="h-7"
                                onClick={() => saveEdit(config.id)}
                                disabled={updateConfig.isPending}
                              >
                                {updateConfig.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Save className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7"
                              onClick={() => startEdit(config)}
                            >
                              Edit
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {updateConfig.isError && (
        <p className="text-sm text-destructive">
          Failed to save. Make sure you have admin permissions.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Changes apply to the public estimator immediately. The "Est. 2,500 sqft" column shows a preview.
      </p>
    </div>
  );
}
