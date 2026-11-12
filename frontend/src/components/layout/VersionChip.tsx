import { useState } from "react";
import {
  CHANGELOG_URL,
  formatVersionLabel,
  getAppVersionLabel,
  getLatestRelease,
} from "../../lib/version";

export function VersionChip() {
  const [open, setOpen] = useState(false);
  const release = getLatestRelease();

  return (
    <div className="fixed bottom-2 left-2 z-30 font-thai">
      <button
        type="button"
        data-testid="app-version-chip"
        aria-expanded={open}
        aria-controls="app-version-summary"
        onClick={() => setOpen((current) => !current)}
        className="min-w-[var(--touch-min)] min-h-[var(--touch-min)] rounded-xl border border-aura-borderSubtle bg-aura-surface px-2 text-[10px] text-aura-textMuted shadow-aura-card hover:text-aura-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aura-cyan"
      >
        {getAppVersionLabel()}
      </button>

      {open && (
        <div
          id="app-version-summary"
          data-testid="app-version-summary"
          role="region"
          aria-label="ข้อมูลเวอร์ชันแอป"
          className="absolute bottom-28 left-0 mb-2 w-72 max-w-[calc(100vw-1rem)] rounded-xl border border-aura-borderSubtle bg-aura-surface p-3 text-xs text-aura-textMuted shadow-aura-card sm:bottom-full"
        >
          {release ? (
            <>
              <p className="font-semibold text-aura-textMain">
                {formatVersionLabel(release.version)}
              </p>
              <p className="mt-1">{release.dateTH}</p>
              <p className="mt-2">{release.summary}</p>
            </>
          ) : (
            <p>ยังไม่มีข้อมูล release</p>
          )}
          <a
            href={CHANGELOG_URL}
            className="mt-3 inline-block text-aura-cyan underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aura-cyan"
          >
            CHANGELOG
          </a>
        </div>
      )}
    </div>
  );
}
