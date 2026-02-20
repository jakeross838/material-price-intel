import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Phone, Bookmark, BarChart3 } from 'lucide-react';
import { useSavedEstimates } from '@/hooks/useSavedEstimates';

export function EstimatorV2Layout({ children }: { children: React.ReactNode }) {
  const { estimates } = useSavedEstimates();
  const savedCount = estimates.length;
  const location = useLocation();
  const isComparePage = location.pathname === '/estimate/compare';

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
      {/* Ambient gradient orbs */}
      <div className="ev2-ambient-orb fixed w-[500px] h-[500px] -top-40 -right-40 bg-[#5b8497]/[0.04]" style={{ animationDelay: '0s' }} />
      <div className="ev2-ambient-orb fixed w-[400px] h-[400px] top-1/2 -left-40 bg-[#5b8497]/[0.03]" style={{ animationDelay: '-7s' }} />
      <div className="ev2-ambient-orb fixed w-[350px] h-[350px] -bottom-20 right-1/4 bg-[#ffffff]/[0.02]" style={{ animationDelay: '-13s' }} />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-[var(--ev2-border)] bg-[var(--ev2-navy-950)]/80 backdrop-blur-md sticky top-0 z-50 ev2-animated-border-top">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/estimate" className="text-[var(--ev2-gold)] font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
                Ross Built
              </Link>
              <span className="hidden sm:inline text-[var(--ev2-text-dim)] text-xs">
                Custom Homes
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Saved estimates indicator */}
              {savedCount > 0 && (
                <Link
                  to="/estimate/compare"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    isComparePage
                      ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]'
                      : 'bg-[var(--ev2-surface)] border border-[var(--ev2-border)] text-[var(--ev2-text-muted)] hover:text-[var(--ev2-gold)] hover:border-[var(--ev2-gold)]/30'
                  }`}
                >
                  {savedCount >= 2 ? (
                    <BarChart3 className="h-3 w-3" />
                  ) : (
                    <Bookmark className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">
                    {savedCount >= 2 ? 'Compare' : 'Saved'}
                  </span>
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                    isComparePage
                      ? 'bg-[var(--ev2-navy-950)]/20 text-[var(--ev2-navy-950)]'
                      : 'bg-[var(--ev2-gold)]/15 text-[var(--ev2-gold)]'
                  }`}>
                    {savedCount}
                  </span>
                </Link>
              )}

              <a
                href="tel:+19413365263"
                className="flex items-center gap-1.5 text-[var(--ev2-text-muted)] hover:text-[var(--ev2-gold)] transition-colors text-sm"
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">(941) 336-5263</span>
              </a>
            </div>
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
