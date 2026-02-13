import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Save,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { EstimatorConfig, FinishLevel, UserProfile } from "@/lib/types";

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

export function AdminEstimatorPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FinishLevel>("standard");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLow, setEditLow] = useState("");
  const [editHigh, setEditHigh] = useState("");

  // Check admin role
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user_profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user,
  });

  // Fetch all config for active tab
  const { data: configs, isLoading: configLoading } = useQuery({
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

  // Update mutation
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

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Checking permissions...
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-sm">
          You need admin privileges to manage estimator pricing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-brand-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              Estimator Pricing
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Edit cost-per-sqft rates for each category and finish level. Changes
            are reflected immediately on the public estimator.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full border border-brand-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin
        </div>
      </div>

      {/* Finish Level Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {FINISH_LEVELS.map((fl) => (
          <button
            key={fl.value}
            onClick={() => {
              setActiveTab(fl.value);
              setEditingId(null);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === fl.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {fl.label}
          </button>
        ))}
      </div>

      {/* Config Table */}
      {configLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading pricing data...
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500">
                <th className="px-4 py-3 text-left font-semibold w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-right font-semibold">
                  Low ($/sqft)
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  High ($/sqft)
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  Est. for 2,500 sqft
                </th>
                <th className="px-4 py-3 text-center font-semibold w-24">
                  Actions
                </th>
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
                      isEditing ? "bg-brand-50/50" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-400 tabular-nums">
                      {config.sort_order}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {config.display_name}
                      </div>
                      {config.notes && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
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
                        <span className="tabular-nums text-slate-700">
                          ${config.cost_per_sqft_low}
                        </span>
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
                        <span className="tabular-nums text-slate-700">
                          ${config.cost_per_sqft_high}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 tabular-nums text-xs">
                      {isEditing
                        ? `${fmt(parseFloat(editLow || "0") * 2500)} – ${fmt(parseFloat(editHigh || "0") * 2500)}`
                        : `${fmt(estLow)} – ${fmt(estHigh)}`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="xs"
                            onClick={() => saveEdit(config.id)}
                            disabled={updateConfig.isPending}
                            className="bg-brand-600 hover:bg-brand-500"
                          >
                            {updateConfig.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
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

      {updateConfig.isError && (
        <p className="text-sm text-red-600">
          Failed to save. Make sure you have admin permissions.
        </p>
      )}

      <p className="text-xs text-slate-400">
        Tip: Changes apply to the public estimator immediately. The "Est. for
        2,500 sqft" column shows a preview of what a homeowner would see for a
        mid-size home.
      </p>
    </div>
  );
}
