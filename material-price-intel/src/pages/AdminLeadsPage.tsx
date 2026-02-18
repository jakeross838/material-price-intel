import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Users,
  ChevronDown,
  ChevronUp,
  Save,
  Mail,
  Phone,
  Calendar,
  Home,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useEstimatorLeads, useUpdateLead } from "@/hooks/useEstimatorLeads";
import { formatDistanceToNow } from "date-fns";
import type { UserProfile, EstimatorLead, EstimatorLeadStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: EstimatorLeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "archived", label: "Archived" },
];

const STATUS_COLORS: Record<EstimatorLeadStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  converted: "bg-brand-100 text-brand-800",
  archived: "bg-gray-100 text-gray-600",
};

function fmt(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export function AdminLeadsPage() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<EstimatorLeadStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const { data: leads, isLoading: leadsLoading } = useEstimatorLeads();

  if (profileLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ShieldCheck className="h-10 w-10 mb-3 text-red-400" />
        <p className="text-lg font-semibold text-foreground">Access Denied</p>
        <p className="text-sm mt-1">Admin role required to view leads.</p>
      </div>
    );
  }

  const filteredLeads = leads?.filter(
    (l) => filterStatus === "all" || l.status === filterStatus
  ) ?? [];

  const statusCounts: Record<string, number> = { all: leads?.length ?? 0 };
  for (const l of leads ?? []) {
    statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estimator Leads</h1>
            <p className="text-sm text-muted-foreground">
              {leads?.length ?? 0} total leads
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUS_OPTIONS.map((s) => s.value)] as const).map((status) => {
          const label = status === "all" ? "All" : STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
          const count = statusCounts[status] ?? 0;
          const isActive = filterStatus === status;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {label}
              <span className={`ml-1.5 text-xs ${isActive ? "opacity-80" : "opacity-60"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Leads table */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No leads found.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Contact</th>
                <th className="px-4 py-3 text-right font-semibold">Estimate</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  expanded={expandedId === lead.id}
                  onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Sub-component: Individual lead row with expandable details
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// V2 estimate details display
// ------------------------------------------------------------------

function DetailCell({ label, value }: { label: string; value: string | number | boolean }) {
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div className="bg-background rounded-lg border p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold capitalize">{display}</p>
    </div>
  );
}

function V2EstimateDetails({ params }: { params: Record<string, unknown> }) {
  const p = params as Record<string, string | number | boolean>;
  const features: string[] = [];
  if (p.pool && p.pool !== 'none') features.push(`Pool (${p.pool})`);
  if (p.elevator && p.elevator !== 'none') features.push(`Elevator (${p.elevator})`);
  if (p.outdoorKitchen) features.push('Outdoor Kitchen');
  if (p.fireplace && p.fireplace !== 'none') features.push(`Fireplace (${p.fireplace})`);
  if (p.smartHome && p.smartHome !== 'none') features.push(`Smart Home (${p.smartHome})`);
  if (p.generator) features.push('Generator');
  if (p.seawall) features.push('Seawall');
  if (p.screenedPorch) features.push('Screened Porch');
  if (Number(p.deckSqft) > 0) features.push(`Deck (${p.deckSqft} SF)`);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <DetailCell label="Sq Ft" value={Number(p.sqft).toLocaleString()} />
        <DetailCell label="Bed / Bath" value={`${p.bedrooms} / ${p.bathrooms}`} />
        <DetailCell label="Stories" value={p.stories} />
        <DetailCell label="Location" value={String(p.location).replace(/_/g, ' ')} />
        <DetailCell label="Arch Style" value={String(p.archStyle).replace(/_/g, ' ')} />
        <DetailCell label="Finish Level" value={p.finishLevel} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <DetailCell label="Cladding" value={String(p.claddingType).replace(/_/g, ' ')} />
        <DetailCell label="Roof" value={String(p.roofType).replace(/_/g, ' ')} />
        <DetailCell label="Windows" value={String(p.windowGrade).replace(/_/g, ' ')} />
        <DetailCell label="Flooring" value={String(p.flooringType).replace(/_/g, ' ')} />
        <DetailCell label="Countertops" value={String(p.countertopMaterial).replace(/_/g, ' ')} />
        <DetailCell label="Elevated" value={!!p.elevatedConstruction} />
      </div>
      {features.length > 0 && (
        <div className="bg-background rounded-lg border p-3">
          <p className="text-[10px] text-muted-foreground">Special Features</p>
          <p className="text-xs font-medium mt-0.5">{features.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

function LegacyEstimateDetails({ params }: { params: Record<string, unknown> }) {
  const p = params as Record<string, string | number | string[]>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <DetailCell label="Sq Ft" value={Number(p.square_footage).toLocaleString()} />
      <DetailCell label="Bed / Bath" value={`${p.bedrooms} / ${p.bathrooms}`} />
      <DetailCell label="Stories" value={p.stories} />
      <DetailCell label="Style" value={p.style} />
      <DetailCell label="Finish" value={p.finish_level} />
      {Array.isArray(p.special_features) && p.special_features.length > 0 && (
        <div className="bg-background rounded-lg border p-3 col-span-2 sm:col-span-1">
          <p className="text-[10px] text-muted-foreground">Features</p>
          <p className="text-xs font-medium mt-0.5">{p.special_features.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Sub-component: Individual lead row with expandable details
// ------------------------------------------------------------------

function LeadRow({
  lead,
  expanded,
  onToggle,
}: {
  lead: EstimatorLead;
  expanded: boolean;
  onToggle: () => void;
}) {
  const updateLead = useUpdateLead();
  const [editNotes, setEditNotes] = useState(lead.admin_notes ?? "");
  const [editStatus, setEditStatus] = useState<EstimatorLeadStatus>(lead.status);
  const [dirty, setDirty] = useState(false);

  function handleSave() {
    updateLead.mutate(
      { id: lead.id, status: editStatus, admin_notes: editNotes },
      {
        onSuccess: () => setDirty(false),
      }
    );
  }

  const params = lead.estimate_params;
  const isV2 = params && (params as Record<string, unknown>)._version === 'v2';

  return (
    <>
      <tr
        className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${
          expanded ? "bg-muted/20" : ""
        }`}
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{lead.contact_name}</p>
            {isV2 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                V2
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {lead.contact_email}
            </span>
            {lead.contact_phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {lead.contact_phone}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
          {fmt(lead.estimate_low)} – {fmt(lead.estimate_high)}
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              STATUS_COLORS[lead.status]
            }`}
          >
            {lead.status}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">
          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
        </td>
        <td className="px-4 py-3">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b bg-muted/10">
          <td colSpan={6} className="px-4 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Estimate details */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Estimate Details
                  {isV2 && <span className="ml-2 text-amber-600">(V2 Configurator)</span>}
                </p>

                {isV2 ? (
                  <V2EstimateDetails params={params as Record<string, unknown>} />
                ) : (
                  <LegacyEstimateDetails params={params} />
                )}

                {lead.contact_message && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      Message
                    </p>
                    <p className="text-sm text-foreground bg-background rounded-lg border p-3">
                      {lead.contact_message}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Submitted {new Date(lead.created_at).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {/* Right: Status + Notes */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Manage Lead
                </p>

                {/* Status dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => {
                      setEditStatus(e.target.value as EstimatorLeadStatus);
                      setDirty(true);
                    }}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Admin notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Admin Notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => {
                      setEditNotes(e.target.value);
                      setDirty(true);
                    }}
                    rows={3}
                    placeholder="Internal notes about this lead..."
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
                  />
                </div>

                {/* Save button */}
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  disabled={!dirty || updateLead.isPending}
                >
                  {updateLead.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
