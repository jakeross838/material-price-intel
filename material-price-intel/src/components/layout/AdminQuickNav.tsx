import { useState, useContext } from 'react';
import { NavLink, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PanelRightOpen, PanelRightClose,
  LayoutDashboard, Upload, FileText, Layers, Search,
  BarChart3, FolderKanban, Calculator, Palette, Users,
  LogOut, X,
} from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';

const mainNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload Quotes', icon: Upload },
  { to: '/quotes', label: 'Vendor Quotes', icon: FileText },
  { to: '/materials', label: 'Material Prices', icon: Layers },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/reports', label: 'Reports & Trends', icon: BarChart3 },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
];

const adminNav = [
  { to: '/admin/leads', label: 'Client Leads', icon: Users },
  { to: '/admin/estimator', label: 'Estimator Config', icon: Calculator },
  { to: '/admin/catalog', label: 'Catalog', icon: Palette },
];

const estimatorNav = [
  { to: '/estimate', label: 'Estimator', icon: Calculator },
  { to: '/estimate/compare', label: 'Compare', icon: BarChart3 },
];

export function AdminQuickNav() {
  const auth = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Only show for authenticated users
  if (!auth?.user) return null;

  const isEstimatorPage = location.pathname.startsWith('/estimate');
  const isInternalPage = !isEstimatorPage && location.pathname !== '/login';

  return (
    <>
      {/* Toggle tab — fixed to right edge */}
      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        initial={{ x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[60]
          w-8 h-16 rounded-l-lg
          bg-brand-700/90 hover:bg-brand-600 backdrop-blur-sm
          border border-r-0 border-brand-500/30
          flex items-center justify-center
          text-white/70 hover:text-white
          transition-colors duration-200
          shadow-lg"
        title="Admin Navigation"
      >
        {open ? (
          <PanelRightClose className="h-4 w-4" />
        ) : (
          <PanelRightOpen className="h-4 w-4" />
        )}
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[61] bg-black/40 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* Slide-out panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[62] w-72
              bg-card border-l border-border shadow-2xl
              flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Quick Nav</p>
                <p className="text-[10px] text-muted-foreground">{auth.user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Current context indicator */}
            <div className="px-4 py-2 bg-accent/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {isEstimatorPage ? 'Viewing: Estimator' : isInternalPage ? 'Viewing: Price Analyzer' : 'Navigation'}
              </p>
            </div>

            {/* Estimator links (shown when on internal pages) */}
            {isInternalPage && (
              <NavSection label="Estimator">
                {estimatorNav.map((item) => (
                  <QuickNavLink key={item.to} {...item} onClick={() => setOpen(false)} />
                ))}
              </NavSection>
            )}

            {/* Main internal nav */}
            <NavSection label="Price Analyzer">
              {mainNav.map((item) => (
                <QuickNavLink key={item.to} {...item} onClick={() => setOpen(false)} />
              ))}
            </NavSection>

            {/* Admin section */}
            <NavSection label="Admin">
              {adminNav.map((item) => (
                <QuickNavLink key={item.to} {...item} onClick={() => setOpen(false)} />
              ))}
            </NavSection>

            {/* Estimator links (shown when on estimator pages) */}
            {isEstimatorPage && (
              <NavSection label="Estimator">
                {estimatorNav.map((item) => (
                  <QuickNavLink key={item.to} {...item} onClick={() => setOpen(false)} />
                ))}
              </NavSection>
            )}

            {/* Footer */}
            <div className="mt-auto p-4 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  auth.signOut();
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-3">
      <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </p>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}

function QuickNavLink({
  to,
  label,
  icon: Icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}
