import { useState, useEffect, useMemo, useCallback } from "react";
import { getApiBase } from "@/lib/api";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, BarChart3, ArrowRightLeft, InboxIcon, X } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import TradingViewChart from "@/components/TradingViewChart";

function EmptyState({ icon: Icon, title, message }: { icon: React.ElementType; title: string; message: string }) {
  const { colors } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center py-12" style={{ color: colors.textMuted }}>
      <div className="flex items-center justify-center rounded-xl mb-4" style={{ width: "56px", height: "56px", background: colors.filterBar }}>
        <Icon size={24} color={colors.textMuted} />
      </div>
      <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textSub, marginBottom: "4px" }}>{title}</p>
      <p style={{ fontSize: "12px", color: colors.textMuted, textAlign: "center" }}>{message}</p>
    </div>
  );
}

type ModalType = "deposit" | "withdrawal" | null;

interface FundModalProps {
  type: ModalType;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  colors: Record<string, string>;
  email: string;
}

function FundModal({ type, onClose, onSuccess, colors, email }: FundModalProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!type) return null;

  const label = type === "deposit" ? "Deposit" : "Withdraw";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(parsed) || parsed <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getApiBase()}/api/user/fund-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type, amount: parsed, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      onSuccess(`Your ${label.toLowerCase()} request for $${parsed.toLocaleString(undefined, { minimumFractionDigits: 2 })} has been submitted. We'll process it within 1-3 business days.`);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl w-full mx-4"
        style={{ maxWidth: "420px", background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p style={{ fontSize: "18px", fontWeight: 700, color: colors.textPrimary }}>{label} Funds</p>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>
              {type === "deposit" ? "Add funds to your account" : "Request a withdrawal from your account"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: colors.filterBar, border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <X size={16} color={colors.textMuted} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label style={{ fontSize: "12px", fontWeight: 600, color: colors.textSub, display: "block", marginBottom: "6px" }}>
              Amount (USD)
            </label>
            <div className="flex items-center rounded-xl" style={{ border: `1px solid ${colors.cardBorder}`, background: colors.filterBar, padding: "0 14px" }}>
              <span style={{ fontSize: "15px", color: colors.textMuted, marginRight: "6px" }}>$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "15px",
                  color: colors.textPrimary,
                  padding: "12px 0",
                  fontWeight: 600,
                }}
              />
            </div>
          </div>

          <div className="mb-6">
            <label style={{ fontSize: "12px", fontWeight: 600, color: colors.textSub, display: "block", marginBottom: "6px" }}>
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional details for your request…"
              maxLength={500}
              rows={3}
              style={{
                width: "100%",
                background: colors.filterBar,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: "12px",
                padding: "10px 14px",
                fontSize: "13px",
                color: colors.textPrimary,
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: "12px", color: colors.red, marginBottom: "12px", padding: "8px 12px", background: `${colors.red}18`, borderRadius: "8px" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: "12px", fontSize: "13px", fontWeight: 600,
                border: `1px solid ${colors.btnBorder}`, borderRadius: "12px",
                background: colors.btnBg, color: colors.textSub, cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: "12px", fontSize: "13px", fontWeight: 600,
                border: "none", borderRadius: "12px",
                background: type === "deposit" ? colors.accent : colors.red,
                color: "#fff", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Submitting…" : `Request ${label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Overview() {
  const { colors } = useTheme();
  const email = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("signupEmail") ?? "" : "";

  const [balance, setBalance] = useState(0);
  const [profit, setProfit] = useState(0);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchBalance = useCallback(() => {
    if (!email) return;
    const base = getApiBase();
    fetch(`${base}/api/user/balance/${encodeURIComponent(email)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Balance fetch failed: ${r.status}`);
        return r.json();
      })
      .then((d: { balance?: number; profit?: number }) => {
        setBalance(d.balance ?? 0);
        setProfit(d.profit ?? 0);
      })
      .catch((err) => {
        console.warn("[Overview] Could not load balance:", err);
      });
  }, [email]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const currentVal = balance;
  const pChange = profit;
  const pPct = balance > 0 && (balance - profit) > 0 ? (profit / (balance - profit)) * 100 : 0;

  const statCards = useMemo(() => [
    { icon: Wallet, label: "Portfolio Value", value: `$${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: balance > 0 ? `${pChange >= 0 ? "+" : ""}${pPct.toFixed(2)}% total return` : "No activity yet", positive: pChange >= 0, gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
    { icon: TrendingUp, label: "Today's P&L", value: balance > 0 ? `${pChange >= 0 ? "+" : ""}$${Math.abs(pChange).toFixed(2)}` : "--", sub: balance > 0 ? "Total profit/loss" : "No trades yet", positive: pChange >= 0, gradient: "linear-gradient(135deg, #10b981, #059669)" },
    { icon: BarChart3, label: "Buying Power", value: balance > 0 ? `$${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "--", sub: balance > 0 ? "Available balance" : "Fund your account", positive: true, gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)" },
    { icon: ArrowRightLeft, label: "Open Trades", value: "0", sub: "No active positions", positive: true, gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
  ], [currentVal, balance, pChange, pPct]);

  return (
    <DashboardLayout>
      <div className="flex flex-col xl:flex-row" style={{ minHeight: "100%" }}>
        <div className="flex-1 overflow-y-auto" style={{ padding: "24px 20px" }}>

          {/* Mobile account equity + buttons — hidden on xl where the aside handles this */}
          <div className="xl:hidden rounded-xl mb-5" style={{ background: colors.rightPanel, border: `1px solid ${colors.rightPanelBorder}`, padding: "18px 20px" }}>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Account Equity</p>
            <p style={{ fontSize: "26px", fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.03em", marginBottom: "12px" }}>
              ${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setModalType("deposit")}
                style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "10px", background: colors.accent, color: "#fff", cursor: "pointer" }}
              >
                Deposit
              </button>
              <button
                onClick={() => setModalType("withdrawal")}
                style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, border: `1px solid ${colors.btnBorder}`, borderRadius: "10px", background: colors.btnBg, color: colors.textSub, cursor: "pointer" }}
              >
                Withdraw
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="rounded-xl mb-5 flex items-start gap-3" style={{ background: `${colors.green}18`, border: `1px solid ${colors.green}44`, padding: "14px 18px" }}>
              <ArrowUpRight size={16} color={colors.green} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: colors.green, marginBottom: "2px" }}>Request Submitted</p>
                <p style={{ fontSize: "12px", color: colors.textSub }}>{successMsg}</p>
              </div>
              <button onClick={() => setSuccessMsg("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                <X size={14} color={colors.textMuted} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((c) => (
              <div key={c.label} className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 18px" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontSize: "12px", color: colors.textMuted, fontWeight: 500 }}>{c.label}</p>
                    <div className="flex items-center justify-center rounded-lg" style={{ width: "32px", height: "32px", background: c.gradient }}>
                      <c.icon size={16} color="#fff" />
                    </div>
                  </div>
                  <p style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.02em", marginBottom: "4px" }}>{c.value}</p>
                  <div className="flex items-center gap-1">
                    {c.positive ? <ArrowUpRight size={12} color={colors.green} /> : <ArrowDownRight size={12} color={colors.red} />}
                    <span style={{ fontSize: "11px", fontWeight: 600, color: c.positive ? colors.green : colors.red }}>{c.sub}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl mb-6" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 12px" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>Market Chart</p>
              <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>AAPL — Advanced Chart</p>
            </div>
            <TradingViewChart />
          </div>

          <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>Recent Trades</p>
                <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>Latest market activity</p>
              </div>
            </div>
            <EmptyState
              icon={InboxIcon}
              title="No trades yet"
              message="Your recent trading activity will appear here once you start trading."
            />
          </div>
        </div>

        <aside className="hidden xl:flex flex-col flex-shrink-0 overflow-y-auto" style={{
          width: "300px", background: colors.rightPanel, borderLeft: `1px solid ${colors.rightPanelBorder}`, padding: "24px 20px",
        }}>
          <div className="mb-5">
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Account Equity</p>
            <p style={{ fontSize: "28px", fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.03em" }}>
              ${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            {balance > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight size={12} color={colors.green} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: colors.green }}>
                  +${pChange.toFixed(2)} ({pPct.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setModalType("deposit")}
              style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "10px", background: colors.accent, color: "#fff", cursor: "pointer" }}
            >
              Deposit
            </button>
            <button
              onClick={() => setModalType("withdrawal")}
              style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, border: `1px solid ${colors.btnBorder}`, borderRadius: "10px", background: colors.btnBg, color: colors.textSub, cursor: "pointer" }}
            >
              Withdraw
            </button>
          </div>

          <div className="rounded-xl p-4" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary, marginBottom: "8px" }}>Asset Allocation</p>
            <EmptyState
              icon={PieIcon}
              title="No assets yet"
              message="Your portfolio allocation will appear here once you make your first trade."
            />
          </div>
        </aside>
      </div>

      <FundModal
        type={modalType}
        onClose={() => setModalType(null)}
        onSuccess={(msg) => setSuccessMsg(msg)}
        colors={colors}
        email={email}
      />
    </DashboardLayout>
  );
}

function PieIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
    </svg>
  );
}
