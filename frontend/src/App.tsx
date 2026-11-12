import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./components/AuthProvider";
import { RequireAuth } from "./components/RequireAuth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/ui/Toast";
import { PageSkeleton } from "./components/ui/Skeleton";
import { AppShell } from "./components/layout/AppShell";

// ENV-PERF-001 (2026-11-12): every page now lazy-loads behind the SAME
// lazy+PageSkeleton pattern the chart/admin pages always used. Previously
// only 10 pages were lazy and the other 24 eager imports pulled all page
// code into the main bundle (~808KB first visit). Routing + RequireAuth
// structure is untouched; each route just gains a Suspense/PageSkeleton
// fallback for its first navigation.
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const DailyFormPage = lazy(() =>
  import("./pages/DailyFormPage").then((m) => ({ default: m.DailyFormPage })),
);
const ReadingsListPage = lazy(() =>
  import("./pages/ReadingsListPage").then((m) => ({ default: m.ReadingsListPage })),
);
const AuthPage = lazy(() =>
  import("./pages/AuthPage").then((m) => ({ default: m.AuthPage })),
);
const AuthCallback = lazy(() =>
  import("./pages/AuthCallback").then((m) => ({ default: m.AuthCallback })),
);
const PendingApprovalPage = lazy(() =>
  import("./pages/PendingApprovalPage").then((m) => ({ default: m.PendingApprovalPage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);
const ReportsPage = lazy(() =>
  import("./pages/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);
const EquipmentPage = lazy(() =>
  import("./pages/EquipmentPage").then((m) => ({ default: m.EquipmentPage })),
);
const OverviewPage = lazy(() =>
  import("./pages/OverviewPage").then((m) => ({ default: m.OverviewPage })),
);
const FlowDiagramPage = lazy(() =>
  import("./pages/FlowDiagramPage").then((m) => ({ default: m.FlowDiagramPage })),
);
const BulkImportPage = lazy(() =>
  import("./pages/BulkImportPage").then((m) => ({ default: m.BulkImportPage })),
);
const WaterSupplyPage = lazy(() =>
  import("./pages/WaterSupplyPage").then((m) => ({ default: m.WaterSupplyPage })),
);
const GarbagePage = lazy(() =>
  import("./pages/GarbagePage").then((m) => ({ default: m.GarbagePage })),
);
const FuelPage = lazy(() =>
  import("./pages/FuelPage").then((m) => ({ default: m.FuelPage })),
);
const GardenPage = lazy(() =>
  import("./pages/GardenPage").then((m) => ({ default: m.GardenPage })),
);
const BuildingPage = lazy(() =>
  import("./pages/BuildingPage").then((m) => ({ default: m.BuildingPage })),
);
const SafetyPage = lazy(() =>
  import("./pages/SafetyPage").then((m) => ({ default: m.SafetyPage })),
);
const FoodPage = lazy(() =>
  import("./pages/FoodPage").then((m) => ({ default: m.FoodPage })),
);
const ChemicalPage = lazy(() =>
  import("./pages/ChemicalPage").then((m) => ({ default: m.ChemicalPage })),
);
const RegulationsPage = lazy(() =>
  import("./pages/RegulationsPage").then((m) => ({ default: m.RegulationsPage })),
);
const PDFDesignerPage = lazy(() =>
  import("./pages/PDFDesignerPage").then((m) => ({ default: m.PDFDesignerPage })),
);
const AttachmentsPage = lazy(() =>
  import("./pages/AttachmentsPage").then((m) => ({ default: m.AttachmentsPage })),
);
const OperationsPage = lazy(() =>
  import("./pages/OperationsPage").then((m) => ({ default: m.OperationsPage })),
);
const WaterWatchPage = lazy(() =>
  import("./pages/WaterWatchPage").then((m) => ({ default: m.WaterWatchPage })),
);

// Lazy-load heavy chart pages + admin (recharts/jspdf pull big bundles).
// Keeps main chunk lean; loads on first navigation to each route.
const TrendsPage = lazy(() =>
  import("./pages/TrendsPage").then((m) => ({ default: m.TrendsPage })),
);
const CarbonPage = lazy(() =>
  import("./pages/CarbonPage").then((m) => ({ default: m.CarbonPage })),
);
const CarbonRollupPage = lazy(() =>
  import("./pages/CarbonRollupPage").then((m) => ({ default: m.CarbonRollupPage })),
);
const SustainabilityPage = lazy(() =>
  import("./pages/SustainabilityPage").then((m) => ({ default: m.SustainabilityPage })),
);
// SensorsPage (P20d.2) — lazy like the other recharts pages. Re-enabled
// 2026-07-31: the AppShell nav has linked /sensors since b948b10, so with the
// route commented out that menu item was a live 404.
const SensorsPage = lazy(() =>
  import("./pages/SensorsPage").then((m) => ({ default: m.SensorsPage })),
);
// Lazy-load DBA Console (admin-only, heavy bundle) — keeps main chunk lean.
const DBAConsolePage = lazy(() =>
  import("./pages/admin/DBAConsolePage").then((m) => ({ default: m.DBAConsolePage })),
);
const AIAdminPage = lazy(() =>
  import("./pages/admin/AIAdminPage").then((m) => ({ default: m.AIAdminPage })),
);
const PendingUsersPage = lazy(() =>
  import("./pages/admin/PendingUsersPage").then((m) => ({ default: m.PendingUsersPage })),
);
const AuditLogPage = lazy(() =>
  import("./pages/admin/AuditLogPage").then((m) => ({ default: m.AuditLogPage })),
);

export default function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            {/* Public: login + OAuth callback */}
            <Route path="/login" element={<Suspense fallback={<PageSkeleton />}>
            <AuthPage />
          </Suspense>} />
          <Route path="/auth/callback" element={<Suspense fallback={<PageSkeleton />}>
            <AuthCallback />
          </Suspense>} />
          <Route path="/pending-approval" element={<Suspense fallback={<PageSkeleton />}>
            <PendingApprovalPage />
          </Suspense>} />
          {/* ENV-WATER-WATCH-001 — public, simulated visual slice.
              No RequireAuth: this surface is designed for hospital display
              and future public situational communication. */}
          <Route
            path="/water-watch"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <WaterWatchPage />
              </Suspense>
            }
          />

          {/* Authenticated app shell */}
          <Route
            path="/*"
            element={
              <AppShell>
                <Routes>
                  {/* V4b: unified overview replaces the old redirect-to-dashboard.
                      AUTH-5 (2026-07-30): both / and /dashboard previously had NO
                      RequireAuth — a pending (or even anon) user could land on the
                      data overview directly, then hit RLS 401s + RequireAuth
                      bounces on every other tab ("login ไม่ผ่านแต่เข้าแอปได้บางส่วน").
                      Now gated like every other data route. */}
                  <Route
                    path="/"
                    element={
                      <RequireAuth>
                        <Suspense fallback={<PageSkeleton />}>
            <OverviewPage />
          </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <RequireAuth>
                        <Suspense fallback={<PageSkeleton />}>
            <DashboardPage />
          </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/flow"
                    element={
                      <RequireAuth>
                        <Suspense fallback={<PageSkeleton />}>
            <FlowDiagramPage />
          </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/form"
                    element={
                      <RequireAuth>
                        <Suspense fallback={<PageSkeleton />}>
            <DailyFormPage />
          </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/form/:id"
                    element={
                      <RequireAuth>
                        <Suspense fallback={<PageSkeleton />}>
            <DailyFormPage />
          </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/readings"
                    element={
                      <RequireAuth>
                        <Suspense fallback={<PageSkeleton />}>
            <ReadingsListPage />
          </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <RequireAuth>
                        <Suspense fallback={<PageSkeleton />}>
            <ReportsPage />
          </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/operations"
                    element={
                      <RequireAuth>
                        <Suspense fallback={<PageSkeleton />}>
            <OperationsPage />
          </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/equipment"
                    element={
                      <RequireAuth>
                        <Suspense fallback={<PageSkeleton />}>
            <EquipmentPage />
          </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/trends"
                    element={
                      <RequireAuth>
                        <Suspense fallback={<PageSkeleton />}>
                          <TrendsPage />
                        </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/carbon"
                    element={
                      <RequireAuth>
                        <Suspense fallback={<PageSkeleton />}>
                          <CarbonPage />
                        </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/import"
                    element={
                      <RequireAuth requireAdmin>
                        <Suspense fallback={<PageSkeleton />}>
            <BulkImportPage />
          </Suspense>
                      </RequireAuth>
                    }
                  />
                  {/* v2 multi-domain modules (Wave 3 -a skeletons) */}
                  <Route path="/water-supply" element={<RequireAuth><Suspense fallback={<PageSkeleton />}>
            <WaterSupplyPage />
          </Suspense></RequireAuth>} />
                  <Route path="/garbage" element={<RequireAuth><Suspense fallback={<PageSkeleton />}>
            <GarbagePage />
          </Suspense></RequireAuth>} />
                  <Route path="/fuel" element={<RequireAuth><Suspense fallback={<PageSkeleton />}>
            <FuelPage />
          </Suspense></RequireAuth>} />
                  <Route path="/garden" element={<RequireAuth><Suspense fallback={<PageSkeleton />}>
            <GardenPage />
          </Suspense></RequireAuth>} />
                  <Route path="/building" element={<RequireAuth><Suspense fallback={<PageSkeleton />}>
            <BuildingPage />
          </Suspense></RequireAuth>} />
                  <Route path="/safety" element={<RequireAuth><Suspense fallback={<PageSkeleton />}>
            <SafetyPage />
          </Suspense></RequireAuth>} />
                  <Route path="/food" element={<RequireAuth><Suspense fallback={<PageSkeleton />}>
            <FoodPage />
          </Suspense></RequireAuth>} />
                  <Route path="/chemical" element={<RequireAuth><Suspense fallback={<PageSkeleton />}>
            <ChemicalPage />
          </Suspense></RequireAuth>} />
                  <Route path="/regulations" element={<RequireAuth><Suspense fallback={<PageSkeleton />}>
            <RegulationsPage />
          </Suspense></RequireAuth>} />
                  <Route path="/carbon-rollup" element={<RequireAuth><Suspense fallback={<PageSkeleton />}><CarbonRollupPage /></Suspense></RequireAuth>} />
                  <Route path="/sustainability" element={<RequireAuth><Suspense fallback={<PageSkeleton />}><SustainabilityPage /></Suspense></RequireAuth>} />
                  <Route
                    path="/sensors"
                    element={
                      <RequireAuth>
                        <Suspense fallback={<PageSkeleton />}>
                          <SensorsPage />
                        </Suspense>
                      </RequireAuth>
                    }
                  />
                  {/* DBA Console — admin-only, lazy-loaded */}
                  <Route
                    path="/admin/db"
                    element={
                      <RequireAuth requireAdmin>
                        <Suspense fallback={<PageSkeleton />}>
                          <DBAConsolePage />
                        </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin/ai"
                    element={
                      <RequireAuth requireAdmin>
                        <Suspense fallback={<PageSkeleton />}>
                          <AIAdminPage />
                        </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <RequireAuth requireAdmin>
                        <Suspense fallback={<PageSkeleton />}>
                          <PendingUsersPage />
                        </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin/audit"
                    element={
                      <RequireAuth requireAdmin>
                        <Suspense fallback={<PageSkeleton />}>
                          <AuditLogPage />
                        </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route path="/pdf-designer" element={<RequireAuth requireAdmin><Suspense fallback={<PageSkeleton />}>
            <PDFDesignerPage />
          </Suspense></RequireAuth>} />
                  <Route path="/attachments" element={<RequireAuth><Suspense fallback={<PageSkeleton />}>
            <AttachmentsPage />
          </Suspense></RequireAuth>} />
                  <Route path="*" element={<Suspense fallback={<PageSkeleton />}>
            <NotFoundPage />
          </Suspense>} />
                </Routes>
              </AppShell>
            }
          />
        </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </ToastProvider>
  );
}
