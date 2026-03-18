import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { query } from "../lib/db.js";
import { randomUUID } from "crypto";

const ingestRouter = Router();

const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    return typeof forwarded === "string"
      ? forwarded.split(",")[0]!.trim()
      : (req.socket.remoteAddress ?? "unknown");
  },
  message: { error: "Too many requests" },
});

const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /wget/i, /curl/i,
  /googlebot/i, /bingbot/i, /yandex/i, /duckduck/i, /baidu/i,
  /facebookexternalhit/i, /linkedinbot/i, /twitterbot/i,
  /headless/i, /phantomjs/i, /selenium/i, /puppeteer/i,
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some((p) => p.test(userAgent));
}

function parseDeviceType(ua: string | null): string {
  if (!ua) return "unknown";
  if (/mobile|android|iphone|ipod/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "unknown";
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Other";
}

function parseOS(ua: string | null): string {
  if (!ua) return "unknown";
  if (/windows nt/i.test(ua)) return "Windows";
  if (/macintosh|mac os/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  return "Other";
}

function sanitize(v: unknown, maxLen = 512): string | null {
  if (typeof v !== "string") return null;
  return v.trim().slice(0, maxLen) || null;
}

function safeInt(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function safeFloat(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function resolveApiKey(publicKey: string): Promise<string | null> {
  const result = await query(
    `SELECT project_id FROM analytics_api_keys WHERE public_key = $1 LIMIT 1`,
    [publicKey]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].project_id as string;
}

async function upsertVisitor(
  projectId: string,
  visitorId: string
): Promise<void> {
  await query(
    `INSERT INTO analytics_visitors (id, project_id, visitor_id, first_seen, last_seen, total_sessions)
     VALUES ($1, $2, $3, NOW(), NOW(), 1)
     ON CONFLICT (project_id, visitor_id) DO UPDATE
       SET last_seen = NOW(), total_sessions = analytics_visitors.total_sessions + 1
     WHERE analytics_visitors.last_seen < NOW() - INTERVAL '30 minutes'`,
    [randomUUID(), projectId, visitorId]
  );
}

async function upsertSession(
  projectId: string,
  sessionId: string,
  visitorId: string,
  eventData: Record<string, unknown>,
  ua: string | null,
  isNewSession: boolean
): Promise<void> {
  if (isNewSession) {
    await query(
      `INSERT INTO analytics_sessions
         (id, session_id, visitor_id, project_id, start_time, last_activity,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          entry_page, device_type, browser, os, screen_width, screen_height)
       VALUES ($1,$2,$3,$4,NOW(),NOW(),$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT DO NOTHING`,
      [
        randomUUID(), sessionId, visitorId, projectId,
        sanitize(eventData["utm_source"]),
        sanitize(eventData["utm_medium"]),
        sanitize(eventData["utm_campaign"]),
        sanitize(eventData["utm_content"]),
        sanitize(eventData["utm_term"]),
        sanitize(eventData["page_url"]),
        parseDeviceType(ua),
        parseBrowser(ua),
        parseOS(ua),
        safeInt(eventData["screen_width"]),
        safeInt(eventData["screen_height"]),
      ]
    );
  } else {
    await query(
      `UPDATE analytics_sessions
       SET last_activity = NOW(),
           page_count = page_count + 1,
           is_bounce = false,
           exit_page = $2,
           duration_seconds = EXTRACT(EPOCH FROM (NOW() - start_time))::int
       WHERE session_id = $1`,
      [sessionId, sanitize(eventData["page_url"])]
    );
  }
}

ingestRouter.post("/events", ingestLimiter, async (req: Request, res: Response) => {
  res.set("Access-Control-Allow-Origin", "*");

  const body = req.body as Record<string, unknown>;
  const apiKey = sanitize(body["api_key"]);
  if (!apiKey) {
    res.status(400).json({ error: "api_key required" });
    return;
  }

  const projectId = await resolveApiKey(apiKey);
  if (!projectId) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  const ua = req.headers["user-agent"] ?? null;
  const botFlag = isBot(ua);

  const eventType = sanitize(body["event_type"]) ?? "custom";
  const eventName = sanitize(body["event_name"]) ?? eventType;
  const visitorId = sanitize(body["visitor_id"]) ?? "anonymous";
  const sessionId = sanitize(body["session_id"]) ?? randomUUID();
  const isNewSession = Boolean(body["is_new_session"]);
  const pageUrl = sanitize(body["page_url"]);
  const referrer = sanitize(body["referrer"]);

  if (!botFlag) {
    await Promise.all([
      upsertVisitor(projectId, visitorId),
      upsertSession(projectId, sessionId, visitorId, body, ua, isNewSession),
    ]).catch((e) => console.error("[ingest] session/visitor upsert error:", e));
  }

  await query(
    `INSERT INTO analytics_events
       (id, project_id, session_id, visitor_id, event_type, event_name,
        page_url, referrer, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        element_x, element_y, scroll_depth,
        user_agent, device_type, browser, os,
        screen_width, screen_height, timezone, language, is_bot, timestamp)
     VALUES
       ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,NOW())`,
    [
      randomUUID(), projectId, sessionId, visitorId,
      eventType, eventName, pageUrl, referrer,
      sanitize(body["utm_source"]), sanitize(body["utm_medium"]),
      sanitize(body["utm_campaign"]), sanitize(body["utm_content"]),
      sanitize(body["utm_term"]),
      safeFloat(body["element_x"]), safeFloat(body["element_y"]),
      safeInt(body["scroll_depth"]),
      sanitize(ua), parseDeviceType(ua), parseBrowser(ua), parseOS(ua),
      safeInt(body["screen_width"]), safeInt(body["screen_height"]),
      sanitize(body["timezone"]), sanitize(body["language"]),
      botFlag,
    ]
  );

  if (eventType === "click" && body["element_x"] != null) {
    await query(
      `INSERT INTO analytics_heatmap_events
         (id, project_id, page_url, click_x, click_y, viewport_width, viewport_height, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
      [
        randomUUID(), projectId, pageUrl,
        safeFloat(body["element_x"]) ?? 0,
        safeFloat(body["element_y"]) ?? 0,
        safeInt(body["screen_width"]),
        safeInt(body["screen_height"]),
      ]
    ).catch(() => {});
  }

  res.status(202).json({ ok: true });
});

ingestRouter.options("/events", (_req: Request, res: Response) => {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.sendStatus(204);
});

export default ingestRouter;
