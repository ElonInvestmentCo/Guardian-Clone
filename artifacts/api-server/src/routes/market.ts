import { Router } from "express";
import { marketDataLimit } from "../middleware/security.js";

const marketRouter = Router();

const CACHE_TTL = 60_000;
let pricesCache: { data: unknown; ts: number } | null = null;
let chartCache = new Map<string, { data: unknown; ts: number }>();

marketRouter.get("/market/prices", marketDataLimit, async (_req, res) => {
  try {
    if (pricesCache && Date.now() - pricesCache.ts < CACHE_TTL) {
      res.json(pricesCache.data);
      return;
    }
    const url =
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d";
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    const data = await response.json();
    pricesCache = { data, ts: Date.now() };
    res.json(data);
  } catch (err) {
    console.error("[market/prices] Error:", err);
    if (pricesCache) {
      const ageMs = Date.now() - pricesCache.ts;
      res.json({ data: pricesCache.data, stale: true, cachedAt: new Date(pricesCache.ts).toISOString(), ageSeconds: Math.round(ageMs / 1000) });
      return;
    }
    res.status(502).json({ error: "Failed to fetch market data" });
  }
});

marketRouter.get("/market/chart/:id", marketDataLimit, async (req, res) => {
  const id = req.params.id as string;
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    res.status(400).json({ error: "Invalid coin ID" });
    return;
  }
  const days = (req.query["days"] as string) || "1";
  if (!/^[0-9]+$/.test(days)) {
    res.status(400).json({ error: "Invalid days parameter" });
    return;
  }
  const cacheKey = `${id}_${days}`;

  try {
    const cached = chartCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      res.json(cached.data);
      return;
    }

    const url = `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`CoinGecko OHLC API error: ${response.status}`);
    }
    const data = await response.json();
    chartCache.set(cacheKey, { data, ts: Date.now() });

    if (chartCache.size > 50) {
      const oldest = [...chartCache.entries()].sort(
        (a, b) => a[1].ts - b[1].ts
      );
      for (let i = 0; i < 10; i++) chartCache.delete(oldest[i]![0]);
    }

    res.json(data);
  } catch (err) {
    console.error("[market/chart] Error:", err);
    const cached = chartCache.get(cacheKey);
    if (cached) {
      const ageMs = Date.now() - cached.ts;
      res.json({ data: cached.data, stale: true, cachedAt: new Date(cached.ts).toISOString(), ageSeconds: Math.round(ageMs / 1000) });
      return;
    }
    res.status(502).json({ error: "Failed to fetch chart data" });
  }
});

export default marketRouter;
