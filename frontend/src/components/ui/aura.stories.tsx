import { AuraCard } from "./AuraCard";
import { Button } from "./Button";
import { Field, Input, NumberInput, Select, Textarea } from "./Input";
import { Toggle } from "./Toggle";
import { StatusBadge } from "../pfd/StatusBadge";
import { Gauge } from "../pfd/Gauge";
import { AerationTank } from "../pfd/AerationTank";
import { KpiTile } from "../KpiTile";
import { EmptyState } from "./EmptyState";
import { Zap, Droplets, Activity, Calendar } from "lucide-react";

// Ladle wraps each story in a light background by default. Force the Aura
// dark theme so the components look correct.
export const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      minHeight: "100vh",
      background: "#03181C",
      backgroundImage:
        "radial-gradient(circle at 0% 0%, rgba(0,240,255,0.05) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(204,255,0,0.03) 0%, transparent 50%)",
      padding: "2rem",
      color: "#FFFFFF",
      fontFamily: "Plus Jakarta Sans, IBM Plex Sans Thai, system-ui, sans-serif",
    }}
  >
    {children}
  </div>
);

export const Card = () => (
  <Wrapper>
    <AuraCard>
      <h2 style={{ color: "#fff", marginBottom: "0.5rem" }}>Aura Card</h2>
      <p style={{ color: "#A1B5BB" }}>
        Glass card with rotating conic-gradient border. The aura rotates 360° over 4 seconds.
      </p>
    </AuraCard>
  </Wrapper>
);

export const Buttons = () => (
  <Wrapper>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <Button loading>Loading</Button>
      <Button disabled>Disabled</Button>
    </div>
  </Wrapper>
);

export const FormInputs = () => (
  <Wrapper>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", maxWidth: 600 }}>
      <Field label="ชื่อ" required>
        <Input placeholder="กรอกชื่อ" />
      </Field>
      <Field label="ปริมาณ" unit="mg/L">
        <NumberInput placeholder="0.00" />
      </Field>
      <Field label="หมายเหตุ">
        <Textarea rows={2} placeholder="..." />
      </Field>
      <Field label="เลือก">
        <Select>
          <option>ตัวเลือก 1</option>
          <option>ตัวเลือก 2</option>
        </Select>
      </Field>
    </div>
  </Wrapper>
);

export const ToggleStates = () => (
  <Wrapper>
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400 }}>
      <Toggle checked={true} onChange={() => {}} label="อุปกรณ์ทำงาน" description="เปิดอยู่" />
      <Toggle checked={false} onChange={() => {}} label="อุปกรณ์หยุด" description="ปิดอยู่" />
      <Toggle checked={null} onChange={() => {}} label="สถานะไม่ทราบ" />
    </div>
  </Wrapper>
);

export const StatusBadges = () => (
  <Wrapper>
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <StatusBadge operating={null} />
      <StatusBadge operating={true} />
      <StatusBadge operating={false} />
    </div>
  </Wrapper>
);

export const Gauges = () => (
  <Wrapper>
    <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
      <Gauge label="DO ปกติ" value={4.2} unit="mg/L" fraction={0.5} />
      <Gauge label="DO ต่ำ" value={1.5} unit="mg/L" fraction={0.18} alert />
      <Gauge label="ว่าง" value={null} unit="mg/L" fraction={0} />
    </div>
  </Wrapper>
);

export const AerationTanks = () => (
  <Wrapper>
    <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
      <div>
        <p style={{ color: "#A1B5BB", fontSize: 12, marginBottom: 8 }}>Aerator ON</p>
        <AerationTank aeratorOn={true} />
      </div>
      <div>
        <p style={{ color: "#A1B5BB", fontSize: 12, marginBottom: 8 }}>Aerator OFF</p>
        <AerationTank aeratorOn={false} />
      </div>
      <div>
        <p style={{ color: "#A1B5BB", fontSize: 12, marginBottom: 8 }}>Unknown</p>
        <AerationTank aeratorOn={null} />
      </div>
    </div>
  </Wrapper>
);

export const KpiTiles = () => (
  <Wrapper>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", maxWidth: 900 }}>
      <KpiTile label="น้ำเข้าระบบ" value={150.5} unit="m³" icon={<Droplets className="w-5 h-5" />} accent="cyan" />
      <KpiTile label="น้ำที่ใช้" value={120} unit="m³" icon={<Activity className="w-5 h-5" />} accent="lime" />
      <KpiTile label="วันผิดปกติ" value={3} unit="วัน" icon={<Zap className="w-5 h-5" />} accent="amber" />
      <KpiTile label="วันระบาย" value={7} unit="วัน" icon={<Calendar className="w-5 h-5" />} accent="cyan" />
    </div>
  </Wrapper>
);

export const EmptyStateStory = () => (
  <Wrapper>
    <AuraCard>
      <EmptyState
        icon={<Calendar className="w-8 h-8" />}
        title="ยังไม่มีรายการบันทึก"
        description="เริ่มบันทึกค่าคุณภาพน้ำรายวันของระบบบำบัด — ข้อมูลจะปรากฏที่นี่"
      />
    </AuraCard>
  </Wrapper>
);
