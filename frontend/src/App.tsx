import { Routes, Route, Navigate } from "react-router-dom";
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
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
