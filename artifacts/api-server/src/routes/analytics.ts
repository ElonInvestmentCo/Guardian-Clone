import { Router, type Request, type Response } from "express";
import { query } from "../lib/db.js";
import { randomUUID } from "crypto";
import rateLimit from "express-rate-limit";

const analyticsRouter = Router();

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

function sanitize(v: unknown, max = 512): string | null {
  if (typeof v !== "string") return null;
  return v.trim().slice(0, max) || null;
}

function getRange(period: string): string {
  switch (period) {
    case "7d": return "7 days";
    case "30d": return "30 days";
    case "90d": return "90 days";
    case "1d": return "1 day";
    default: return "7 days";
  }
}

analyticsRouter.use(apiLimiter);

analyticsRouter.get("/analytics/projects", async (req: Request, res: Response) => {
  const ownerEmail = sanitize(req.query["email"]);
  if (!ownerEmail) { res.status(400).json({ error: "email required" }); return; }
  const r = await query(
    `SELECT p.id, p.name, p.domain, p.created_at,
            k.public_key,
            COUNT(DISTINCT e.session_id) AS total_sessions,
            COUNT(e.id) AS total_events
     FROM analytics_projects p
     LEFT JOIN analytics_api_keys k ON k.project_id = p.id
     LEFT JOIN analytics_events e ON e.project_id = p.id
     WHERE p.owner_email = $1
     GROUP BY p.id, p.name, p.domain, p.created_at, k.public_key
     ORDER BY p.created_at DESC`,
    [ownerEmail]
  );
  res.json(r.rows);
});

analyticsRouter.post("/analytics/projects", async (req: Request, res: Response) => {
  const { name, domain, ownerEmail } = req.body as Record<string, unknown>;
  const n = sanitize(name);
  const d = sanitize(domain);
  const e = sanitize(ownerEmail);
  if (!n || !d || !e) { res.status(400).json({ error: "name, domain, ownerEmail required" }); return; }

  const projectId = randomUUID();
  const publicKey = "gt_" + randomUUID().replace(/-/g, "");
  await query(
    `INSERT INTO analytics_projects (id, name, domain, owner_email) VALUES ($1,$2,$3,$4)`,
    [projectId, n, d, e]
  );
  await query(
    `INSERT INTO analytics_api_keys (id, project_id, public_key) VALUES ($1,$2,$3)`,
    [randomUUID(), projectId, publicKey]
  );
  res.json({ id: projectId, publicKey });
});

analyticsRouter.delete("/analytics/projects/:id", async (req: Request, res: Response) => {
  const id = sanitize(req.params["id"]);
  if (!id) { res.status(400).json({ error: "id required" }); return; }
  await query(`DELETE FROM analytics_projects WHERE id = $1`, [id]);
  res.json({ ok: true });
});

analyticsRouter.get("/analytics/overview", async (req: Request, res: Response) => {
  const projectId = sanitize(req.query["project_id"]);
  const period = getRange(sanitize(req.query["period"]) ?? "7d");
  if (!projectId) { res.status(400).json({ error: "project_id required" }); return; }

  const [visitors, pageviews, sessions, bounce, devices, browsers] = await Promise.all([
    query(
      `SELECT COUNT(DISTINCT visitor_id) AS count FROM analytics_events
       WHERE project_id=$1 AND event_type='pageview' AND is_bot=false AND timestamp > NOW() - INTERVAL '${period}'`,
      [projectId]
    ),
    query(
      `SELECT COUNT(*) AS count FROM analytics_events
       WHERE project_id=$1 AND event_type='pageview' AND is_bot=false AND timestamp > NOW() - INTERVAL '${period}'`,
      [projectId]
    ),
    query(
      `SELECT COUNT(DISTINCT session_id) AS count FROM analytics_events
       WHERE project_id=$1 AND is_bot=false AND timestamp > NOW() - INTERVAL '${period}'`,
      [projectId]
    ),
    query(
      `SELECT ROUND(COUNT(*) FILTER(WHERE is_bounce)::numeric / NULLIF(COUNT(*),0) * 100,1) AS rate
       FROM analytics_sessions WHERE project_id=$1 AND start_time > NOW() - INTERVAL '${period}'`,
      [projectId]
    ),
    query(
      `SELECT device_type, COUNT(*) AS count FROM analytics_events
       WHERE project_id=$1 AND is_bot=false AND device_type IS NOT NULL AND timestamp > NOW() - INTERVAL '${period}'
       GROUP BY device_type ORDER BY count DESC`,
      [projectId]
    ),
    query(
      `SELECT browser, COUNT(*) AS count FROM analytics_events
       WHERE project_id=$1 AND is_bot=false AND browser IS NOT NULL AND timestamp > NOW() - INTERVAL '${period}'
       GROUP BY browser ORDER BY count DESC LIMIT 6`,
      [projectId]
    ),
  ]);

  res.json({
    visitors: Number(visitors.rows[0]?.count ?? 0),
    pageviews: Number(pageviews.rows[0]?.count ?? 0),
    sessions: Number(sessions.rows[0]?.count ?? 0),
    bounceRate: Number(bounce.rows[0]?.rate ?? 0),
    devices: devices.rows,
    browsers: browsers.rows,
  });
});

