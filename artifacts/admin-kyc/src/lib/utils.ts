import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskLevel, UserStatus } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch { return iso; }
}

export function formatDateShort(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

export function riskColors(level: RiskLevel): { bg: string; text: string; border: string } {
  switch (level) {
    case "critical": return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" };
    case "high":     return { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" };
    case "medium":   return { bg: "#FEFCE8", text: "#CA8A04", border: "#FEF08A" };
    case "low":      return { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" };
  }
}

export function statusColors(status: UserStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case "approved":  return { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" };
    case "rejected":  return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" };
    case "resubmit":  return { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" };
    case "pending":   return { bg: "#F9FAFB", text: "#374151", border: "#E5E7EB" };
  }
}

export function statusLabel(status: UserStatus): string {
  switch (status) {
    case "approved": return "Approved";
    case "rejected": return "Rejected";
    case "resubmit": return "Resubmit";
    case "pending":  return "Pending";
  }
}

export function riskLabel(level: RiskLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function stepsPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getProfileField(profile: Record<string, unknown>, step: string, field: string): string {
  const stepData = profile[step] as Record<string, unknown> | undefined;
  const v = stepData?.[field];
  return v != null ? String(v) : "—";
}
