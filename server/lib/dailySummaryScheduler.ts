/**
 * Daily Summary Scheduler
 *
 * Fires once per day at a configurable time (default 08:00 America/New_York).
 * Queries live DB stats and sends a digest email to the admin via notifyDailySummary.
 *
 * Config env vars:
 *   DAILY_SUMMARY_HOUR   — 0-23, local ET hour to fire (default: 8)
 *   DAILY_SUMMARY_MINUTE — 0-59 (default: 0)
 */

import { getPool } from "./db.js";
import { notifyDailySummary } from "./adminNotifier.js";

const TZ = "America/New_York";

// ---------------------------------------------------------------------------
// Stats queries
// ---------------------------------------------------------------------------

async function fetchStats(): Promise<{
  newUsers: number;
  signaturesSubmitted: number;
  pendingApprovals: number;
  flaggedAccounts: number;
}> {
  const pool = getPool();

  const [newUsersRes, sigsRes, pendingRes, flaggedRes] = await Promise.all([
    // New user registrations in the last 24 hours
    pool.query<{ count: string }>(`
      SELECT COUNT(*) AS count
      FROM registration_log
      WHERE registered_at >= NOW() - INTERVAL '24 hours'
    `),

    // Signatures submitted in the last 24 hours
    pool.query<{ count: string }>(`
      SELECT COUNT(*) AS count
      FROM signature_audit_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `),

    // Total accounts currently awaiting approval
    pool.query<{ count: string }>(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE data->>'status' = 'pending'
    `),

    // Total accounts currently flagged
    pool.query<{ count: string }>(`
      SELECT COUNT(*) AS count
      FROM user_profiles
      WHERE (data->>'_flagged')::boolean = true
    `),
  ]);

  return {
    newUsers:             parseInt(newUsersRes.rows[0]?.count ?? "0", 10),
    signaturesSubmitted:  parseInt(sigsRes.rows[0]?.count ?? "0", 10),
    pendingApprovals:     parseInt(pendingRes.rows[0]?.count ?? "0", 10),
    flaggedAccounts:      parseInt(flaggedRes.rows[0]?.count ?? "0", 10),
  };
}

// ---------------------------------------------------------------------------
// Scheduling helpers
// ---------------------------------------------------------------------------

function getTargetHour(): number {
  const h = parseInt(process.env["DAILY_SUMMARY_HOUR"] ?? "8", 10);
  return isNaN(h) || h < 0 || h > 23 ? 8 : h;
}

function getTargetMinute(): number {
  const m = parseInt(process.env["DAILY_SUMMARY_MINUTE"] ?? "0", 10);
  return isNaN(m) || m < 0 || m > 59 ? 0 : m;
}

/**
 * Returns the number of ms until the next occurrence of HH:MM ET.
 */
function msUntilNextFire(): number {
  const now = new Date();

  // Get current time expressed in ET
  const etFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const parts = etFormatter.formatToParts(now);
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? "0", 10);

  const etYear   = get("year");
  const etMonth  = get("month") - 1; // 0-indexed
  const etDay    = get("day");
  const etHour   = get("hour");
  const etMinute = get("minute");
  const etSecond = get("second");

  // Candidate: today at target time ET
  // We reconstruct a UTC timestamp for today HH:MM:00 ET
  const targetHour   = getTargetHour();
  const targetMinute = getTargetMinute();

  // Build a Date that represents today target time in ET by using
  // the offset between now and its ET representation
  const etNowMs   = Date.UTC(etYear, etMonth, etDay, etHour, etMinute, etSecond);
  const offsetMs  = now.getTime() - etNowMs; // local UTC - ET-expressed UTC
  const todayFireEtMs = Date.UTC(etYear, etMonth, etDay, targetHour, targetMinute, 0);
  let fireAtMs = todayFireEtMs + offsetMs;

  // If that time has already passed today, schedule for tomorrow
  if (fireAtMs <= now.getTime()) {
    fireAtMs += 24 * 60 * 60 * 1000;
  }

  return fireAtMs - now.getTime();
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function runDailySummary(): Promise<void> {
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).format(new Date());

  console.log(`[DailySummary] Running daily summary for ${dateLabel}`);

  try {
    const stats = await fetchStats();
    console.log("[DailySummary] Stats:", stats);
    await notifyDailySummary({ ...stats, date: dateLabel });
    console.log("[DailySummary] Email dispatched successfully");
  } catch (err) {
    console.error("[DailySummary] Failed:", err instanceof Error ? err.message : err);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let _timer: ReturnType<typeof setTimeout> | null = null;

function scheduleNext(): void {
  if (_timer) clearTimeout(_timer);

  const delay = msUntilNextFire();
  const fireAt = new Date(Date.now() + delay).toLocaleString("en-US", { timeZone: TZ });

  console.log(
    `[DailySummary] Next summary scheduled for ${fireAt} ET` +
    ` (in ${Math.round(delay / 60_000)} min)`
  );

  _timer = setTimeout(async () => {
    await runDailySummary();
    scheduleNext(); // reschedule for the following day
  }, delay);

  // Prevent the timer from keeping the process alive if everything else exits
  if (_timer.unref) _timer.unref();
}

/**
 * Call once at server startup. Schedules the daily summary and keeps
 * rescheduling automatically every 24 hours.
 */
export function scheduleDailySummary(): void {
  const adminEmail = process.env["ADMIN_EMAIL"];
  if (!adminEmail) {
    console.warn("[DailySummary] ADMIN_EMAIL not set — daily summary will not be scheduled");
    return;
  }
  if (!process.env["RESEND_API_KEY"]) {
    console.warn("[DailySummary] RESEND_API_KEY not set — daily summary will not be scheduled");
    return;
  }

  scheduleNext();
}

/**
 * Trigger an immediate summary outside the schedule (e.g. for testing).
 */
export async function triggerDailySummaryNow(): Promise<void> {
  await runDailySummary();
}
