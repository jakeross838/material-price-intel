import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { QuoteDetailPage } from "./pages/QuoteDetailPage";
import { ProjectsListPage } from "./pages/ProjectsListPage";
import { ProjectCreatePage } from "./pages/ProjectCreatePage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { EstimatePage } from "./pages/EstimatePage";
import { CatalogPage } from "./pages/CatalogPage";
import { CatalogDetailPage } from "./pages/CatalogDetailPage";
import { PricingHubPage } from "./pages/PricingHubPage";
import { AdminHubPage } from "./pages/AdminHubPage";

// Lazy-load the V2 estimator (heavy: cost DB, framer-motion, confetti)
const LazyEstimatePageV2 = lazy(() =>
  import("./pages/EstimatePageV2").then((m) => ({ default: m.EstimatePageV2 }))
);

const LazySharedEstimatePage = lazy(() =>
  import("./pages/SharedEstimatePage").then((m) => ({ default: m.SharedEstimatePage }))
);

const LazyCompareEstimatesPage = lazy(() =>
  import("./pages/CompareEstimatesPage").then((m) => ({ default: m.CompareEstimatesPage }))
);

function EstimateV2Loader() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#091e28] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[#8d9a9f]">Loading estimator...</p>
          </div>
        </div>
      }
    >
      <LazyEstimatePageV2 />
    </Suspense>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/estimate/shared/:id" element={<Suspense fallback={<div className="min-h-screen bg-[#091e28] flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}><LazySharedEstimatePage /></Suspense>} />
      <Route path="/estimate/compare" element={<Suspense fallback={<div className="min-h-screen bg-[#091e28] flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}><LazyCompareEstimatesPage /></Suspense>} />
      <Route path="/estimate" element={<EstimateV2Loader />} />
      <Route path="/estimate/v1" element={<EstimatePage />} />
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/catalog/:id" element={<CatalogDetailPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          {/* Pricing Hub - consolidates quotes, materials, search, reports */}
          <Route path="/pricing" element={<PricingHubPage />} />
          <Route path="/quotes/:id" element={<QuoteDetailPage />} />
          {/* Legacy routes redirect to Pricing Hub with appropriate tab */}
          <Route path="/quotes" element={<Navigate to="/pricing?tab=quotes" replace />} />
          <Route path="/materials" element={<Navigate to="/pricing?tab=materials" replace />} />
          <Route path="/search" element={<Navigate to="/pricing?tab=search" replace />} />
          <Route path="/reports" element={<Navigate to="/pricing?tab=analytics" replace />} />
          {/* Projects */}
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/new" element={<ProjectCreatePage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          {/* Admin Hub - consolidates catalog, estimator, leads */}
          <Route path="/admin" element={<AdminHubPage />} />
          {/* Legacy admin routes redirect to Admin Hub with appropriate tab */}
          <Route path="/admin/catalog" element={<Navigate to="/admin?tab=catalog" replace />} />
          <Route path="/admin/estimator" element={<Navigate to="/admin?tab=estimator" replace />} />
          <Route path="/admin/leads" element={<Navigate to="/admin?tab=leads" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
