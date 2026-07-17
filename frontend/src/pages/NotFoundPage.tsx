import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

/** Aura-themed 404 — replaces the silent redirect to /dashboard. */
export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-[10rem] md:text-[14rem] font-display font-bold leading-none aura-text-gradient">
        404
      </div>
      <h1 className="text-2xl font-display font-bold text-aura-textMain mb-2 font-thai">
        ไม่พบหน้าที่ค้นหา
      </h1>
      <p className="text-aura-textMuted font-thai mb-8 max-w-md">
        หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่เคยมีอยู่
      </p>
      <Link to="/dashboard">
        <Button size="lg">กลับหน้าแดชบอร์ด</Button>
      </Link>
    </div>
  );
}
