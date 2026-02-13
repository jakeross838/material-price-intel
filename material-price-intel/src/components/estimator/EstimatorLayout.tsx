import type { ReactNode } from "react";

type Props = { children: ReactNode };

export function EstimatorLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-slate-900 text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Ross Built Custom Homes
            </h1>
            <p className="text-slate-400 text-sm">Bradenton &amp; Sarasota, FL</p>
          </div>
          <span className="text-sm text-slate-400 hidden sm:block">
            Free Estimate
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      <footer className="bg-slate-50 border-t py-6 px-4 text-center text-xs text-slate-500 space-y-1">
        <p>
          This estimate is for planning purposes only and does not constitute a
          bid or contract.
        </p>
        <p>
          Actual costs may vary based on site conditions, material availability,
          and design complexity.
        </p>
        <p className="mt-2 text-slate-400">
          &copy; {new Date().getFullYear()} Ross Built Custom Homes
        </p>
      </footer>
    </div>
  );
}
