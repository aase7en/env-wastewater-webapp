import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { RequireAuth } from "./components/RequireAuth";
import { ToastProvider } from "./components/ui/Toast";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DailyFormPage } from "./pages/DailyFormPage";
import { ReadingsListPage } from "./pages/ReadingsListPage";
import { AuthPage } from "./pages/AuthPage";
import { AuthCallback } from "./pages/AuthCallback";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ReportsPage } from "./pages/ReportsPage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { TrendsPage } from "./pages/TrendsPage";
import { CarbonPage } from "./pages/CarbonPage";
import { OverviewPage } from "./pages/OverviewPage";
import { BulkImportPage } from "./pages/BulkImportPage";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Public: login + OAuth callback */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Authenticated app shell */}
          <Route
            path="/*"
            element={
              <AppShell>
                <Routes>
                  {/* V4b: unified overview replaces the old redirect-to-dashboard */}
                  <Route path="/" element={<OverviewPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route
                    path="/form"
                    element={
                      <RequireAuth>
                        <DailyFormPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/form/:id"
                    element={
                      <RequireAuth>
                        <DailyFormPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/readings"
                    element={
                      <RequireAuth>
                        <ReadingsListPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <RequireAuth>
                        <ReportsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/equipment"
                    element={
                      <RequireAuth>
                        <EquipmentPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/trends"
                    element={
                      <RequireAuth>
                        <TrendsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/carbon"
                    element={
                      <RequireAuth>
                        <CarbonPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/import"
                    element={
                      <RequireAuth requireAdmin>
                        <BulkImportPage />
                      </RequireAuth>
                    }
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AppShell>
            }
          />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}