analyticsRouter.get("/analytics/timeseries", async (req: Request, res: Response) => {
  const projectId = sanitize(req.query["project_id"]);
  const period = getRange(sanitize(req.query["period"]) ?? "7d");
  if (!projectId) { res.status(400).json({ error: "project_id required" }); return; }

  const r = await query(
    `SELECT DATE_TRUNC('day', timestamp) AS day,
            COUNT(*) FILTER(WHERE event_type='pageview') AS pageviews,
            COUNT(DISTINCT visitor_id) AS visitors
     FROM analytics_events
     WHERE project_id=$1 AND is_bot=false AND timestamp > NOW() - INTERVAL '${period}'
     GROUP BY day ORDER BY day ASC`,
    [projectId]
  );
  res.json(r.rows);
});

analyticsRouter.get("/analytics/pages", async (req: Request, res: Response) => {
  const projectId = sanitize(req.query["project_id"]);
  const period = getRange(sanitize(req.query["period"]) ?? "7d");
  if (!projectId) { res.status(400).json({ error: "project_id required" }); return; }

  const r = await query(
    `SELECT page_url,
            COUNT(*) AS views,
            COUNT(DISTINCT visitor_id) AS unique_visitors,
            AVG(scroll_depth) AS avg_scroll
     FROM analytics_events
     WHERE project_id=$1 AND event_type='pageview' AND is_bot=false AND timestamp > NOW() - INTERVAL '${period}'
     GROUP BY page_url ORDER BY views DESC LIMIT 20`,
    [projectId]
  );
  res.json(r.rows);
});

analyticsRouter.get("/analytics/sources", async (req: Request, res: Response) => {
  const projectId = sanitize(req.query["project_id"]);
  const period = getRange(sanitize(req.query["period"]) ?? "7d");
  if (!projectId) { res.status(400).json({ error: "project_id required" }); return; }

  const r = await query(
    `SELECT
       CASE
         WHEN utm_source IS NOT NULL THEN utm_source
         WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
         WHEN referrer LIKE '%google%' THEN 'Google'
         WHEN referrer LIKE '%bing%' THEN 'Bing'
         WHEN referrer LIKE '%facebook%' THEN 'Facebook'
         WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'Twitter'
         WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
         ELSE 'Other'
       END AS source,
       COUNT(*) AS visits,
       COUNT(DISTINCT visitor_id) AS unique_visitors
     FROM analytics_events
     WHERE project_id=$1 AND event_type='pageview' AND is_bot=false AND timestamp > NOW() - INTERVAL '${period}'
     GROUP BY source ORDER BY visits DESC LIMIT 10`,
    [projectId]
  );
  res.json(r.rows);
});

