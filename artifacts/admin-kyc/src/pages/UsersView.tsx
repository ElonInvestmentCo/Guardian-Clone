import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllUsers,
  suspendUser,
  banUser,
  reactivateUser,
  type AdminUser,
  type UserStatus,
} from "@/lib/api";
import { formatDateShort } from "@/lib/utils";
import { RiskBadge, StatusBadge } from "@/components/Badges";
import CreateUserModal from "@/components/CreateUserModal";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "",          label: "All" },
  { value: "pending",   label: "Pending" },
  { value: "approved",  label: "Approved" },
  { value: "verified",  label: "Verified" },
  { value: "rejected",  label: "Rejected" },
  { value: "suspended", label: "Suspended" },
  { value: "banned",    label: "Banned" },
];

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: "",           label: "All Roles" },
  { value: "user",       label: "User" },
  { value: "vip",        label: "VIP" },
  { value: "restricted", label: "Restricted" },
  { value: "admin",      label: "Admin" },
];

type SortKey = "name" | "status" | "role" | "createdAt" | "riskScore" | "completedSteps" | "balance";

interface Props {
  onOpenProfile: (email: string) => void;
}

export default function UsersView({ onOpenProfile }: Props) {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter,   setRoleFilter]   = useState("");
  const [sortKey,      setSortKey]      = useState<SortKey>("createdAt");
  const [sortAsc,      setSortAsc]      = useState(false);
  const [showCreate,   setShowCreate]   = useState(false);
  const [actionMsg,    setActionMsg]    = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["all-users", statusFilter, roleFilter],
    queryFn: () => getAllUsers({ status: statusFilter || undefined, role: roleFilter || undefined }),
  });

  const showMsg = (type: "ok" | "err", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const suspendMut  = useMutation({ mutationFn: (email: string) => suspendUser(email),    onSuccess: () => { showMsg("ok", "User suspended");    qc.invalidateQueries({ queryKey: ["all-users"] }); }, onError: (e: Error) => showMsg("err", e.message) });
  const banMut      = useMutation({ mutationFn: (email: string) => banUser(email),        onSuccess: () => { showMsg("ok", "User banned");        qc.invalidateQueries({ queryKey: ["all-users"] }); }, onError: (e: Error) => showMsg("err", e.message) });
  const reactivateMut = useMutation({ mutationFn: (email: string) => reactivateUser(email), onSuccess: () => { showMsg("ok", "User reactivated"); qc.invalidateQueries({ queryKey: ["all-users"] }); }, onError: (e: Error) => showMsg("err", e.message) });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (data?.users ?? []).filter((u) =>
      !q || u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }, [data?.users, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":           cmp = a.name.localeCompare(b.name); break;
        case "status":         cmp = a.status.localeCompare(b.status); break;
        case "role":           cmp = a.role.localeCompare(b.role); break;
        case "riskScore":      cmp = a.riskScore - b.riskScore; break;
        case "completedSteps": cmp = a.completedSteps - b.completedSteps; break;
        case "balance":        cmp = a.balance - b.balance; break;
        case "createdAt":
        default:               cmp = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(); break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: "14px 20px", background: "white", borderBottom: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, flexWrap: "wrap", gap: "10px",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#111827" }}>Users</h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#6B7280", marginTop: "1px" }}>
            {isLoading ? "Loading…" : `${data?.total ?? 0} registered users`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {actionMsg && (
            <div style={{
              padding: "6px 12px", borderRadius: "4px", fontSize: "12px",
              background: actionMsg.type === "ok" ? "#F0FDF4" : "#FEF2F2",
              color: actionMsg.type === "ok" ? "#16A34A" : "#DC2626",
              border: `1px solid ${actionMsg.type === "ok" ? "#BBF7D0" : "#FECACA"}`,
            }}>
              {actionMsg.text}
            </div>
          )}
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: "7px 14px", borderRadius: "5px",
              background: "#16A34A", color: "white",
              border: "none", fontSize: "12px", fontWeight: "600",
              cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#15803D"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#16A34A"; }}
          >
            + New User
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              padding: "7px 16px", borderRadius: "5px",
              background: isFetching ? "#9CA3AF" : "#1E3A5F", color: "white",
              border: "none", fontSize: "12px", fontWeight: "600",
              cursor: isFetching ? "default" : "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (!isFetching) (e.currentTarget as HTMLElement).style.background = "#162D4A"; }}
            onMouseLeave={(e) => { if (!isFetching) (e.currentTarget as HTMLElement).style.background = "#1E3A5F"; }}
          >
            {isFetching ? "…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Search + Filters (responsive) ─────────────────────────────── */}
      <div style={{
        padding: "10px 20px", background: "white", borderBottom: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
        flexShrink: 0, overflowX: "auto",
      }}>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-[220px]"
          style={{
            padding: "6px 10px", borderRadius: "5px", border: "1px solid #E5E7EB",
            fontSize: "12px", color: "#374151", outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              style={{
                padding: "5px 10px", borderRadius: "4px",
                border: `1px solid ${statusFilter === value ? "#2563EB" : "#E5E7EB"}`,
                background: statusFilter === value ? "#EFF6FF" : "transparent",
                color: statusFilter === value ? "#2563EB" : "#6B7280",
                fontSize: "12px", fontWeight: statusFilter === value ? "700" : "400",
                cursor: "pointer", transition: "all 0.12s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #E5E7EB", fontSize: "12px", color: "#374151", cursor: "pointer" }}
        >
          {ROLE_FILTERS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <span style={{ marginLeft: "auto", fontSize: "11px", color: "#9CA3AF" }}>
          {sorted.length} result{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr>
                    <Th label="User"          sortable sKey="name"           sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                    <Th label="Status"        sortable sKey="status"         sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                    <Th label="Role"          sortable sKey="role"           sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                    <Th label="Risk"          sortable sKey="riskScore"      sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                    <Th label="KYC Progress"  sortable sKey="completedSteps" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                    <Th label="Balance"       sortable sKey="balance"        sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                    <Th label="Registered"    sortable sKey="createdAt"      sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                    <Th label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((user) => (
                    <UserRow
                      key={user.email}
                      user={user}
                      onOpenProfile={onOpenProfile}
                      onSuspend={(e) => suspendMut.mutate(e)}
                      onBan={(e) => banMut.mutate(e)}
                      onReactivate={(e) => reactivateMut.mutate(e)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="block sm:hidden p-4 space-y-3">
              {sorted.map((user) => (
                <MobileUserCard
                  key={user.email}
                  user={user}
                  onOpenProfile={onOpenProfile}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ["all-users"] });
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function Th({
  label, sortable, sKey, sortKey, sortAsc, onSort,
}: {
  label: string; sortable?: boolean; sKey?: SortKey;
  sortKey?: SortKey; sortAsc?: boolean; onSort?: (k: SortKey) => void;
}) {
  const active = sortable && sKey && sortKey === sKey;
  return (
    <th
      onClick={sortable && sKey && onSort ? () => onSort(sKey) : undefined}
      style={{
        padding: "10px 14px", textAlign: "left",
        fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em",
        textTransform: "uppercase", color: "#6B7280",
        background: "#F9FAFB", borderBottom: "1px solid #E5E7EB",
        cursor: sortable ? "pointer" : "default",
        userSelect: "none", whiteSpace: "nowrap",
        position: "sticky", top: 0, zIndex: 1,
      }}
      onMouseEnter={(e) => { if (sortable) (e.currentTarget as HTMLElement).style.color = "#374151"; }}
      onMouseLeave={(e) => { if (sortable) (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
    >
      {label}
      {active && <span style={{ marginLeft: "4px", color: "#2563EB" }}>{sortAsc ? "↑" : "↓"}</span>}
    </th>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    vip:        { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
    admin:      { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
    restricted: { bg: "#FDF4FF", text: "#9333EA", border: "#E9D5FF" },
    user:       { bg: "#F9FAFB", text: "#374151", border: "#E5E7EB" },
  };
  const c = map[role] ?? map.user;
  return (
    <span style={{
      display: "inline-block",
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: "4px", padding: "2px 7px",
      fontSize: "11px", fontWeight: "600",
      textTransform: "capitalize",
    }}>
      {role}
    </span>
  );
}

function UserRow({ user, onOpenProfile, onSuspend, onBan, onReactivate }: {
  user: AdminUser;
  onOpenProfile: (email: string) => void;
  onSuspend: (email: string) => void;
  onBan: (email: string) => void;
  onReactivate: (email: string) => void;
}) {
  const canSuspend   = user.status === "approved" || user.status === "verified" || user.status === "pending";
  const canBan       = user.status !== "banned";
  const canReactivate = user.status === "suspended" || user.status === "banned";

  return (
    <tr
      style={{ borderBottom: "1px solid #E5E7EB", background: "white" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white"; }}
    >
      <td style={{ padding: "12px 14px" }}>
        <div style={{ fontWeight: "600", color: "#111827", whiteSpace: "nowrap" }}>{user.name}</div>
        <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{user.email}</div>
        {user.flagCount > 0 && (
          <div style={{ fontSize: "10px", color: "#DC2626", marginTop: "2px" }}>⚑ {user.flagCount} flag{user.flagCount !== 1 ? "s" : ""}</div>
        )}
      </td>
      <td style={{ padding: "12px 14px" }}><StatusBadge status={user.status as UserStatus} /></td>
      <td style={{ padding: "12px 14px" }}><RoleBadge role={user.role} /></td>
      <td style={{ padding: "12px 14px" }}>
        <RiskBadge level={user.riskLevel} score={user.riskScore} />
      </td>
      <td style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "52px", height: "4px", borderRadius: "2px", background: "#E5E7EB", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.round((user.completedSteps / user.totalSteps) * 100)}%`, background: "#2563EB", borderRadius: "2px" }} />
          </div>
          <span style={{ fontSize: "11px", color: "#6B7280", whiteSpace: "nowrap" }}>{user.completedSteps}/{user.totalSteps}</span>
        </div>
      </td>
      <td style={{ padding: "12px 14px", color: "#374151", fontSize: "12px", whiteSpace: "nowrap" }}>
        ${user.balance.toLocaleString()}
      </td>
      <td style={{ padding: "12px 14px", color: "#6B7280", fontSize: "12px", whiteSpace: "nowrap" }}>
        {formatDateShort(user.createdAt)}
      </td>
      <td style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap" }}>
          <QuickBtn label="View" color="#2563EB" hoverColor="#1D4ED8" onClick={() => onOpenProfile(user.email)} />
          {canReactivate && <QuickBtn label="Reactivate" color="#16A34A" hoverColor="#15803D" onClick={() => onReactivate(user.email)} />}
          {canSuspend    && <QuickBtn label="Suspend"    color="#EA580C" hoverColor="#C2410C" onClick={() => onSuspend(user.email)} />}
          {canBan        && <QuickBtn label="Ban"        color="#DC2626" hoverColor="#B91C1C" onClick={() => onBan(user.email)} />}
        </div>
      </td>
    </tr>
  );
}

function QuickBtn({ label, color, hoverColor, onClick }: {
  label: string; color: string; hoverColor: string; onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        padding: "4px 8px", borderRadius: "4px", border: "none",
        background: color, color: "white",
        fontSize: "11px", fontWeight: "600",
        cursor: "pointer", whiteSpace: "nowrap",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = hoverColor; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = color; }}
    >
      {label}
    </button>
  );
}

function MobileUserCard({ user, onOpenProfile }: { user: AdminUser; onOpenProfile: (email: string) => void }) {
  return (
    <button
      onClick={() => onOpenProfile(user.email)}
      style={{
        display: "flex", gap: "12px", alignItems: "flex-start",
        width: "100%", padding: "14px 16px", borderRadius: "8px",
        background: "white", border: "1px solid #E5E7EB",
        cursor: "pointer", textAlign: "left",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: "700", fontSize: "13px", color: "#111827" }}>{user.name}</div>
        <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "8px" }}>{user.email}</div>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          <StatusBadge status={user.status as UserStatus} />
          <RoleBadge role={user.role} />
          <RiskBadge level={user.riskLevel} score={user.riskScore} />
        </div>
      </div>
      <span style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: "600", flexShrink: 0 }}>View →</span>
    </button>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", gap: "12px" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid #E5E7EB", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>Loading users…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
      <p style={{ color: "#DC2626", fontSize: "13px", margin: "0 0 12px" }}>Failed to load users.</p>
      <button onClick={onRetry} style={{ padding: "7px 18px", borderRadius: "5px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
        Try Again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>👥</div>
      <p style={{ color: "#374151", fontSize: "14px", fontWeight: "600", margin: "0 0 6px" }}>No users found.</p>
      <p style={{ color: "#9CA3AF", fontSize: "12px", margin: 0 }}>Try adjusting your search or filters.</p>
    </div>
  );
}
