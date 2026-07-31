import { WastewaterFlowDiagram } from "../components/flow/WastewaterFlowDiagram";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { useFlowData } from "../lib/use-flow-data";

/**
 * FlowDiagramPage (P21) — build surface for the 2.5D interactive PFD.
 *
 * Deliberately NOT in the sidebar nav yet: the diagram is a scaffold with
 * dummy data, and the dashboard is what hospital staff actually open. Reach
 * it at /flow while building. To promote it once the artwork lands, add
 *   { to: "/flow", label: "ผังกระบวนการ", icon: "<name>" }
 * to NAV in components/layout/AppShell.tsx — note that a *new* icon name
 * requires rerunning `node scripts/gen-msymbol-subset.mjs` (FONTS-1), so
 * reuse a name already in scripts/msymbol-icon-names.txt if you can.
 */
export function FlowDiagramPage() {
  // Swap "dummy" → "daily-reading" once the query in useFlowData is wired.
  const { data, loading, refresh } = useFlowData("dummy");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight">
            <span className="aura-text-gradient">ผังกระบวนการ</span>
            <span className="text-aura-textMain"> 2.5D</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            โครงร่างสำหรับวางภาพ PNG + เส้นการไหล SVG — ยังใช้ข้อมูลตัวอย่าง
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} loading={loading}>
          รีเฟรช
        </Button>
      </header>

      <WastewaterFlowDiagram data={data} />

      {/* Build notes — delete once the scene is real. */}
      <AuraCard idle>
        <h2 className="font-display font-semibold text-aura-textMain mb-2">
          Where to drop the UI code
        </h2>
        <ul className="text-sm text-aura-textMuted space-y-1.5 list-disc pl-5">
          <li>
            <code className="text-aura-cyan">components/flow/WastewaterFlowDiagram.tsx</code>{" "}
            — three marked layers: backplate PNG, SVG flow overlay, equipment sprites.
          </li>
          <li>
            <code className="text-aura-cyan">lib/flow-model.ts</code> — move a stage by
            editing <code>FLOW_ANCHORS</code>; both layers share the{" "}
            <code>FLOW_VIEWBOX</code> (1600×900) grid.
          </li>
          <li>
            <code className="text-aura-cyan">lib/use-flow-data.ts</code> — replace the
            dummy fixture with the <code>v_reading_with_computed</code> query in the JSDoc.
          </li>
          <li>
            PNG assets go in <code className="text-aura-cyan">frontend/public/flow/</code>{" "}
            and must be referenced via <code>import.meta.env.BASE_URL</code> — the app is
            served from a GitHub Pages sub-path, so absolute <code>/flow/…</code> paths 404.
          </li>
        </ul>
      </AuraCard>
    </div>
  );
}
