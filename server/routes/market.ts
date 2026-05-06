import { Router } from "express";
import { marketDataLimit } from "../middleware/security.js";

const marketRouter = Router();

/* ─── Markets cache ───────────────────────────────────────────────── */

const MARKETS_TTL = 60_000;          // 1 min
let marketsCache: { data: unknown; ts: number } | null = null;

/* ─── Sparklines cache ────────────────────────────────────────────── */

const SPARKLINE_TTL = 5 * 60_000;   // 5 min (sparklines don't need to be fresh)
let sparklineCache: { data: Record<string, number[]>; ts: number } | null = null;

/* ─── Shared types ────────────────────────────────────────────────── */

interface CoinData {
  name: string;
  symbol: string;
  price: number;
  percent_change_24h: number;
  market_cap: number;
  volume_24h: number;
}

/* ─── CoinGecko fetch (markets) ───────────────────────────────────── */

async function fetchFromCoinGecko(): Promise<CoinData[]> {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets" +
    "?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`CoinGecko error: ${response.status}`);
  const data = await response.json() as Array<{
    name: string;
    symbol: string;
    current_price: number;
    price_change_percentage_24h: number;
    market_cap: number;
    total_volume: number;
  }>;
  return data.map((coin) => ({
    name: coin.name,
    symbol: coin.symbol,
    price: coin.current_price,
    percent_change_24h: coin.price_change_percentage_24h,
    market_cap: coin.market_cap,
    volume_24h: coin.total_volume,
  }));
}

/* ─── CoinGecko fetch (sparklines) ───────────────────────────────── */

async function fetchSparklines(): Promise<Record<string, number[]>> {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets" +
    "?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true";
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`CoinGecko sparkline error: ${response.status}`);
  const data = await response.json() as Array<{
    symbol: string;
    sparkline_in_7d?: { price: number[] };
  }>;

  const result: Record<string, number[]> = {};
  for (const coin of data) {
    const prices = coin.sparkline_in_7d?.price ?? [];
    if (prices.length < 2) continue;
    // Downsample to ~40 points for efficiency (≈every 4 hours over 7 days)
    const step = Math.max(1, Math.floor(prices.length / 40));
    const sampled: number[] = [];
    for (let i = 0; i < prices.length; i += step) sampled.push(prices[i]);
    // Always include the last point
    if (sampled[sampled.length - 1] !== prices[prices.length - 1]) {
      sampled.push(prices[prices.length - 1]);
    }
    result[coin.symbol.toLowerCase()] = sampled;
  }
  return result;
}

/* ─── CoinMarketCap fetch ─────────────────────────────────────────── */

async function fetchFromCoinMarketCap(apiKey: string): Promise<CoinData[]> {
  const url =
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest" +
    "?start=1&limit=100&convert=USD";
  const response = await fetch(url, {
    headers: { Accept: "application/json", "X-CMC_PRO_API_KEY": apiKey },
  });
  if (!response.ok) throw new Error(`CoinMarketCap error: ${response.status}`);
  const data = await response.json() as {
    data: Array<{
      name: string;
      symbol: string;
      quote: { USD: { price: number; percent_change_24h: number; market_cap: number; volume_24h: number } };
    }>;
  };
  return data.data.map((coin) => ({
    name: coin.name,
    symbol: coin.symbol.toLowerCase(),
    price: coin.quote.USD.price,
    percent_change_24h: coin.quote.USD.percent_change_24h,
    market_cap: coin.quote.USD.market_cap,
    volume_24h: coin.quote.USD.volume_24h,
  }));
}

/* ─── Routes ──────────────────────────────────────────────────────── */

/** GET /api/markets — top 100 coins with price/change/cap/volume */
marketRouter.get("/markets", marketDataLimit, async (_req, res) => {
  try {
    if (marketsCache && Date.now() - marketsCache.ts < MARKETS_TTL) {
      res.json(marketsCache.data);
      return;
    }

    let processedData: CoinData[];
    const cmcKey = process.env.CMC_API_KEY;
    if (cmcKey) {
      try {
        processedData = await fetchFromCoinMarketCap(cmcKey);
      } catch (cmcErr) {
        console.warn("[/api/markets] CoinMarketCap failed, falling back to CoinGecko:", cmcErr);
        processedData = await fetchFromCoinGecko();
      }
    } else {
      processedData = await fetchFromCoinGecko();
    }

    marketsCache = { data: processedData, ts: Date.now() };
    res.json(processedData);
  } catch (err) {
    console.error("[/api/markets] Error:", err);
    if (marketsCache) { res.json(marketsCache.data); return; }
    res.status(502).json({ error: "Failed to fetch market data" });
  }
});

/** GET /api/markets/sparklines — 7-day downsampled price arrays per coin symbol */
marketRouter.get("/markets/sparklines", marketDataLimit, async (_req, res) => {
  try {
    if (sparklineCache && Date.now() - sparklineCache.ts < SPARKLINE_TTL) {
      res.json(sparklineCache.data);
      return;
    }
    const data = await fetchSparklines();
    sparklineCache = { data, ts: Date.now() };
    res.json(data);
  } catch (err) {
    console.error("[/api/markets/sparklines] Error:", err);
    // Return stale cache rather than failing
    if (sparklineCache) { res.json(sparklineCache.data); return; }
    res.status(502).json({ error: "Failed to fetch sparkline data" });
  }
});

export default marketRouter;
