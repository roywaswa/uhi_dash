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
    <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
        Layer
      </p>
      <div className="flex border p-1" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        {LAYERS.map((layer) => (
          <button
            className={`flex-1 px-2 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors ${
              active === layer.key ? "text-white" : ""
            }`}
            style={{
              backgroundColor: active === layer.key ? "var(--accent)" : "transparent",
              color: active === layer.key ? "white" : "var(--muted)",
            }}
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
