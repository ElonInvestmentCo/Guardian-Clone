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
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, color: "#1E293B", fontSize: 16 }}>Users</h5>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              {isLoading ? "Loading…" : `${data?.total ?? 0} registered users`}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {actionMsg && (
              <div className={`alert ${actionMsg.type === "ok" ? "alert-success" : "alert-danger"} py-1 px-3 mb-0`} style={{ fontSize: 12 }}>
                {actionMsg.text}
              </div>
            )}
            <button className="btn btn-success btn-sm" onClick={() => setShowCreate(true)}>
              <i className="bi bi-plus me-1" />New User
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => refetch()} disabled={isFetching}>
              <i className="bi bi-arrow-clockwise me-1" />
              {isFetching ? "…" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="admin-filter-bar" style={{ marginTop: 12 }}>
          <div style={{ position: "relative", flex: "0 1 220px", minWidth: 160 }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 13 }} />
            <input
              type="text"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control form-control-sm"
              style={{ paddingLeft: 32, fontSize: 12 }}
            />
          </div>
          <div className="admin-status-filters">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                className={`btn btn-sm ${statusFilter === value ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setStatusFilter(value)}
                style={{ fontSize: 11 }}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            className="form-select form-select-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: 120, fontSize: 12 }}
          >
            {ROLE_FILTERS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8" }}>
            {sorted.length} result{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="table-responsive">
          <table className="table-safee">
            <thead>
              <tr>
                <ThSort label="User" sKey="name" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                <ThSort label="Status" sKey="status" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                <ThSort label="Role" sKey="role" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                <ThSort label="Risk" sKey="riskScore" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                <ThSort label="KYC" sKey="completedSteps" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                <ThSort label="Balance" sKey="balance" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                <ThSort label="Registered" sKey="createdAt" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                <th>Actions</th>
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

function ThSort({ label, sKey, sortKey, sortAsc, onSort }: {
  label: string; sKey: SortKey; sortKey: SortKey; sortAsc: boolean; onSort: (k: SortKey) => void;
}) {
  const active = sortKey === sKey;
  return (
    <th onClick={() => onSort(sKey)} style={{ cursor: "pointer" }}>
      {label}
      {active && <span style={{ marginLeft: 4, color: "#0D6EFD" }}>{sortAsc ? "↑" : "↓"}</span>}
    </th>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    vip: "bg-warning text-dark",
    admin: "bg-primary",
    restricted: "bg-info",
    user: "bg-secondary",
  };
  return (
    <span className={`badge ${map[role] ?? "bg-secondary"}`} style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>
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
    <tr>
      <td>
        <div style={{ fontWeight: 600, color: "#1E293B" }}>{user.name}</div>
        <div style={{ fontSize: 11, color: "#94A3B8" }}>{user.email}</div>
        {user.flagCount > 0 && (
          <div style={{ fontSize: 10, color: "#DC3545", marginTop: 2 }}>⚑ {user.flagCount} flag{user.flagCount !== 1 ? "s" : ""}</div>
        )}
      </td>
      <td><StatusBadge status={user.status as UserStatus} /></td>
      <td><RoleBadge role={user.role} /></td>
      <td><RiskBadge level={user.riskLevel} score={user.riskScore} /></td>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 52, height: 4, borderRadius: 2, background: "#E5E7EB", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.round((user.completedSteps / user.totalSteps) * 100)}%`, background: "#0D6EFD", borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 11, color: "#64748B" }}>{user.completedSteps}/{user.totalSteps}</span>
        </div>
      </td>
      <td style={{ fontSize: 12, color: "#3C4858" }}>${user.balance.toLocaleString()}</td>
      <td style={{ fontSize: 12, color: "#64748B" }}>{formatDateShort(user.createdAt)}</td>
      <td>
        <div style={{ display: "flex", gap: 4, flexWrap: "nowrap" }}>
          <button className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: "2px 8px" }} onClick={(e) => { e.stopPropagation(); onOpenProfile(user.email); }}>View</button>
          {canReactivate && <button className="btn btn-success btn-sm" style={{ fontSize: 11, padding: "2px 8px" }} onClick={(e) => { e.stopPropagation(); onReactivate(user.email); }}>Reactivate</button>}
          {canSuspend    && <button className="btn btn-warning btn-sm" style={{ fontSize: 11, padding: "2px 8px" }} onClick={(e) => { e.stopPropagation(); onSuspend(user.email); }}>Suspend</button>}
          {canBan        && <button className="btn btn-danger btn-sm" style={{ fontSize: 11, padding: "2px 8px" }} onClick={(e) => { e.stopPropagation(); onBan(user.email); }}>Ban</button>}
        </div>
      </td>
    </tr>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 12 }}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Loading users…</p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: 32 }} />
      <p style={{ color: "#DC3545", fontSize: 13, margin: "12px 0" }}>Failed to load users.</p>
      <button className="btn btn-outline-primary btn-sm" onClick={onRetry}>Try Again</button>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center" }}>
      <i className="bi bi-people text-muted" style={{ fontSize: 40 }} />
      <p style={{ fontWeight: 600, fontSize: 14, margin: "12px 0 6px" }}>No users found.</p>
      <p style={{ color: "#94A3B8", fontSize: 12, margin: 0 }}>Try adjusting your search or filters.</p>
    </div>
  );
}
