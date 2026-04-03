import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

const KNOWN_BOT_PATTERNS = [
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i, /baiduspider/i,
  /yandexbot/i, /sogou/i, /facebot/i, /ia_archiver/i,
  /headlesschrome/i, /phantomjs/i, /selenium/i, /puppeteer/i,
  /playwright/i, /crawl/i, /spider/i, /scraper/i,
  /wget/i, /curl/i, /httpie/i, /python-requests/i, /python-urllib/i,
  /go-http-client/i, /java\//i, /libwww/i, /mechanize/i,
  /scrapy/i, /node-fetch/i, /axios/i, /undici/i,
  /httrack/i, /nikto/i, /sqlmap/i, /nmap/i, /masscan/i,
  /GPTBot/i, /ChatGPT-User/i, /CCBot/i, /anthropic-ai/i, /Claude-Web/i,
  /Google-Extended/i, /Bytespider/i, /PetalBot/i, /Amazonbot/i,
  /FacebookBot/i, /Meta-ExternalAgent/i, /Meta-ExternalFetcher/i,
  /Applebot/i, /Twitterbot/i, /LinkedInBot/i, /Slackbot/i,
  /Discordbot/i, /TelegramBot/i, /WhatsApp/i,
  /SemrushBot/i, /AhrefsBot/i, /MJ12bot/i, /DotBot/i, /BLEXBot/i,
  /DataForSeoBot/i, /serpstatbot/i, /Rogerbot/i,
  /archive\.org_bot/i, /Wayback/i, /Nutch/i, /Heritrix/i,
  /colly/i, /ferret/i, /webbandit/i, /sitecopy/i, /teleport/i,
  /webstripper/i, /webzip/i, /grab/i, /offline\s?explorer/i,
  /superagent/i, /got\//i, /needle\//i, /request\//i,
  /aiohttp/i, /httpx/i, /requests\//i, /urllib3/i,
  /cfnetwork/i, /okhttp/i, /apache-httpclient/i,
  /WebCopier/i, /NetAnts/i, /Teleport/i, /PageGrabber/i,
  /JetCar/i, /Ezooms/i, /Exabot/i, /Gigabot/i,
  /MegaIndex/i, /Cliqzbot/i, /Qwantify/i,
  /PerplexityBot/i, /YouBot/i, /Diffbot/i, /Cohere-ai/i,
];

const HEADLESS_SIGNALS = [
  /HeadlessChrome/i,
  /PhantomJS/i,
  /Electron/i,
];

function isSuspiciousUA(ua: string): boolean {
  if (!ua || ua.length < 10) return true;
  for (const pat of KNOWN_BOT_PATTERNS) {
    if (pat.test(ua)) return true;
  }
  return false;
}

function isHeadlessBrowser(ua: string): boolean {
  for (const pat of HEADLESS_SIGNALS) {
    if (pat.test(ua)) return true;
  }
  return false;
}

const suspiciousIPs = new Map<string, { count: number; blockedUntil: number }>();

function getSuspiciousScore(req: Request): number {
  let score = 0;
  const ua = req.headers["user-agent"] ?? "";

  if (!ua) score += 3;
  if (isHeadlessBrowser(ua)) score += 4;
  if (!req.headers["accept-language"]) score += 2;
  if (!req.headers["accept"]) score += 1;
  if (req.headers["accept"] === "*/*" && !req.headers["accept-language"]) score += 2;

  return score;
}

export function botDetection(req: Request, res: Response, next: NextFunction): void {
  if (req.path === "/healthz" || req.path === "/api/healthz") {
    return next();
  }

  const ua = req.headers["user-agent"] ?? "";
  const ip = req.ip ?? "unknown";
  const now = Date.now();

  const entry = suspiciousIPs.get(ip);
  if (entry && entry.blockedUntil > now) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }

  if (isSuspiciousUA(ua)) {
    console.warn(`[Security] Bot blocked — IP: ${ip}, UA: ${ua}, Path: ${req.path}`);
    const current = suspiciousIPs.get(ip) ?? { count: 0, blockedUntil: 0 };
    current.count++;
    if (current.count >= 3) {
      current.blockedUntil = now + 10 * 60 * 1000;
    }
    suspiciousIPs.set(ip, current);
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const score = getSuspiciousScore(req);
  if (score >= 5) {
    console.warn(`[Security] Suspicious client blocked — IP: ${ip}, Score: ${score}, UA: ${ua}`);
    const current = suspiciousIPs.get(ip) ?? { count: 0, blockedUntil: 0 };
    current.count++;
    if (current.count >= 3) {
      current.blockedUntil = now + 10 * 60 * 1000;
    }
    suspiciousIPs.set(ip, current);
    res.status(403).json({ error: "Access denied" });
    return;
  }

  next();
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, noimageindex, nosnippet");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");

  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://cdn.livechatinc.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://guardian-clone-production.up.railway.app https://api.coingecko.com wss: https://*.livechatinc.com https://*.lc.chat",
      "frame-src 'self' https://www.google.com https://*.livechatinc.com https://*.lc.chat",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self' https://*.replit.dev https://*.replit.app",
      "upgrade-insecure-requests",
    ].join("; ")
  );

  next();
}

