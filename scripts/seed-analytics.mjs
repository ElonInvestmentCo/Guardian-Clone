/**
 * Seed analytics demo data for the Guardian Trading analytics platform.
 * Uses a browser User-Agent to bypass bot detection.
 */

const API_BASE = "http://localhost:8080/api";
const API_KEY = "gt_3e3306133cd5455286eb193e3fbedb4e";

const UA_CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const UA_FIREFOX = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:123.0) Gecko/20100101 Firefox/123.0";
const UA_SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const UA_EDGE = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0";

const PAGES = [
  "/", "/dashboard", "/trading", "/portfolio", "/markets",
  "/signals", "/pricing", "/docs", "/blog", "/about",
];

const REFERRERS = [
  "https://google.com/search?q=trading+platform",
  "https://twitter.com",
  "https://reddit.com/r/algotrading",
  "https://linkedin.com",
  "https://hackernews.com",
  null, null, null, // direct traffic
];

const CAMPAIGNS = [
  { utm_source: "google",   utm_medium: "cpc",     utm_campaign: "brand-q1-2026" },
  { utm_source: "twitter",  utm_medium: "social",  utm_campaign: "launch-promo" },
  { utm_source: "email",    utm_medium: "email",   utm_campaign: "weekly-digest" },
  { utm_source: "linkedin", utm_medium: "social",  utm_campaign: "b2b-outreach" },
  { utm_source: "reddit",   utm_medium: "cpc",     utm_campaign: "algo-community" },
  null, null, null, null, null, // organic
];

const TIMEZONES = ["America/New_York", "America/Chicago", "Europe/London", "Asia/Tokyo", "America/Los_Angeles"];
const LANGUAGES = ["en-US", "en-GB", "ja-JP", "de-DE", "fr-FR"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

async function sendEvent(payload, ua) {
  const res = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": ua,
    },
    body: JSON.stringify({ api_key: API_KEY, ...payload }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[${res.status}] ${text} — payload:`, JSON.stringify(payload).slice(0, 120));
  }
}

async function simulateSession({ ua, page, referrer, campaign, isNew }) {
  const visitorId = uuid();
  const sessionId = uuid();
  const screen_width = ua === UA_SAFARI ? 390 : rand([1280, 1440, 1920, 1366]);
  const screen_height = ua === UA_SAFARI ? 844 : rand([720, 900, 1080]);

  const base = {
    visitor_id: visitorId,
    session_id: sessionId,
    page_url: `https://app.guardiantrading.com${page}`,
    referrer,
    screen_width,
    screen_height,
    timezone: rand(TIMEZONES),
    language: rand(LANGUAGES),
    ...(campaign ?? {}),
  };

  // Pageview
  await sendEvent({ ...base, event_type: "pageview", event_name: "pageview", is_new_session: isNew }, ua);

  // Additional pageviews on deeper pages
  const extraPages = randInt(0, 3);
  for (let i = 0; i < extraPages; i++) {
    const nextPage = rand(PAGES);
    await sendEvent({
      ...base,
      event_type: "pageview",
      event_name: "pageview",
      page_url: `https://app.guardiantrading.com${nextPage}`,
      is_new_session: false,
      scroll_depth: randInt(20, 95),
    }, ua);
  }

  // Random click events
  const clicks = randInt(0, 4);
  for (let i = 0; i < clicks; i++) {
    await sendEvent({
      ...base,
      event_type: "click",
      event_name: "button_click",
      is_new_session: false,
      element_x: randInt(50, screen_width - 50),
      element_y: randInt(50, screen_height - 50),
    }, ua);
  }

  // Occasional custom events
  if (Math.random() < 0.3) {
    await sendEvent({ ...base, event_type: "custom", event_name: "signup_started", is_new_session: false }, ua);
  }
  if (Math.random() < 0.15) {
    await sendEvent({ ...base, event_type: "custom", event_name: "trial_activated", is_new_session: false }, ua);
  }
}

async function main() {
  console.log("Seeding analytics demo data...");

  const UAS = [UA_CHROME, UA_CHROME, UA_CHROME, UA_FIREFOX, UA_SAFARI, UA_EDGE];
  let total = 0;

  for (let i = 0; i < 180; i++) {
    const ua = rand(UAS);
    const page = rand(PAGES);
    const referrer = rand(REFERRERS) ?? null;
    const campaign = rand(CAMPAIGNS) ?? null;
    const isNew = Math.random() > 0.25;

    await simulateSession({ ua, page, referrer, campaign, isNew });
    total++;
    if (total % 20 === 0) console.log(`  ${total} sessions sent...`);
  }

  console.log(`Done! Seeded ${total} sessions.`);
}

main().catch(console.error);
