import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminOrders,
  type AdminOrder,
  type OrderSide,
  type OrderStatus,
} from "@/lib/api";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): { date: string; time: string } {
  if (!iso) return { date: "—", time: "" };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

function fmt(n: number | null, decimals = 2): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ── Badges ───────────────────────────────────────────────────────────────────

function SideBadge({ side }: { side: OrderSide }) {
  const isBuy = side === "Buy";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
      background: isBuy ? "rgba(25,135,84,0.12)" : "rgba(220,53,69,0.12)",
      color: isBuy ? "#198754" : "#DC3545",
      border: `1px solid ${isBuy ? "rgba(25,135,84,0.22)" : "rgba(220,53,69,0.22)"}`,
      letterSpacing: "0.03em",
    }}>
      <i className={`bi ${isBuy ? "bi-arrow-up-right" : "bi-arrow-down-left"}`} style={{ fontSize: 10 }} />
      {side}
    </span>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { bg: string; color: string; border: string }> = {
    Active:    { bg: "rgba(13,110,253,0.1)",  color: "#0D6EFD", border: "rgba(13,110,253,0.2)"  },
    Filled:    { bg: "rgba(25,135,84,0.1)",   color: "#198754", border: "rgba(25,135,84,0.2)"   },
    Cancelled: { bg: "rgba(108,117,125,0.1)", color: "#6C757D", border: "rgba(108,117,125,0.2)" },
    Pending:   { bg: "rgba(255,193,7,0.1)",   color: "#997404", border: "rgba(255,193,7,0.25)"  },
  };
  const s = map[status] ?? map.Pending;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 999,
      fontSize: 12, fontWeight: 600, background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {status}
    </span>
  );
}

// ── Column sort ───────────────────────────────────────────────────────────────

type SortKey = "createdAt" | "symbol" | "side" | "type" | "qty" | "price" | "filled" | "status" | "email";

function SortIcon({ col, sortKey, sortAsc }: { col: SortKey; sortKey: SortKey; sortAsc: boolean }) {
  if (col !== sortKey) return <i className="bi bi-chevron-expand" style={{ fontSize: 10, opacity: 0.35, marginLeft: 4 }} />;
  return <i className={`bi bi-chevron-${sortAsc ? "up" : "down"}`} style={{ fontSize: 10, marginLeft: 4, color: "#0D6EFD" }} />;
}

// ── Filter config ─────────────────────────────────────────────────────────────

