/** Aeration tank with bubble particle animation.
 * Bubble count/opacity reflect the aerator on/off status — this is real
 * equipment state, not decoration (per design/ui-brief.md §Animation). */
export function AerationTank({ aeratorOn }: { aeratorOn: boolean | null | undefined }) {
  // Render bubbles only when aerator is on (status === true). Unknown → show a few dim.
  const bubbles = aeratorOn === true ? 5 : aeratorOn === false ? 0 : 2;
  return (
    <div className="relative w-24 h-20 mx-auto rounded-lg bg-gradient-to-b from-water-100 to-water-300 border border-water-500 overflow-hidden">
      {/* Bubble particles */}
      {Array.from({ length: bubbles }).map((_, i) => (
        <span
          key={i}
          className="bubble absolute bottom-1 rounded-full bg-white/70"
          style={{
            left: `${15 + i * 18}%`,
            width: `${4 + (i % 3) * 2}px`,
            height: `${4 + (i % 3) * 2}px`,
            opacity: aeratorOn === null ? 0.4 : 0.8,
          }}
        />
      ))}
      {/* Tank label */}
      <div className="absolute inset-x-0 bottom-0 text-center text-[9px] font-medium text-navy-700 bg-white/50 py-0.5">
        บ่อเติมอากาศ
      </div>
    </div>
  );
}