analyticsRouter.get("/analytics/campaigns", async (req: Request, res: Response) => {
  const projectId = sanitize(req.query["project_id"]);
  const period = getRange(sanitize(req.query["period"]) ?? "7d");
  if (!projectId) { res.status(400).json({ error: "project_id required" }); return; }

  const r = await query(
    `SELECT
       COALESCE(utm_campaign, '(none)') AS campaign,
       COALESCE(utm_source, 'direct') AS source,
       COALESCE(utm_medium, '(none)') AS medium,
       COUNT(DISTINCT session_id) AS sessions,
       COUNT(DISTINCT visitor_id) AS visitors,
       COUNT(*) FILTER(WHERE event_type='pageview') AS pageviews,
       COUNT(*) FILTER(WHERE event_type='form_submit') AS conversions
     FROM analytics_events
     WHERE project_id=$1 AND is_bot=false AND timestamp > NOW() - INTERVAL '${period}'
     GROUP BY campaign, source, medium
     ORDER BY sessions DESC LIMIT 50`,
    [projectId]
  );
  res.json(r.rows);
});

analyticsRouter.get("/analytics/heatmap", async (req: Request, res: Response) => {
  const projectId = sanitize(req.query["project_id"]);
  const pageUrl = sanitize(req.query["page_url"]) ?? "/";
  if (!projectId) { res.status(400).json({ error: "project_id required" }); return; }

  const r = await query(
    `SELECT click_x, click_y, viewport_width, viewport_height
     FROM analytics_heatmap_events
     WHERE project_id=$1 AND page_url LIKE $2
     ORDER BY timestamp DESC LIMIT 2000`,
    [projectId, pageUrl + "%"]
  );
  res.json(r.rows);
});

analyticsRouter.get("/analytics/heatmap-pages", async (req: Request, res: Response) => {
  const projectId = sanitize(req.query["project_id"]);
  if (!projectId) { res.status(400).json({ error: "project_id required" }); return; }

  const r = await query(
    `SELECT page_url, COUNT(*) AS clicks
     FROM analytics_heatmap_events
     WHERE project_id=$1
     GROUP BY page_url ORDER BY clicks DESC LIMIT 20`,
    [projectId]
  );
  res.json(r.rows);
});

analyticsRouter.get("/analytics/sessions", async (req: Request, res: Response) => {
  const projectId = sanitize(req.query["project_id"]);
  const period = getRange(sanitize(req.query["period"]) ?? "7d");
  if (!projectId) { res.status(400).json({ error: "project_id required" }); return; }

  const r = await query(
    `SELECT s.session_id, s.visitor_id, s.start_time, s.duration_seconds,
            s.page_count, s.is_bounce, s.entry_page, s.exit_page,
            s.device_type, s.browser, s.utm_campaign, s.utm_source
     FROM analytics_sessions s
     WHERE s.project_id=$1 AND s.start_time > NOW() - INTERVAL '${period}'
     ORDER BY s.start_time DESC LIMIT 100`,
    [projectId]
  );
  res.json(r.rows);
});

analyticsRouter.get("/analytics/session/:sessionId", async (req: Request, res: Response) => {
  const sessionId = sanitize(req.params["sessionId"]);
  const projectId = sanitize(req.query["project_id"]);
  if (!sessionId || !projectId) { res.status(400).json({ error: "required" }); return; }

  const r = await query(
    `SELECT event_type, event_name, page_url, element_x, element_y, scroll_depth, timestamp
     FROM analytics_events
     WHERE session_id=$1 AND project_id=$2 AND is_bot=false
     ORDER BY timestamp ASC LIMIT 500`,
    [sessionId, projectId]
  );
  res.json(r.rows);
});

