import { useState } from 'react';
import { Loader2, Send, Calendar, CheckCircle2, Shield, Mail } from 'lucide-react';
import { useSubmitLeadV2, useSendV2EstimateEmail } from '@/hooks/useSubmitLeadV2';
import { useEstimatorOrgId } from '@/hooks/useEstimator';
import { fmtCurrency } from '@/lib/estimatorV2/types';
import { ARCH_STYLE_META } from '@/lib/estimatorV2/types';
import type { V2EstimateResult } from '@/lib/estimatorV2/types';

type Props = {
  estimate: V2EstimateResult;
  onLeadCaptured?: () => void;
};

export function LeadCaptureFormV2({ estimate, onLeadCaptured }: Props) {
  const submitLead = useSubmitLeadV2();
  const sendEmail = useSendV2EstimateEmail();
  const { data: orgId } = useEstimatorOrgId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const input = estimate.input;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !name.trim() || !email.trim()) return;

    // 1. Save lead to DB (critical — must complete)
    await submitLead.mutateAsync({
      organization_id: orgId,
      contact_name: name.trim(),
      contact_email: email.trim(),
      contact_phone: phone.trim() || undefined,
      contact_message: message.trim() || undefined,
      estimate_input: input,
      estimate_low: estimate.totalLow,
      estimate_high: estimate.totalHigh,
    });

    // 2. Send emails — fire-and-forget (don't block on failure)
    sendEmail.mutate({
      contact_name: name.trim(),
      contact_email: email.trim(),
      contact_phone: phone.trim() || undefined,
      contact_message: message.trim() || undefined,
      estimate_low: estimate.totalLow,
      estimate_high: estimate.totalHigh,
      sqft: input.sqft,
      stories: input.stories,
      style: ARCH_STYLE_META[input.archStyle].label,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      room_summaries: [
        { roomName: 'Full Home', finishLevel: input.finishLevel, low: estimate.totalLow, high: estimate.totalHigh },
      ],
    });

    // 3. Update UI
    setSubmitted(true);
    onLeadCaptured?.();
  }

  if (submitted) {
    return (
      <div className="text-center py-12 px-6 bg-gradient-to-br from-[var(--ev2-navy-800)] to-[var(--ev2-navy-900)] rounded-xl border border-[var(--ev2-gold)]/30 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--ev2-gold)]/15">
          <CheckCircle2 className="h-8 w-8 text-[var(--ev2-gold)]" />
        </div>
        <h3 className="text-2xl font-bold text-[var(--ev2-text)]">
          Thank you, {name.split(' ')[0]}!
        </h3>
        <p className="text-[var(--ev2-text-muted)] max-w-md mx-auto">
          We've sent your full estimate to{' '}
          <strong className="text-[var(--ev2-text)]">{email}</strong>. A member of our
          team will reach out within 24 hours to discuss your custom home project.
        </p>
        <div className="inline-flex items-center gap-2 text-xs text-[var(--ev2-text-dim)] bg-[var(--ev2-navy-900)] rounded-full px-4 py-2 border border-[var(--ev2-border)]">
          <Mail className="h-3.5 w-3.5" />
          Check your inbox for the full breakdown
        </div>
        <p className="text-sm text-[var(--ev2-text-dim)]">
          Your estimate: {fmtCurrency(estimate.totalLow)} &ndash; {fmtCurrency(estimate.totalHigh)}
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--ev2-gold)]/30">
      {/* Gold accent bar */}
      <div className="h-1 bg-gradient-to-r from-[var(--ev2-gold)]/60 via-[var(--ev2-gold)] to-[var(--ev2-gold)]/60" />

      <div className="p-6 sm:p-8 bg-gradient-to-b from-[var(--ev2-navy-800)] to-[var(--ev2-surface)] space-y-6">
        <div className="text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-[var(--ev2-text)]">
            Like what you see? Let's talk.
          </h3>
          <p className="text-[var(--ev2-text-muted)] mt-2 text-sm sm:text-base">
            Get a more precise estimate from our team &mdash; typically within 10% of
            this number.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="v2-lead-name" className="text-xs font-medium text-[var(--ev2-text-muted)]">
                Name <span className="text-[var(--ev2-gold)]">*</span>
              </label>
              <input
                id="v2-lead-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                required
                className="w-full h-11 px-3 rounded-lg bg-[var(--ev2-navy-900)] border border-[var(--ev2-border)]
                  text-sm text-[var(--ev2-text)] placeholder:text-[var(--ev2-text-dim)]
                  focus:outline-none focus:border-[var(--ev2-gold)]/50"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="v2-lead-email" className="text-xs font-medium text-[var(--ev2-text-muted)]">
                Email <span className="text-[var(--ev2-gold)]">*</span>
              </label>
              <input
                id="v2-lead-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                className="w-full h-11 px-3 rounded-lg bg-[var(--ev2-navy-900)] border border-[var(--ev2-border)]
                  text-sm text-[var(--ev2-text)] placeholder:text-[var(--ev2-text-dim)]
                  focus:outline-none focus:border-[var(--ev2-gold)]/50"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="v2-lead-phone" className="text-xs font-medium text-[var(--ev2-text-muted)]">
                Phone
              </label>
              <input
                id="v2-lead-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(941) 778-7600"
                className="w-full h-11 px-3 rounded-lg bg-[var(--ev2-navy-900)] border border-[var(--ev2-border)]
                  text-sm text-[var(--ev2-text)] placeholder:text-[var(--ev2-text-dim)]
                  focus:outline-none focus:border-[var(--ev2-gold)]/50"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="v2-lead-message" className="text-xs font-medium text-[var(--ev2-text-muted)]">
                Message
              </label>
              <input
                id="v2-lead-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your project..."
                className="w-full h-11 px-3 rounded-lg bg-[var(--ev2-navy-900)] border border-[var(--ev2-border)]
                  text-sm text-[var(--ev2-text)] placeholder:text-[var(--ev2-text-dim)]
                  focus:outline-none focus:border-[var(--ev2-gold)]/50"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={!name.trim() || !email.trim() || !orgId || submitLead.isPending}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-lg text-base font-semibold
                text-[var(--ev2-navy-950)] bg-[var(--ev2-gold)] hover:bg-[var(--ev2-gold-light)]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors shadow-lg shadow-[var(--ev2-gold-glow)]"
            >
              {submitLead.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Get My Free Consultation
                </>
              )}
            </button>
            <a
              href="https://calendly.com/rossbuilt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <button
                type="button"
                className="w-full h-12 flex items-center justify-center gap-2 rounded-lg text-base font-medium
                  text-[var(--ev2-text-muted)] bg-[var(--ev2-surface)] hover:bg-[var(--ev2-surface-hover)]
                  border border-[var(--ev2-border)] transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Schedule a Call
              </button>
            </a>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--ev2-text-dim)]">
            <Shield className="h-3.5 w-3.5" />
            <span>Your info is private &mdash; we never share or sell your data.</span>
          </div>

          {submitLead.isError && (
            <p className="text-sm text-red-400 text-center">
              Something went wrong. Please try again or call us directly.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
