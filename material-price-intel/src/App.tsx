import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UploadPage } from "./pages/UploadPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { QuoteDetailPage } from "./pages/QuoteDetailPage";
import { MaterialsPage } from "./pages/MaterialsPage";
import { QuotesListPage } from "./pages/QuotesListPage";
import { SearchPage } from "./pages/SearchPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ProjectsListPage } from "./pages/ProjectsListPage";
import { ProjectCreatePage } from "./pages/ProjectCreatePage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { EstimatePage } from "./pages/EstimatePage";
import { AdminEstimatorPage } from "./pages/AdminEstimatorPage";
import { CatalogPage } from "./pages/CatalogPage";
import { CatalogDetailPage } from "./pages/CatalogDetailPage";
import { AdminCatalogPage } from "./pages/AdminCatalogPage";
import { AdminLeadsPage } from "./pages/AdminLeadsPage";

// Lazy-load the V2 estimator (heavy: cost DB, framer-motion, confetti)
const LazyEstimatePageV2 = lazy(() =>
  import("./pages/EstimatePageV2").then((m) => ({ default: m.EstimatePageV2 }))
);

function EstimateV2Loader() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#c9a861]/30 border-t-[#c9a861] rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[#8b8a85]">Loading estimator...</p>
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
      <Route path="/estimate" element={<EstimateV2Loader />} />
      <Route path="/estimate/v1" element={<EstimatePage />} />
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/catalog/:id" element={<CatalogDetailPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/quotes" element={<QuotesListPage />} />
          <Route path="/quotes/:id" element={<QuoteDetailPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/new" element={<ProjectCreatePage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route
            path="/admin/estimator"
            element={<AdminEstimatorPage />}
          />
          <Route path="/admin/catalog" element={<AdminCatalogPage />} />
          <Route path="/admin/leads" element={<AdminLeadsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
