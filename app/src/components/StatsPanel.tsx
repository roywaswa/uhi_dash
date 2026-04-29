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
    <div className="grid h-2 grid-cols-[repeat(20,minmax(0,1fr))] gap-px bg-[#191919]">
      {BAR_SEGMENTS.map((segment) => (
        <span
          className={segment <= activeSegments ? colorClass : "bg-[#262626]"}
          key={`segment-${segment}`}
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
      <section className="border-[#222222] border-b p-4">
        <div className="mb-4 h-4 w-36 animate-pulse bg-[#222222]" />
        <div className="grid grid-cols-2 gap-2">
          {SKELETON_STATS.map((item) => (
            <div className="border border-[#222222] p-3" key={item}>
              <div className="mb-3 h-3 w-20 animate-pulse bg-[#222222]" />
              <div className="h-6 w-16 animate-pulse bg-[#222222]" />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {SKELETON_BARS.map((item) => (
            <div className="h-6 animate-pulse bg-[#181818]" key={item} />
          ))}
        </div>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="border-[#222222] border-b p-4">
        <p className="text-[#666666] text-xs uppercase tracking-[0.2em]">
          No statistics available
        </p>
      </section>
    );
  }

  return (
    <section className="border-[#222222] border-b p-4">
      <div className="mb-4 flex items-end justify-between border-[#222222] border-b pb-3">
        <h2 className="font-medium text-sm text-white uppercase tracking-[0.18em]">
          {city}
        </h2>
        <span className="text-[#666666] text-[10px] uppercase tracking-[0.2em]">
          Jun-Sep 2023
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STAT_LABELS.map((item) => (
          <div
            className="border border-[#222222] bg-[#111111] p-3"
            key={item.key}
          >
            <p className="mb-2 text-[#666666] text-[10px] uppercase tracking-[0.16em]">
              {item.label}
            </p>
            <p className="font-medium text-2xl text-[#e8e8e8]">
              {formatStat(stats, item.key, item.suffix)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <p className="mb-3 text-[#666666] text-[10px] uppercase tracking-[0.2em]">
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
                <span className="text-[#888888] text-[11px]">T{tier}</span>
                <BarSegments colorClass={TIER_COLORS[index]} pct={pct} />
                <span className="text-right text-[#e8e8e8] text-[11px]">
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
