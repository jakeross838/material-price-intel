import { useState } from "react";
import { Loader2, Send, Calendar, CheckCircle2, Shield } from "lucide-react";
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
      <div className="text-center py-12 px-6 bg-gradient-to-br from-brand-50 to-brand-100/50 rounded-2xl border border-brand-200 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100">
          <CheckCircle2 className="h-8 w-8 text-brand-600" />
        </div>
        <h3 className="text-2xl font-bold text-brand-900">
          Thank you, {name.split(" ")[0]}!
        </h3>
        <p className="text-brand-700 max-w-md mx-auto">
          We've received your estimate request. A member of our team will reach
          out within 24 hours to discuss your custom home project.
        </p>
        <p className="text-sm text-brand-400">
          Your estimate: ${estimateLow.toLocaleString()} &ndash; $
          {estimateHigh.toLocaleString()}
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-200/60 shadow-sm">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-400" />

      <div className="p-6 sm:p-8 bg-gradient-to-b from-brand-50/80 to-white space-y-6">
        <div className="text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-brand-900">
            Like what you see? Let's talk.
          </h3>
          <p className="text-brand-600/70 mt-2 text-sm sm:text-base">
            Get a more precise estimate from our team &mdash; typically within 10% of
            this number.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="lead-name" className="text-sm font-medium">
                Name <span className="text-brand-500">*</span>
              </Label>
              <Input
                id="lead-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                required
                className="h-11 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-email" className="text-sm font-medium">
                Email <span className="text-brand-500">*</span>
              </Label>
              <Input
                id="lead-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                className="h-11 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-phone" className="text-sm font-medium">
                Phone
              </Label>
              <Input
                id="lead-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(941) 778-7600"
                className="h-11 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-message" className="text-sm font-medium">
                Message
              </Label>
              <Input
                id="lead-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your project..."
                className="h-11 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={!name.trim() || !email.trim() || !orgId || submitLead.isPending}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-lg hover:shadow-xl transition-all"
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
                className="w-full h-12 text-base font-medium bg-white hover:bg-brand-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule a Call
              </Button>
            </a>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-brand-400">
            <Shield className="h-3.5 w-3.5" />
            <span>Your info is private &mdash; we never share or sell your data.</span>
          </div>

          {submitLead.isError && (
            <p className="text-sm text-red-600 text-center">
              Something went wrong. Please try again or call us directly.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
