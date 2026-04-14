import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { query } from "../lib/db.js";

const trackingRouter = Router();

const clickLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

const conversionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

const ALLOWED_HOSTS = new Set([
  process.env["ALLOWED_REDIRECT_HOST"] ?? "",
  "localhost",
  "127.0.0.1",
]);

function isSafeRedirect(destination: string): boolean {
  try {
    const url = new URL(destination);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const hostname = url.hostname;
    if (ALLOWED_HOSTS.has(hostname)) return true;
    const replitDomain = process.env["REPLIT_DEV_DOMAIN"] ?? "";
    if (replitDomain && hostname.endsWith(replitDomain)) return true;
    return false;
  } catch {
    return false;
  }
}

function sanitize(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim().slice(0, 512).replace(/[<>'"]/g, "") || null;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]!.trim();
  return req.socket.remoteAddress ?? "unknown";
}

trackingRouter.get("/adsct", clickLimiter, async (req: Request, res: Response) => {
  const campaignId = sanitize(req.query["campaign_id"]);
  const adId = sanitize(req.query["ad_id"]);
  const rawDestination = typeof req.query["destination"] === "string"
    ? req.query["destination"]
    : null;
  const destination = rawDestination ? sanitize(rawDestination) : null;
  const referrer = sanitize(req.headers["referer"] ?? req.headers["referrer"] ?? null) ;
  const userAgent = sanitize(req.headers["user-agent"] ?? null);
  const ip = getClientIp(req);

  const sessionId = (req.cookies as Record<string, string>)?.["gt_sid"] ??
    `sid_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  try {
    await query(
      `INSERT INTO ad_events
        (campaign_id, ad_id, event_type, user_agent, ip_address, referrer, destination_url, session_id)
       VALUES ($1, $2, 'click', $3, $4, $5, $6, $7)`,
      [campaignId, adId, userAgent, ip, referrer, destination, sessionId]
    );
  } catch (err) {
    console.error("[Tracking] Failed to log click:", err);
  }

  res.cookie("gt_campaign_id", campaignId ?? "", {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: "lax",
  });
  res.cookie("gt_ad_id", adId ?? "", {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: "lax",
  });
  res.cookie("gt_sid", sessionId, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: "lax",
  });

  if (destination && isSafeRedirect(destination)) {
    res.redirect(302, destination);
  } else {
    res.redirect(302, "/");
  }
});

trackingRouter.options("/track", (_req: Request, res: Response) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Max-Age", "86400");
  res.status(204).end();
});

trackingRouter.post("/track", conversionLimiter, async (req: Request, res: Response) => {
  res.set("Access-Control-Allow-Origin", "*");
  const body = req.body as Record<string, unknown>;

  const eventType = sanitize(body["event_type"]) ?? "conversion";
  const pageUrl = sanitize(body["page_url"]);
  const userAgent = sanitize(req.headers["user-agent"] ?? null);
  const ip = getClientIp(req);
  const referrer = sanitize(req.headers["referer"] ?? null);

  const cookies = req.cookies as Record<string, string>;
  const campaignId = sanitize(body["campaign_id"]) ?? sanitize(cookies["gt_campaign_id"]);
  const adId = sanitize(body["ad_id"]) ?? sanitize(cookies["gt_ad_id"]);
  const sessionId = sanitize(cookies["gt_sid"]);

  try {
    await query(
      `INSERT INTO ad_events
        (campaign_id, ad_id, event_type, user_agent, ip_address, referrer, page_url, session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [campaignId, adId, eventType, userAgent, ip, referrer, pageUrl, sessionId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[Tracking] Failed to log conversion:", err);
    res.status(500).json({ error: "Failed to record event" });
  }
});

trackingRouter.get("/analytics", async (_req: Request, res: Response) => {
  try {
    const [clicksResult, conversionsResult, rateResult] = await Promise.all([
      query(`
        SELECT campaign_id, ad_id, COUNT(*) AS clicks
        FROM ad_events
        WHERE event_type = 'click'
        GROUP BY campaign_id, ad_id
        ORDER BY clicks DESC
      `),
      query(`
        SELECT campaign_id, ad_id, COUNT(*) AS conversions
        FROM ad_events
        WHERE event_type = 'conversion'
        GROUP BY campaign_id, ad_id
        ORDER BY conversions DESC
      `),
      query(`
        SELECT
          c.campaign_id,
          c.total_clicks,
          COALESCE(v.total_conversions, 0) AS total_conversions,
          CASE
            WHEN c.total_clicks = 0 THEN 0
            ELSE ROUND(COALESCE(v.total_conversions, 0)::numeric / c.total_clicks * 100, 2)
          END AS conversion_rate_pct
        FROM (
          SELECT campaign_id, COUNT(*) AS total_clicks
          FROM ad_events WHERE event_type = 'click'
          GROUP BY campaign_id
        ) c
        LEFT JOIN (
          SELECT campaign_id, COUNT(*) AS total_conversions
          FROM ad_events WHERE event_type = 'conversion'
          GROUP BY campaign_id
        ) v ON c.campaign_id = v.campaign_id
        ORDER BY c.total_clicks DESC
      `),
    ]);

    res.json({
      clicks_by_campaign: clicksResult.rows,
      conversions_by_campaign: conversionsResult.rows,
      conversion_rates: rateResult.rows,
    });
  } catch (err) {
    console.error("[Tracking] Analytics query failed:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default trackingRouter;
