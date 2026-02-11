import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProject } from "@/hooks/useProjects";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();

  // Form state
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bradenton");
  const [state, setState] = useState("FL");
  const [squareFootage, setSquareFootage] = useState("");
  const [targetBudget, setTargetBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [estimatedCompletion, setEstimatedCompletion] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const result = await createProject.mutateAsync({
      name: name.trim(),
      client_name: clientName.trim() || null,
      client_email: clientEmail.trim() || null,
      client_phone: clientPhone.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      square_footage: squareFootage ? parseFloat(squareFootage) : null,
      target_budget: targetBudget ? parseFloat(targetBudget) : null,
      start_date: startDate || null,
      estimated_completion: estimatedCompletion || null,
      notes: notes.trim() || null,
    });

    navigate(`/projects/${result.id}`);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">New Project</h2>
        <p className="text-muted-foreground mt-2">
          Create a new custom home project
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project name (required) */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Smith Residence"
                required
              />
            </div>

            {/* Client info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Client Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name</Label>
                  <Input
                    id="client_name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email">Client Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_phone">Client Phone</Label>
                  <Input
                    id="client_phone"
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(941) 555-0123"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Project Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Project details */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Project Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="square_footage">Square Footage</Label>
                  <Input
                    id="square_footage"
                    type="number"
                    min="0"
                    step="1"
                    value={squareFootage}
                    onChange={(e) => setSquareFootage(e.target.value)}
                    placeholder="2,500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_budget">Target Budget ($)</Label>
                  <Input
                    id="target_budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(e.target.value)}
                    placeholder="500,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_completion">Est. Completion</Label>
                  <Input
                    id="estimated_completion"
                    type="date"
                    value={estimatedCompletion}
                    onChange={(e) => setEstimatedCompletion(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Additional project notes..."
              />
            </div>

            {/* Error message */}
            {createProject.isError && (
              <p className="text-sm text-red-600">
                {createProject.error?.message ?? "Failed to create project"}
              </p>
            )}

            {/* Submit */}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={createProject.isPending || !name.trim()}>
                {createProject.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Project
              </Button>
              <Button variant="outline" asChild>
                <Link to="/projects">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