export const globalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  skip: (req) => req.path === "/healthz",
  validate: { xForwardedForHeader: false },
});

export const sensitiveEndpointLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
  validate: { xForwardedForHeader: false },
});

export const aiChatLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests. Please slow down." },
  validate: { xForwardedForHeader: false },
});

export const uploadLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads. Please try again later." },
  validate: { xForwardedForHeader: false },
});

export const userDataLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  validate: { xForwardedForHeader: false },
});

export const marketDataLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many market data requests. Please slow down." },
  validate: { xForwardedForHeader: false },
});

export function requestFingerprint(req: Request, res: Response, next: NextFunction): void {
  const ua = req.headers["user-agent"] ?? "";
  const accept = req.headers["accept"] ?? "";
  const lang = req.headers["accept-language"] ?? "";
  const encoding = req.headers["accept-encoding"] ?? "";

  const fp = `${ua}|${accept}|${lang}|${encoding}`;
  (req as Request & { fingerprint: string }).fingerprint = fp;

  next();
}

const rapidRequestTracker = new Map<string, number[]>();
const RAPID_WINDOW_MS = 10_000;
const RAPID_MAX_REQUESTS = 30;

export function anomalyDetection(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? "unknown";
  const now = Date.now();

  const timestamps = (rapidRequestTracker.get(ip) ?? []).filter(
    (t) => now - t < RAPID_WINDOW_MS
  );
  timestamps.push(now);
  rapidRequestTracker.set(ip, timestamps);

  if (timestamps.length > RAPID_MAX_REQUESTS) {
    console.warn(`[Security] Anomaly detected: rapid requests from ${ip} (${timestamps.length} in ${RAPID_WINDOW_MS / 1000}s)`);
    res.status(429).json({ error: "Unusual activity detected. Please slow down." });
    return;
  }

  next();
}

export function hotlinkProtection(req: Request, res: Response, next: NextFunction): void {
  if (!req.path.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|pdf)$/i)) {
    return next();
  }

  const referer = req.headers["referer"] ?? req.headers["referrer"] ?? "";
  if (!referer) {
    return next();
  }

  try {
    const refUrl = new URL(Array.isArray(referer) ? referer[0] : referer);
    const allowed = [
      "guardiiantrading.com",
      "www.guardiiantrading.com",
      "localhost",
    ];

    const repl = process.env.REPLIT_DEV_DOMAIN ?? "";
    if (repl) allowed.push(repl);
    const replDeploy = process.env.REPLIT_DOMAINS ?? "";
    if (replDeploy) replDeploy.split(",").forEach((d) => allowed.push(d.trim()));

    if (!allowed.some((h) => refUrl.hostname === h || refUrl.hostname.endsWith(`.${h}`))) {
      res.status(403).json({ error: "Hotlinking not allowed" });
      return;
    }
  } catch {
    // malformed referer - allow through
  }

  next();
}

export function honeytrapRoute(req: Request, res: Response): void {
  const ip = req.ip ?? "unknown";
  const ua = req.headers["user-agent"] ?? "";
  console.warn(`[Honeytrap] Scraper detected — IP: ${ip}, UA: ${ua}, Path: ${req.path}`);

  const entry = suspiciousIPs.get(ip) ?? { count: 0, blockedUntil: 0 };
  entry.count += 5;
  entry.blockedUntil = Date.now() + 30 * 60 * 1000;
  suspiciousIPs.set(ip, entry);

  res.status(200).json({
    users: [],
    data: [],
    message: "OK",
  });
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of suspiciousIPs) {
    if (entry.blockedUntil < now && now - entry.blockedUntil > 60 * 60 * 1000) {
      suspiciousIPs.delete(ip);
    }
  }
  for (const [ip, timestamps] of rapidRequestTracker) {
    const recent = timestamps.filter((t) => now - t < RAPID_WINDOW_MS);
    if (recent.length === 0) rapidRequestTracker.delete(ip);
    else rapidRequestTracker.set(ip, recent);
  }
}, 5 * 60 * 1000);