analyticsRouter.get("/analytics/realtime", async (req: Request, res: Response) => {
  const projectId = sanitize(req.query["project_id"]);
  if (!projectId) { res.status(400).json({ error: "project_id required" }); return; }

  const r = await query(
    `SELECT COUNT(DISTINCT visitor_id) AS active_visitors,
            COUNT(*) AS events_last_5min
     FROM analytics_events
     WHERE project_id=$1 AND is_bot=false AND timestamp > NOW() - INTERVAL '5 minutes'`,
    [projectId]
  );

  const pages = await query(
    `SELECT page_url, COUNT(DISTINCT visitor_id) AS visitors
     FROM analytics_events
     WHERE project_id=$1 AND is_bot=false AND timestamp > NOW() - INTERVAL '5 minutes'
     GROUP BY page_url ORDER BY visitors DESC LIMIT 5`,
    [projectId]
  );

  res.json({
    activeVisitors: Number(r.rows[0]?.active_visitors ?? 0),
    eventsLast5Min: Number(r.rows[0]?.events_last_5min ?? 0),
    activePages: pages.rows,
  });
});

analyticsRouter.get("/analytics/ai-insights", async (req: Request, res: Response) => {
  const projectId = sanitize(req.query["project_id"]);
  if (!projectId) { res.status(400).json({ error: "project_id required" }); return; }

  const [overview, pages, sources, bounceData] = await Promise.all([
    query(
      `SELECT COUNT(DISTINCT visitor_id) AS visitors, COUNT(*) FILTER(WHERE event_type='pageview') AS pageviews
       FROM analytics_events WHERE project_id=$1 AND is_bot=false AND timestamp > NOW() - INTERVAL '7 days'`,
      [projectId]
    ),
    query(
      `SELECT page_url, COUNT(*) AS views FROM analytics_events
       WHERE project_id=$1 AND event_type='pageview' AND is_bot=false AND timestamp > NOW() - INTERVAL '7 days'
       GROUP BY page_url ORDER BY views DESC LIMIT 5`,
      [projectId]
    ),
    query(
      `SELECT COALESCE(utm_source,'direct') AS source, COUNT(*) AS visits
       FROM analytics_events WHERE project_id=$1 AND event_type='pageview' AND is_bot=false AND timestamp > NOW() - INTERVAL '7 days'
       GROUP BY source ORDER BY visits DESC LIMIT 3`,
      [projectId]
    ),
    query(
      `SELECT ROUND(COUNT(*) FILTER(WHERE is_bounce)::numeric / NULLIF(COUNT(*),0) * 100,1) AS bounce_rate
       FROM analytics_sessions WHERE project_id=$1 AND start_time > NOW() - INTERVAL '7 days'`,
      [projectId]
    ),
  ]);

  const bounceRate = Number(bounceData.rows[0]?.bounce_rate ?? 0);
  const visitors = Number(overview.rows[0]?.visitors ?? 0);
  const pageviews = Number(overview.rows[0]?.pageviews ?? 0);
  const pagesPerSession = visitors > 0 ? (pageviews / visitors).toFixed(1) : "0";
  const topPage = pages.rows[0]?.page_url ?? "(none)";
  const topSource = sources.rows[0]?.source ?? "direct";

  const insights = [];

  if (bounceRate > 70) {
    insights.push({ type: "warning", title: "High Bounce Rate", description: `Your bounce rate is ${bounceRate}%. Consider improving landing page content or load speed to keep visitors engaged.` });
  } else if (bounceRate < 30 && visitors > 0) {
    insights.push({ type: "success", title: "Excellent Engagement", description: `Bounce rate of ${bounceRate}% is outstanding. Visitors are exploring multiple pages.` });
  }

  if (visitors > 0) {
    insights.push({ type: "info", title: "Top Traffic Source", description: `Most of your traffic comes from "${topSource}". Consider diversifying or doubling down on this channel.` });
    insights.push({ type: "info", title: "Most Visited Page", description: `"${topPage}" is your top page with ${pages.rows[0]?.views ?? 0} views. Ensure it has a clear call-to-action.` });
    insights.push({ type: "info", title: "Engagement Depth", description: `Visitors view an average of ${pagesPerSession} pages per session. ${parseFloat(pagesPerSession) < 2 ? "Consider internal linking to increase discovery." : "Great content depth!"}` });
  }

  if (insights.length === 0) {
    insights.push({ type: "info", title: "Getting Started", description: "No data yet. Install the tracking script and start collecting analytics." });
  }

  res.json({ insights });
});

export default analyticsRouter;
