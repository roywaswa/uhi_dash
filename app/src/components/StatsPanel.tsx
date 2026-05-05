import type { Stats } from "@/types/uhi";

interface Props {
  stats: Stats | null;
  loading: boolean;
  city: string;
}

const TIER_COLORS = [
  "bg-[#2166ac]",
  "bg-[#74add1]",
  "bg-[#fee090]",
  "bg-[#f46d43]",
  "bg-[#a50026]",
] as const;

const STAT_LABELS = [
  { label: "Mean LST", key: "meanLst", suffix: "\u00B0C" },
  { label: "Max LST", key: "maxLst", suffix: "\u00B0C" },
  { label: "Mean NDVI", key: "meanNdvi", suffix: "" },
  { label: "High Risk", key: "highRiskPct", suffix: "%" },
] as const;

const BAR_SEGMENTS = Array.from({ length: 20 }, (_, index) => index + 1);
const SKELETON_STATS = ["stat-a", "stat-b", "stat-c", "stat-d"];
const SKELETON_BARS = ["bar-a", "bar-b", "bar-c", "bar-d", "bar-e"];

function formatStat(
  stats: Stats,
  key: (typeof STAT_LABELS)[number]["key"],
  suffix: string,
): string {
  const value = stats[key];
  return suffix ? `${value}${suffix}` : value.toString();
}

function BarSegments({
  pct,
  colorClass,
}: {
  pct: number;
  colorClass: string;
}): React.JSX.Element {
  const activeSegments = Math.round(pct / 5);
  return (
    <div className="grid h-2 grid-cols-[repeat(20,minmax(0,1fr))] gap-px" style={{ backgroundColor: "var(--surface-alt)" }}>
      {BAR_SEGMENTS.map((segment) => (
        <span
          className={segment <= activeSegments ? colorClass : ""}
          key={`segment-${segment}`}
          style={{
            backgroundColor: segment <= activeSegments ? undefined : "var(--divider)",
          }}
        />
      ))}
    </div>
  );
}

export default function StatsPanel({
  stats,
  loading,
  city,
}: Props): React.JSX.Element {
  if (loading) {
    return (
      <section className="border-b p-4" style={{ borderColor: "var(--border)" }}>
        <div className="mb-4 h-4 w-36 animate-pulse" style={{ backgroundColor: "var(--border)" }} />
        <div className="grid grid-cols-2 gap-2">
          {SKELETON_STATS.map((item) => (
            <div className="border p-3" key={item} style={{ borderColor: "var(--border)" }}>
              <div className="mb-3 h-3 w-20 animate-pulse" style={{ backgroundColor: "var(--border)" }} />
              <div className="h-6 w-16 animate-pulse" style={{ backgroundColor: "var(--border)" }} />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {SKELETON_BARS.map((item) => (
            <div className="h-6 animate-pulse" key={item} style={{ backgroundColor: "var(--surface-alt)" }} />
          ))}
        </div>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="border-b p-4" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
          No statistics available
        </p>
      </section>
    );
  }

  return (
    <section className="border-b p-4" style={{ borderColor: "var(--border)" }}>
      <div className="mb-4 flex items-end justify-between pb-3" style={{ borderBottom: `1px solid var(--border)` }}>
        <h2 className="font-medium text-sm uppercase tracking-[0.18em]" style={{ color: "var(--text)" }}>
          {city}
        </h2>
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
          Jun-Sep 2023
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STAT_LABELS.map((item) => (
          <div
            className="border p-3"
            key={item.key}
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-alt)" }}
          >
            <p className="mb-2 text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
              {item.label}
            </p>
            <p className="font-medium text-2xl" style={{ color: "var(--text)" }}>
              {formatStat(stats, item.key, item.suffix)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
          Vulnerability Tier Area
        </p>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((tier, index) => {
            const pct = stats.tierPct[tier.toString()] ?? 0;
            return (
              <div
                className="grid grid-cols-[38px_1fr_42px] items-center gap-2"
                key={tier}
              >
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  T{tier}
                </span>
                <BarSegments colorClass={TIER_COLORS[index]} pct={pct} />
                <span className="text-right text-[11px]" style={{ color: "var(--text)" }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
