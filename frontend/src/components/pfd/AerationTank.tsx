/**
 * Aeration tank with bubble particle animation.
 * Bubble count/opacity reflect the aerator on/off status — this is real
 * equipment state, not decoration (per design/ui-brief.md §Animation).
 *
 * Aura Edition: dark tank with neon cyan bubbles + glow when aerator on.
 */
export function AerationTank({ aeratorOn }: { aeratorOn: boolean | null | undefined }) {
  // Render bubbles only when aerator is on (status === true). Unknown → show a few dim.
  const bubbles = aeratorOn === true ? 5 : aeratorOn === false ? 0 : 2;
  const glow = aeratorOn === true ? "shadow-aura-glow-cyan border-aura-cyan/50" : "border-aura-borderSubtle";
  return (
    <div
      className={`relative w-24 h-20 mx-auto rounded-xl overflow-hidden border bg-aura-surfaceHigh/60 backdrop-blur-sm ${glow}`}
      title={aeratorOn === true ? "เครื่องเติมอากาศ: ทำงาน" : aeratorOn === false ? "เครื่องเติมอากาศ: หยุด" : "สถานะไม่ทราบ"}
    >
      {/* Bubble particles — neon cyan instead of white */}
      {Array.from({ length: bubbles }).map((_, i) => (
        <span
          key={i}
          className="bubble absolute bottom-1 rounded-full"
          style={{
            left: `${15 + i * 18}%`,
            width: `${4 + (i % 3) * 2}px`,
            height: `${4 + (i % 3) * 2}px`,
            background: aeratorOn === null ? "rgba(0,240,255,0.35)" : "rgba(0,240,255,0.9)",
            boxShadow: aeratorOn === true ? "0 0 4px rgba(0,240,255,0.8)" : "none",
            opacity: aeratorOn === null ? 0.4 : 0.9,
          }}
        />
      ))}
      {/* Tank label */}
      <div className="absolute inset-x-0 bottom-0 text-center text-[9px] font-medium text-aura-textMuted bg-aura-bg/40 py-0.5 font-thai">
        บ่อเติมอากาศ
      </div>
    </div>
  );
}
