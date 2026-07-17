import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DailyFormPage } from "./pages/DailyFormPage";
import { ReadingsListPage } from "./pages/ReadingsListPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/form" element={<DailyFormPage />} />
        <Route path="/form/:id" element={<DailyFormPage />} />
        <Route path="/readings" element={<ReadingsListPage />} />
        {/* Future: /settings, /login */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}
