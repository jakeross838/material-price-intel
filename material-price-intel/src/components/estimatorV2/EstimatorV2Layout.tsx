import { useEffect } from 'react';
import { Phone } from 'lucide-react';

export function EstimatorV2Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.title = 'Build Your Dream Home | Ross Built Custom Homes';
    return () => {
      document.title = 'Material Price Intel';
    };
  }, []);

  return (
    <div className="dark estimator-v2 min-h-screen bg-[var(--ev2-navy-950)] text-[var(--ev2-text)]">
      {/* Gradient background overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-[var(--ev2-navy-900)] via-[var(--ev2-navy-950)] to-black pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-[var(--ev2-border)] bg-[var(--ev2-navy-950)]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-[var(--ev2-gold)] font-bold text-lg tracking-tight">
                Ross Built
              </div>
              <span className="hidden sm:inline text-[var(--ev2-text-dim)] text-xs">
                Custom Homes
              </span>
            </div>
            <a
              href="tel:+19413365263"
              className="flex items-center gap-1.5 text-[var(--ev2-text-muted)] hover:text-[var(--ev2-gold)] transition-colors text-sm"
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">(941) 336-5263</span>
            </a>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--ev2-border)] py-8 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[var(--ev2-text-dim)] text-xs">
              <p>
                &copy; {new Date().getFullYear()} Ross Built Custom Homes. All rights reserved.
              </p>
              <p className="text-center max-w-lg">
                This estimator provides preliminary budget guidance only and does not constitute a
                binding quote. Actual costs may vary based on site conditions, material availability,
                and final design specifications. Contact us for a detailed proposal.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
