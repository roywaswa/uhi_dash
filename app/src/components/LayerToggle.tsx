import type { ActiveLayer } from "@/types/uhi";

interface Props {
  active: ActiveLayer;
  onChange: (layer: ActiveLayer) => void;
}

const LAYERS: Array<{ key: ActiveLayer; label: string }> = [
  { key: "lst", label: "LST" },
  { key: "ndvi", label: "NDVI" },
  { key: "vulnerability", label: "Vulnerability" },
];

export default function LayerToggle({
  active,
  onChange,
}: Props): React.JSX.Element {
  return (
    <div className="border-[#222222] border-b p-4">
      <p className="mb-3 text-[#666666] text-[10px] uppercase tracking-[0.2em]">
        Layer
      </p>
      <div className="flex border border-[#222222] bg-[#111111] p-1">
        {LAYERS.map((layer) => (
          <button
            className={`flex-1 px-2 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors ${
              active === layer.key
                ? "bg-[#d73027] text-white"
                : "text-[#888888] hover:bg-[#1b1b1b] hover:text-white"
            }`}
            key={layer.key}
            onClick={() => onChange(layer.key)}
            type="button"
          >
            {layer.label}
          </button>
        ))}
      </div>
    </div>
  );
}
