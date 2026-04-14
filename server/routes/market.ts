import { Router } from "express";
import { marketDataLimit } from "../middleware/security.js";

const marketRouter = Router();

const CACHE_TTL = 60_000; // 60 seconds
let marketsCache: { data: unknown; ts: number } | null = null;

marketRouter.get("/markets", marketDataLimit, async (_req, res) => {
  try {
    if (marketsCache && Date.now() - marketsCache.ts < CACHE_TTL) {
      res.json(marketsCache.data);
      return;
    }
    const url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=100&convert=USD";
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY!,
      },
    });
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }
    const data = await response.json() as { data: any[] };
    const processedData = data.data.map((coin) => ({
      name: coin.name,
      symbol: coin.symbol,
      price: coin.quote.USD.price,
      percent_change_24h: coin.quote.USD.percent_change_24h,
      market_cap: coin.quote.USD.market_cap,
      volume_24h: coin.quote.USD.volume_24h,
    }));
    marketsCache = { data: processedData, ts: Date.now() };
    res.json(processedData);
  } catch (err) {
    console.error("[/api/markets] Error:", err);
    if (marketsCache) {
      const ageMs = Date.now() - marketsCache.ts;
      res.json({
        data: marketsCache.data,
        stale: true,
        cachedAt: new Date(marketsCache.ts).toISOString(),
        ageSeconds: Math.round(ageMs / 1000)
      });
      return;
    }
    res.status(502).json({ error: "Failed to fetch market data" });
  }
});

export default marketRouter;
