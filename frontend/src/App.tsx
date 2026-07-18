import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
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
import { WaterSupplyPage } from "./pages/WaterSupplyPage";
import { GarbagePage } from "./pages/GarbagePage";
import { FuelPage } from "./pages/FuelPage";
import { GardenPage } from "./pages/GardenPage";
import { BuildingPage } from "./pages/BuildingPage";
import { SafetyPage } from "./pages/SafetyPage";
import { FoodPage } from "./pages/FoodPage";
import { ChemicalPage } from "./pages/ChemicalPage";
import { RegulationsPage } from "./pages/RegulationsPage";
import { CarbonRollupPage } from "./pages/CarbonRollupPage";
import { PDFDesignerPage } from "./pages/PDFDesignerPage";
import { AttachmentsPage } from "./pages/AttachmentsPage";
// Lazy-load DBA Console (admin-only, heavy bundle) — keeps main chunk lean.
const DBAConsolePage = lazy(() =>
  import("./pages/admin/DBAConsolePage").then((m) => ({ default: m.DBAConsolePage })),
);
const AIAdminPage = lazy(() =>
  import("./pages/admin/AIAdminPage").then((m) => ({ default: m.AIAdminPage })),
);

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
                  {/* v2 multi-domain modules (Wave 3 -a skeletons) */}
                  <Route path="/water-supply" element={<RequireAuth><WaterSupplyPage /></RequireAuth>} />
                  <Route path="/garbage" element={<RequireAuth><GarbagePage /></RequireAuth>} />
                  <Route path="/fuel" element={<RequireAuth><FuelPage /></RequireAuth>} />
                  <Route path="/garden" element={<RequireAuth><GardenPage /></RequireAuth>} />
                  <Route path="/building" element={<RequireAuth><BuildingPage /></RequireAuth>} />
                  <Route path="/safety" element={<RequireAuth><SafetyPage /></RequireAuth>} />
                  <Route path="/food" element={<RequireAuth><FoodPage /></RequireAuth>} />
                  <Route path="/chemical" element={<RequireAuth><ChemicalPage /></RequireAuth>} />
                  <Route path="/regulations" element={<RequireAuth><RegulationsPage /></RequireAuth>} />
                  <Route path="/carbon-rollup" element={<RequireAuth><CarbonRollupPage /></RequireAuth>} />
                  {/* DBA Console — admin-only, lazy-loaded */}
                  <Route
                    path="/admin/db"
                    element={
                      <RequireAuth requireAdmin>
                        <Suspense fallback={<div className="p-8 text-center font-thai text-aura-textMuted">กำลังโหลด DBA Console…</div>}>
                          <DBAConsolePage />
                        </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin/ai"
                    element={
                      <RequireAuth requireAdmin>
                        <Suspense fallback={<div className="p-8 text-center font-thai text-aura-textMuted">กำลังโหลด AI Admin…</div>}>
                          <AIAdminPage />
                        </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route path="/pdf-designer" element={<RequireAuth requireAdmin><PDFDesignerPage /></RequireAuth>} />
                  <Route path="/attachments" element={<RequireAuth><AttachmentsPage /></RequireAuth>} />
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