const STATUS_TABS: { value: OrderStatus | ""; label: string }[] = [
  { value: "",           label: "All" },
  { value: "Active",    label: "Active" },
  { value: "Filled",    label: "Filled" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Pending",   label: "Pending" },
];

const SIDE_OPTIONS: { value: OrderSide | ""; label: string }[] = [
  { value: "", label: "Both sides" },
  { value: "Buy",  label: "Buy only" },
  { value: "Sell", label: "Sell only" },
];

// ── Main view ─────────────────────────────────────────────────────────────────

export default function OrdersView() {
  const [statusTab,  setStatusTab]  = useState<OrderStatus | "">("");
  const [sideFilter, setSideFilter] = useState<OrderSide | "">("");
  const [search,     setSearch]     = useState("");
  const [sortKey,    setSortKey]    = useState<SortKey>("createdAt");
  const [sortAsc,    setSortAsc]    = useState(false);
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-orders", statusTab, sideFilter],
    queryFn: () => getAdminOrders({
      status: statusTab   || undefined,
      side:   sideFilter  || undefined,
    }),
    staleTime: 20_000,
  });

  const orders = data?.orders ?? [];

  // client-side search + sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = q
      ? orders.filter(o =>
          o.email.toLowerCase().includes(q) ||
          o.symbol.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
        )
      : orders;

    return [...base].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "symbol":    cmp = a.symbol.localeCompare(b.symbol); break;
        case "side":      cmp = a.side.localeCompare(b.side); break;
        case "type":      cmp = a.type.localeCompare(b.type); break;
        case "status":    cmp = a.status.localeCompare(b.status); break;
        case "email":     cmp = a.email.localeCompare(b.email); break;
        case "qty":       cmp = a.qty - b.qty; break;
        case "price":     cmp = (a.price ?? 0) - (b.price ?? 0); break;
        case "filled":    cmp = a.filled - b.filled; break;
        case "createdAt":
        default:          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [orders, search, sortKey, sortAsc]);

  // stats (always from unfiltered orders set)
  const totalOrders  = orders.length;
  const filledCount  = orders.filter(o => o.status === "Filled").length;
  const activeCount  = orders.filter(o => o.status === "Active").length;
  const buyCount     = orders.filter(o => o.side === "Buy").length;
  const sellCount    = orders.filter(o => o.side === "Sell").length;
  const totalVolume  = orders.filter(o => o.status === "Filled").reduce((s, o) => s + (o.price ?? 0) * o.filled, 0);

  const toggleSort = (col: SortKey) => {
    if (sortKey === col) setSortAsc(a => !a);
    else { setSortKey(col); setSortAsc(false); }
  };

  const th = (col: SortKey, label: string, align: "left" | "right" = "left") => (
    <th
      onClick={() => toggleSort(col)}
      style={{ cursor: "pointer", userSelect: "none", textAlign: align, whiteSpace: "nowrap" }}
    >
      {label}<SortIcon col={col} sortKey={sortKey} sortAsc={sortAsc} />
    </th>
  );

  return (
    <div style={{ padding: "24px 28px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary, #1a202c)", margin: 0 }}>
            Orders
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted, #64748B)", margin: "4px 0 0" }}>
            All user trades across the platform
          </p>
        </div>
        <button
          onClick={() => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); refetch(); }}
          disabled={isFetching}
          className="btn btn-secondary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <i className={`bi bi-arrow-clockwise${isFetching ? " spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          {
            label: "Total Orders",
            value: totalOrders,
            sub: `${filledCount} filled · ${activeCount} active`,
            color: "#0D6EFD",
            bg: "rgba(13,110,253,0.08)",
            icon: "bi-receipt",
          },
          {
            label: "Buy / Sell Split",
            value: `${buyCount} / ${sellCount}`,
            sub: totalOrders > 0 ? `${Math.round((buyCount / totalOrders) * 100)}% buy` : "No orders",
            color: "#198754",
            bg: "rgba(25,135,84,0.08)",
            icon: "bi-arrows-exchange",
          },
          {
            label: "Filled Volume",
            value: `$${totalVolume >= 1_000_000
              ? (totalVolume / 1_000_000).toFixed(2) + "M"
              : totalVolume >= 1_000
              ? (totalVolume / 1_000).toFixed(1) + "K"
              : fmt(totalVolume, 0)}`,
            sub: "Executed value (price × qty)",
            color: "#7A5AF8",
            bg: "rgba(122,90,248,0.08)",
            icon: "bi-currency-dollar",
          },
        ].map(s => (
          <div key={s.label} style={{
            padding: "14px 18px", borderRadius: 12,
            background: s.bg, border: `1px solid ${s.color}22`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <i className={`bi ${s.icon}`} style={{ fontSize: 22, color: s.color, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {s.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary, #1a202c)", lineHeight: 1.2, marginTop: 2 }}>
                {isLoading ? "…" : s.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted, #64748B)", marginTop: 2 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>

        {/* Status tabs */}
        <div style={{
          display: "flex", background: "var(--table-hover, #f1f2f7)",
          borderRadius: 8, padding: 3, gap: 2,
        }}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusTab(tab.value)}
              style={{
                padding: "5px 13px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                background: statusTab === tab.value ? "var(--card-bg, #fff)" : "transparent",
                color: statusTab === tab.value ? "var(--text-primary, #1a202c)" : "var(--text-muted, #64748B)",
                boxShadow: statusTab === tab.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Side filter */}
        <select
          value={sideFilter}
          onChange={e => setSideFilter(e.target.value as OrderSide | "")}
          style={{
            border: "1px solid var(--border-color, #e5e7eb)",
            borderRadius: 8, padding: "6px 28px 6px 10px",
            fontSize: 13, fontWeight: 500,
            background: "var(--input-bg, #fff)",
            color: "var(--text-primary, #1a202c)",
            cursor: "pointer", outline: "none",
            appearance: "auto",
          }}
        >
          {SIDE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 320 }}>
          <i className="bi bi-search" style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted, #94A3B8)", fontSize: 13, pointerEvents: "none",
          }} />
          <input
            type="text"
            placeholder="Search email or symbol..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "7px 10px 7px 30px",
              border: "1px solid var(--border-color, #e5e7eb)",
              borderRadius: 8, fontSize: 13,
              background: "var(--input-bg, #fff)",
              color: "var(--text-primary, #1a202c)",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted, #64748B)", fontWeight: 500 }}>
          {filtered.length.toLocaleString()} {filtered.length === 1 ? "order" : "orders"}
        </div>
      </div>

      {/* Table */}
      <div className="card-safee" style={{ overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted, #94A3B8)" }}>
            <div className="spinner-border" style={{ width: 28, height: 28 }} role="status" />
            <div style={{ marginTop: 12, fontSize: 13 }}>Loading orders...</div>
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <i className="bi bi-exclamation-circle" style={{ fontSize: 32, color: "#DC3545", display: "block", marginBottom: 10 }} />
            <div style={{ fontSize: 14, color: "var(--text-muted, #64748B)", marginBottom: 14 }}>Failed to load orders</div>
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <i className="bi bi-inbox" style={{ fontSize: 36, color: "var(--text-muted, #94A3B8)", display: "block", marginBottom: 10 }} />
            <div style={{ fontSize: 14, color: "var(--text-muted, #64748B)" }}>
              {search ? "No orders match your search" : "No orders found"}
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-safee">
              <thead>
                <tr>
                  {th("symbol",    "Symbol")}
                  {th("side",      "Side")}
                  {th("type",      "Type")}
                  {th("qty",       "Qty",    "right")}
                  {th("price",     "Price",  "right")}
                  {th("filled",    "Filled", "right")}
                  {th("status",    "Status")}
                  {th("email",     "User")}
                  {th("createdAt", "Date / Time")}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const { date, time } = formatDateTime(order.createdAt);
                  const fillPct = order.qty > 0 ? Math.round((order.filled / order.qty) * 100) : 0;
                  return (
                    <tr key={order.id}>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.04em", color: "var(--text-primary, #1a202c)" }}>
                          {order.symbol}
                        </span>
                      </td>
                      <td><SideBadge side={order.side} /></td>
                      <td>
                        <span style={{ fontSize: 12, color: "var(--text-muted, #64748B)", fontWeight: 500 }}>
                          {order.type}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{fmt(order.qty, 4)}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 13, color: "var(--text-primary, #1a202c)" }}>
                          {order.price !== null ? `$${fmt(order.price)}` : <span style={{ color: "var(--text-muted, #94A3B8)" }}>Market</span>}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{fmt(order.filled, 4)}</span>
                          {order.qty > 0 && order.status !== "Cancelled" && (
                            <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                              <div style={{
                                width: 48, height: 4, borderRadius: 2,
                                background: "var(--border-color, #e5e7eb)", overflow: "hidden",
                              }}>
                                <div style={{
                                  height: "100%", borderRadius: 2,
                                  width: `${fillPct}%`,
                                  background: fillPct === 100 ? "#198754" : "#0D6EFD",
                                  transition: "width 0.3s",
                                }} />
                              </div>
                              <span style={{ fontSize: 10, color: "var(--text-muted, #94A3B8)", minWidth: 26 }}>{fillPct}%</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>
                        <span style={{ fontSize: 12, color: "var(--text-muted, #64748B)", fontWeight: 500 }}>
                          {order.email}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: 12, color: "var(--text-primary, #1a202c)", fontWeight: 500 }}>{date}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted, #94A3B8)", marginTop: 1 }}>{time}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
