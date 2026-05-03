import { useState } from "react";
import type { LocationOption } from "@/lib/location/locationService";

const MAX_VISIBLE = 50;

const fieldStyle: React.CSSProperties = {
  background: "#e8edf2",
  border: "1px solid #ccd3da",
  borderRadius: "3px",
  padding: "9px 10px",
  color: "#333",
  fontSize: "13px",
  width: "100%",
};

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  hasError = false,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  options: LocationOption[];
  placeholder: string;
  disabled?: boolean;
  hasError?: boolean;
  onBlur?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const visible = filtered.slice(0, MAX_VISIBLE);
  const hasMore = filtered.length > MAX_VISIBLE;
  const selectedLabel = options.find((o) => o.code === value)?.label ?? "";

  return (
    <div className="relative">
      <div
        className="flex items-center"
        style={{
          ...fieldStyle,
          border: `1px solid ${hasError ? "#e53e3e" : "#ccd3da"}`,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          paddingRight: "28px",
          position: "relative",
        }}
        onClick={() => { if (!disabled) setOpen(!open); }}
      >
        {open ? (
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={() => { setTimeout(() => { setOpen(false); setSearch(""); onBlur?.(); }, 150); }}
            placeholder={placeholder}
            style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "13px", color: "#333", padding: 0 }}
          />
        ) : (
          <span style={{ color: value ? "#333" : "#999", fontSize: "13px" }}>
            {selectedLabel || placeholder}
          </span>
        )}
      </div>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {open && filtered.length > 0 && (
        <div
          className="absolute z-50 w-full bg-white border overflow-y-auto"
          style={{ borderColor: "#ccd3da", borderRadius: "0 0 3px 3px", maxHeight: "200px", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", top: "100%", left: 0 }}
        >
          {visible.map((o) => (
            <div
              key={o.code}
              className="cursor-pointer"
              style={{ padding: "7px 10px", fontSize: "13px", color: "#333", background: o.code === value ? "#e8edf2" : "white" }}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.code); setOpen(false); setSearch(""); }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f4f8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = o.code === value ? "#e8edf2" : "white"; }}
            >
              {o.label}
            </div>
          ))}
          {hasMore && (
            <div style={{ padding: "5px 10px", fontSize: "11px", color: "#999", borderTop: "1px solid #e8edf2", background: "#fafbfc" }}>
              Showing {MAX_VISIBLE} of {filtered.length} — type to filter
            </div>
          )}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-50 w-full bg-white border" style={{ borderColor: "#ccd3da", borderRadius: "0 0 3px 3px", top: "100%", left: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
          <div style={{ padding: "7px 10px", fontSize: "12px", color: "#999" }}>No results found</div>
        </div>
      )}
    </div>
  );
}
