import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { RequireAuth } from "./components/RequireAuth";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DailyFormPage } from "./pages/DailyFormPage";
import { ReadingsListPage } from "./pages/ReadingsListPage";
import { AuthPage } from "./pages/AuthPage";
import { AuthCallback } from "./pages/AuthCallback";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public: dashboard (read-only RLS will still gate data), login, OAuth callback */}
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
                {/* Future: /settings, /equipment, /reports */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppShell>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
