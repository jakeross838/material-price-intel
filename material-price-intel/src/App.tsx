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

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/quotes" element={<QuotesListPage />} />
          <Route path="/quotes/:id" element={<QuoteDetailPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
