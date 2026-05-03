import { useState, useRef, useEffect } from "react";

export interface AddressFill {
  street: string;
  city: string;
  stateLong: string;
  stateShort: string;
  countryCode: string;
  zipCode: string;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const fieldStyle: React.CSSProperties = {
  background: "#e8edf2",
  border: "1px solid #ccd3da",
  borderRadius: "3px",
  padding: "9px 10px",
  color: "#333",
  fontSize: "13px",
  width: "100%",
};

function mkToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function AddressAutocomplete({
  value,
  onChange,
  onBlur,
  onAddressFill,
  hasError = false,
  placeholder = "Street address",
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  onAddressFill?: (fill: AddressFill) => void;
  hasError?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [filling, setFilling] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [manual, setManual] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(mkToken());
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = async (q: string) => {
    if (manual || q.trim().length < 3) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setFetching(true);
    try {
      const p = new URLSearchParams({ input: q.trim(), sessiontoken: sessionRef.current });
      const res = await fetch(`/api/places/autocomplete?${p}`, { signal: abortRef.current.signal });
      const data = await res.json() as { predictions?: Prediction[]; status?: string };
      if (data.status === "NO_API_KEY") {
        setManual(true);
        setFetching(false);
        return;
      }
      const preds = data.predictions ?? [];
      setPredictions(preds);
      setOpen(preds.length > 0);
      setActiveIdx(-1);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setPredictions([]);
        setOpen(false);
      }
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(e.target.value), 300);
  };

  const selectPrediction = async (pred: Prediction) => {
    onChange(pred.structured_formatting.main_text);
    setOpen(false);
    setPredictions([]);
    setActiveIdx(-1);

    if (!onAddressFill) {
      sessionRef.current = mkToken();
      return;
    }

    setFilling(true);
    try {
      const p = new URLSearchParams({ place_id: pred.place_id, sessiontoken: sessionRef.current });
      const res = await fetch(`/api/places/details?${p}`);
      const data = await res.json() as {
        result?: {
          address_components: Array<{ long_name: string; short_name: string; types: string[] }>;
        };
      };

      sessionRef.current = mkToken();

      const comps = data.result?.address_components ?? [];
      const get = (type: string, key: "long_name" | "short_name") =>
        comps.find((c) => c.types.includes(type))?.[key] ?? "";

      const streetNum = get("street_number", "long_name");
      const route = get("route", "long_name");
      const street = [streetNum, route].filter(Boolean).join(" ") || pred.structured_formatting.main_text;
      const city =
        get("locality", "long_name") ||
        get("postal_town", "long_name") ||
        get("sublocality_level_1", "long_name") ||
        get("administrative_area_level_2", "long_name");
      const stateLong = get("administrative_area_level_1", "long_name");
      const stateShort = get("administrative_area_level_1", "short_name");
      const countryCode = get("country", "short_name");
      const zipCode = get("postal_code", "long_name");

      onChange(street);
      onAddressFill({ street, city, stateLong, stateShort, countryCode, zipCode });
    } catch {
    } finally {
      setFilling(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || predictions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectPrediction(predictions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const busy = fetching || filling;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          value={value}
          onChange={handleChange}
          onBlur={() => { setTimeout(() => { setOpen(false); onBlur?.(); }, 150); }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (predictions.length > 0 && !manual) setOpen(true); }}
          placeholder={placeholder}
          disabled={disabled || filling}
          autoComplete="off"
          spellCheck={false}
          style={{
            ...fieldStyle,
            border: `1px solid ${hasError ? "#e53e3e" : "#ccd3da"}`,
            paddingRight: "32px",
            opacity: disabled || filling ? 0.65 : 1,
            transition: "opacity 0.15s",
          }}
          className="focus:outline-none"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
        />
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          {busy ? (
            <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" stroke="#ccd3da" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#3a7bd5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={predictions.length > 0 ? "#3a7bd5" : "#aaa"}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </div>
      </div>

      {open && predictions.length > 0 && (
        <div
          className="absolute z-50 w-full bg-white overflow-hidden"
          style={{
            border: "1px solid #ccd3da",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            top: "100%",
            left: 0,
            boxShadow: "0 6px 20px rgba(0,0,0,0.13)",
          }}
          role="listbox"
        >
          {predictions.map((pred, i) => (
            <div
              key={pred.place_id}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => { e.preventDefault(); selectPrediction(pred); }}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                padding: "9px 12px",
                cursor: "pointer",
                background: i === activeIdx ? "#eef3fb" : "white",
                borderBottom: i < predictions.length - 1 ? "1px solid #f2f5f8" : "none",
                minHeight: "44px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "2px",
              }}
            >
              <div style={{ fontSize: "13px", color: "#222", fontWeight: 500, lineHeight: 1.3 }}>
                {pred.structured_formatting.main_text}
              </div>
              <div style={{ fontSize: "11px", color: "#888", lineHeight: 1.3 }}>
                {pred.structured_formatting.secondary_text}
              </div>
            </div>
          ))}
          <div style={{
            padding: "5px 10px",
            background: "#fafbfc",
            borderTop: "1px solid #eef2f5",
            display: "flex",
            justifyContent: "flex-end",
          }}>
            <span style={{ fontSize: "9px", color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Powered by Google
            </span>
          </div>
        </div>
      )}

      <div style={{ marginTop: "3px", fontSize: "11px", color: "#bbb", lineHeight: 1.4 }}>
        {manual ? (
          <>
            Manual entry.{" "}
            <button
              type="button"
              onClick={() => setManual(false)}
              style={{ color: "#3a7bd5", background: "none", border: "none", padding: 0, fontSize: "11px", cursor: "pointer" }}
            >
              Enable suggestions
            </button>
          </>
        ) : (
          <>
            Type to search, or{" "}
            <button
              type="button"
              onClick={() => { setManual(true); setOpen(false); setPredictions([]); }}
              style={{ color: "#3a7bd5", background: "none", border: "none", padding: 0, fontSize: "11px", cursor: "pointer" }}
            >
              enter manually
            </button>
          </>
        )}
      </div>
    </div>
  );
}
