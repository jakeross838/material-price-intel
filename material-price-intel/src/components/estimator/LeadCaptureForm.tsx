import { useState } from "react";
import { Loader2, Send, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubmitLead, useEstimatorOrgId } from "@/hooks/useEstimator";
import type { EstimateParams, EstimateBreakdownItem } from "@/lib/types";

type Props = {
  estimateParams: EstimateParams;
  estimateLow: number;
  estimateHigh: number;
  breakdown: EstimateBreakdownItem[];
};

export function LeadCaptureForm({
  estimateParams,
  estimateLow,
  estimateHigh,
  breakdown,
}: Props) {
  const submitLead = useSubmitLead();
  const { data: orgId } = useEstimatorOrgId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !name.trim() || !email.trim()) return;

    await submitLead.mutateAsync({
      organization_id: orgId,
      contact_name: name.trim(),
      contact_email: email.trim(),
      contact_phone: phone.trim() || undefined,
      contact_message: message.trim() || undefined,
      estimate_params: estimateParams,
      estimate_low: estimateLow,
      estimate_high: estimateHigh,
      estimate_breakdown: breakdown,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        <h3 className="text-2xl font-bold text-slate-900">
          Thank you, {name.split(" ")[0]}!
        </h3>
        <p className="text-slate-500 max-w-md mx-auto">
          We've received your estimate request. A member of our team will reach
          out within 24 hours to discuss your custom home project.
        </p>
        <p className="text-sm text-slate-400">
          Your estimate: ${estimateLow.toLocaleString()} &ndash; $
          {estimateHigh.toLocaleString()}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-2xl border p-6 sm:p-8 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-slate-900">
          Like what you see? Let's talk.
        </h3>
        <p className="text-slate-500 mt-1 text-sm">
          Get a more precise estimate from our team — typically within 10% of
          this number.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="lead-name" className="text-sm">
              Name *
            </Label>
            <Input
              id="lead-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-email" className="text-sm">
              Email *
            </Label>
            <Input
              id="lead-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-phone" className="text-sm">
              Phone
            </Label>
            <Input
              id="lead-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(941) 555-0123"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-message" className="text-sm">
              Message
            </Label>
            <Input
              id="lead-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your project..."
              className="h-10"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            disabled={!name.trim() || !email.trim() || !orgId || submitLead.isPending}
            className="flex-1 h-12 text-base bg-slate-900 hover:bg-slate-800"
          >
            {submitLead.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Get My Free Consultation
              </>
            )}
          </Button>
          <a
            href="https://calendly.com/rossbuilt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule a Call
            </Button>
          </a>
        </div>

        {submitLead.isError && (
          <p className="text-sm text-red-600 text-center">
            Something went wrong. Please try again or call us directly.
          </p>
        )}
      </form>
    </div>
  );
}
