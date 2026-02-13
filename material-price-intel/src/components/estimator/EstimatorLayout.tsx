import type { ReactNode } from "react";
import { Building2, Phone } from "lucide-react";

type Props = { children: ReactNode };

export function EstimatorLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50/60 via-white to-brand-50/40">
      <header className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white py-5 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
              <Building2 className="h-5 w-5 text-brand-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Ross Built Custom Homes
              </h1>
              <p className="text-brand-300/70 text-xs tracking-wide">
                Bradenton &amp; Sarasota, FL
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <a
              href="tel:+19417787600"
              className="flex items-center gap-1.5 text-xs text-brand-300/80 hover:text-white transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              (941) 778-7600
            </a>
            <span className="text-xs font-semibold text-brand-100 bg-brand-500/30 px-3 py-1 rounded-full border border-brand-400/30">
              Free Estimate
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        {children}
      </main>

      <footer className="bg-brand-950 text-brand-300/60 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <p className="text-xs">
            This estimate is for planning purposes only and does not constitute a
            bid or contract.
          </p>
          <p className="text-xs">
            Actual costs may vary based on site conditions, material availability,
            and design complexity.
          </p>
          <div className="flex items-center justify-center gap-2 pt-3">
            <Building2 className="h-3.5 w-3.5 text-brand-500/50" />
            <p className="text-xs text-brand-400/40">
              &copy; {new Date().getFullYear()} Ross Built Custom Homes &mdash;
              Licensed &amp; Insured &mdash; EST. 2006
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
