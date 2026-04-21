/**
 * Admin Notification System
 * Sends real-time email alerts to the admin for compliance-critical events.
 */

import { Resend } from "resend";

const FROM_ADDRESS   = "Guardian Trading <support@guardiiantrading.com>";
const COMPANY_LINE   = "Guardian Trading &mdash; A Division of Velocity Clearing, LLC. Member FINRA/SIPC.";
const ADDRESS_LINE   = "1301 Route 36, Suite 109, Hazlet, NJ 07730";
const SUPPORT_EMAIL  = "support@guardiiantrading.com";
const LOGO_URL       = "https://guardiiantrading.com/logo.png";

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

function getAdminEmail(): string {
  return (process.env["ADMIN_EMAIL"] ?? "").trim();
}

function getSignatureThreshold(): number {
  return parseInt(process.env["SIGNATURE_THRESHOLD"] ?? "10", 10);
}

async function getResendClient(): Promise<Resend | null> {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return null;
  return new Resend(key);
}

// ---------------------------------------------------------------------------
// Notification types
// ---------------------------------------------------------------------------

export type NotificationType =
  | "new_user"
  | "onboarding_complete"
  | "awaiting_approval"
  | "signature_submitted"
  | "signature_verified"
  | "high_pending_signatures"
  | "high_risk_user"
  | "admin_action"
  | "security_alert"
  | "daily_summary";

export interface AdminNotification {
  type: NotificationType;
  subject: string;
  bodyHtml: string;
  priority?: "high" | "low";
}

// ---------------------------------------------------------------------------
// Email shell
// ---------------------------------------------------------------------------

function notifShell(
  badgeLabel: string,
  badgeColor: string,
  badgeBg: string,
  title: string,
  subtitle: string,
  rows: string,
  cta?: { label: string; url?: string }
): string {
  const badge = `
    <td align="center" style="padding:28px 40px 0;">
      <span style="display:inline-block;padding:4px 14px;border-radius:20px;
                   background:${badgeBg};color:${badgeColor};
                   font-size:11px;font-weight:700;letter-spacing:0.08em;
                   text-transform:uppercase;">${badgeLabel}</span>
    </td>`;

  const ctaBlock = cta
    ? `<tr><td align="center" style="padding:20px 40px 8px;">
        <a href="${cta.url ?? "#"}"
           style="display:inline-block;padding:12px 28px;border-radius:6px;
                  background:#0D6EFD;color:#fff;font-size:13px;font-weight:700;
                  text-decoration:none;">
          ${cta.label}
        </a>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Guardian Admin Alert</title>
</head>
<body style="margin:0;padding:0;background:#eef1f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#eef1f6;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#ffffff;
                      border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- Header -->
          <tr>
            <td align="center"
                style="background:linear-gradient(135deg,#0d1b2e 0%,#1a3560 100%);
                       padding:28px 40px 20px;">
              <img src="${LOGO_URL}" alt="Guardian Trading" width="40" height="40"
                   style="display:block;margin:0 auto 10px;"/>
              <p style="margin:0;font-size:10px;font-weight:700;color:#5baad4;
                         letter-spacing:0.12em;text-transform:uppercase;">
                GUARDIAN TRADING &mdash; ADMIN ALERT
              </p>
            </td>
          </tr>

          <!-- Accent line -->
          <tr>
            <td style="background:linear-gradient(90deg,#3a7bd5,#5baad4);
                        height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Badge -->
          <tr>${badge}</tr>

          <!-- Title -->
          <tr>
            <td style="padding:16px 40px 0;">
              <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0d1b2e;">${title}</h1>
              <p style="margin:0;font-size:13px;color:#64748B;">${subtitle}</p>
            </td>
          </tr>

          <!-- Detail rows -->
          <tr>
            <td style="padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0;">
                ${rows}
              </table>
            </td>
          </tr>

          ${ctaBlock}

          <!-- Footer -->
          <tr>
            <td style="background:#f5f7fa;border-top:1px solid #e4e9f0;
                        padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#8a96a8;line-height:1.6;">
                ${COMPANY_LINE}<br/>${ADDRESS_LINE}
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#8a96a8;">
                <a href="mailto:${SUPPORT_EMAIL}"
                   style="color:#3a7bd5;text-decoration:none;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 16px;border-bottom:1px solid #E2E8F0;
               font-size:12px;font-weight:700;color:#374151;width:40%;
               vertical-align:top;">${label}</td>
    <td style="padding:10px 16px;border-bottom:1px solid #E2E8F0;
               font-size:12px;color:#0d1b2e;vertical-align:top;">${value}</td>
  </tr>`;
}

function lastRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#374151;
               width:40%;vertical-align:top;">${label}</td>
    <td style="padding:10px 16px;font-size:12px;color:#0d1b2e;vertical-align:top;">${value}</td>
  </tr>`;
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

async function sendAdminEmail(subject: string, html: string): Promise<void> {
  const to = getAdminEmail();
  if (!to) {
    console.warn("[AdminNotifier] ADMIN_EMAIL not set — skipping notification");
    return;
  }

  const client = await getResendClient();
  if (!client) {
    console.warn("[AdminNotifier] RESEND_API_KEY not set — skipping notification");
    return;
  }

  try {
    const result = await client.emails.send({ from: FROM_ADDRESS, to, subject, html });
    if (result.error) {
      console.error("[AdminNotifier] Resend error:", result.error.message);
    } else {
      console.log(`[AdminNotifier] Sent "${subject}" to ${to} — id: ${result.data?.id}`);
    }
  } catch (err) {
    console.error("[AdminNotifier] Send failed:", err instanceof Error ? err.message : err);
  }
}

// ---------------------------------------------------------------------------
// Notification builders
// ---------------------------------------------------------------------------

export async function notifyNewUser(params: {
  email: string;
  ipAddress?: string;
  registeredAt?: string;
}): Promise<void> {
  const ts = params.registeredAt
    ? new Date(params.registeredAt).toLocaleString("en-US", { timeZone: "America/New_York" })
    : new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  const html = notifShell(
    "New Registration", "#1D4ED8", "#DBEAFE",
    "New User Registered",
    "A new user has created an account on the Guardian Trading platform.",
    row("Email", params.email) +
    row("IP Address", params.ipAddress ?? "Unknown") +
    lastRow("Registered At", `${ts} ET`),
    { label: "View in Admin Dashboard" }
  );

  await sendAdminEmail("🆕 New User Registered — Guardian Trading", html);
}

export async function notifyOnboardingComplete(params: {
  email: string;
  totalSteps: number;
  completedAt?: string;
}): Promise<void> {
  const ts = params.completedAt
    ? new Date(params.completedAt).toLocaleString("en-US", { timeZone: "America/New_York" })
    : new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  const html = notifShell(
    "Onboarding Complete", "#15803D", "#DCFCE7",
    "User Completed Onboarding",
    "A user has submitted all onboarding forms and is awaiting admin review.",
    row("Email", params.email) +
    row("Steps Completed", `${params.totalSteps} / ${params.totalSteps}`) +
    lastRow("Completed At", `${ts} ET`),
    { label: "Review in KYC Queue" }
  );

  await sendAdminEmail("✅ Onboarding Complete — Awaiting Review", html);
}

export async function notifySignatureSubmitted(params: {
  email: string;
  ipAddress?: string;
  userAgent?: string;
  pendingCount?: number;
}): Promise<void> {
  const ts = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const threshold = getSignatureThreshold();
  const pending = params.pendingCount ?? 0;

  const html = notifShell(
    "Signature Submitted", "#7C3AED", "#EDE9FE",
    "Electronic Signature Received",
    "A user has submitted their electronic signature on the platform.",
    row("Email", params.email) +
    row("IP Address", params.ipAddress ?? "Unknown") +
    row("Submitted At", `${ts} ET`) +
    lastRow("Pending Verifications", `${pending} signature${pending !== 1 ? "s" : ""} awaiting review`),
    { label: "View Signatures" }
  );

  await sendAdminEmail("✍️ New Signature Submitted — Guardian Trading", html);

  // Threshold alert
  if (pending >= threshold) {
    await notifyHighPendingSignatures(pending);
  }
}

export async function notifySignatureVerified(params: {
  email: string;
  verifiedBy: string;
  note?: string;
}): Promise<void> {
  const ts = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  const html = notifShell(
    "Signature Verified", "#15803D", "#DCFCE7",
    "Signature Marked as Verified",
    "An admin has verified a user's electronic signature.",
    row("User Email", params.email) +
    row("Verified By", params.verifiedBy) +
    row("Verified At", `${ts} ET`) +
    lastRow("Note", params.note ?? "—"),
  );

  await sendAdminEmail("✅ Signature Verified — Guardian Trading", html);
}

export async function notifyHighPendingSignatures(pendingCount: number): Promise<void> {
  const threshold = getSignatureThreshold();
  const html = notifShell(
    "Action Required", "#D97706", "#FEF3C7",
    `${pendingCount} Signatures Awaiting Verification`,
    `The number of pending signature verifications has exceeded the threshold of ${threshold}.`,
    row("Pending Count", `${pendingCount}`) +
    row("Threshold", `${threshold}`) +
    lastRow("Action Needed", "Please review and verify pending signatures in the Signatures dashboard."),
    { label: "Review Pending Signatures" }
  );

  await sendAdminEmail(`⚠️ ${pendingCount} Signatures Pending Verification — Action Required`, html);
}

export async function notifyHighRiskUser(params: {
  email: string;
  riskScore: number;
  riskLevel: string;
  flags: string[];
}): Promise<void> {
  const ts = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const flagList = params.flags.length > 0
    ? params.flags.map(f => `&bull; ${f}`).join("<br/>")
    : "No specific flags";

  const html = notifShell(
    "High Risk Alert", "#DC2626", "#FEE2E2",
    "High Risk User Detected",
    "The fraud detection engine has flagged a user as high risk.",
    row("Email", params.email) +
    row("Risk Score", `${params.riskScore} / 100`) +
    row("Risk Level", params.riskLevel.toUpperCase()) +
    row("Detected At", `${ts} ET`) +
    lastRow("Flags", flagList),
    { label: "Review User Profile" }
  );

  await sendAdminEmail(`🚨 High Risk User Detected — ${params.email}`, html);
}

export async function notifyAdminAction(params: {
  action: string;
  targetEmail: string;
  performedBy: string;
  note?: string;
  reason?: string;
}): Promise<void> {
  const ts = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const actionLabel: Record<string, string> = {
    APPROVE:   "User Approved",
    REJECT:    "User Rejected",
    SUSPEND:   "User Suspended",
    BAN:       "User Banned",
    REACTIVATE:"User Reactivated",
    FLAG:      "User Flagged",
    VERIFY_SIG:"Signature Verified",
  };
  const label = actionLabel[params.action] ?? params.action;

  const html = notifShell(
    "Admin Action", "#374151", "#F3F4F6",
    label,
    "An admin action was performed in the Guardian Trading dashboard.",
    row("Action", label) +
    row("User Email", params.targetEmail) +
    row("Performed By", params.performedBy) +
    row("At", `${ts} ET`) +
    row("Note", params.note ?? "—") +
    lastRow("Reason", params.reason ?? "—"),
  );

  await sendAdminEmail(`🔧 Admin Action: ${label} — ${params.targetEmail}`, html);
}

export async function notifySecurityAlert(params: {
  event: string;
  detail: string;
  email?: string;
  ipAddress?: string;
}): Promise<void> {
  const ts = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  const html = notifShell(
    "Security Alert", "#DC2626", "#FEE2E2",
    params.event,
    "A security event has been detected on the Guardian Trading platform.",
    row("Event", params.event) +
    row("Detail", params.detail) +
    row("Email", params.email ?? "—") +
    row("IP Address", params.ipAddress ?? "—") +
    lastRow("Detected At", `${ts} ET`),
  );

  await sendAdminEmail(`🔐 Security Alert: ${params.event}`, html);
}

export async function notifyDailySummary(params: {
  newUsers: number;
  signaturesSubmitted: number;
  pendingApprovals: number;
  flaggedAccounts: number;
  date?: string;
}): Promise<void> {
  const dateLabel = params.date ?? new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const html = notifShell(
    "Daily Summary", "#1D4ED8", "#DBEAFE",
    "Daily Compliance Summary",
    `Activity report for ${dateLabel}`,
    row("🆕 New Users", `${params.newUsers}`) +
    row("✍️ Signatures Submitted", `${params.signaturesSubmitted}`) +
    row("⏳ Pending Approvals", `${params.pendingApprovals}`) +
    lastRow("🚨 Flagged Accounts", `${params.flaggedAccounts}`),
    { label: "Open Admin Dashboard" }
  );

  await sendAdminEmail(`📊 Daily Summary — Guardian Trading (${dateLabel})`, html);
}
