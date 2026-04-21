import { Router } from "express";
import { marketDataLimit } from "../middleware/security.js";

const marketRouter = Router();

const CACHE_TTL = 60_000;
let marketsCache: { data: unknown; ts: number } | null = null;

interface CoinData {
  name: string;
  symbol: string;
  price: number;
  percent_change_24h: number;
  market_cap: number;
  volume_24h: number;
}

async function fetchFromCoinGecko(): Promise<CoinData[]> {
  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
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

async function fetchFromCoinMarketCap(apiKey: string): Promise<CoinData[]> {
  const url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=100&convert=USD";
  const response = await fetch(url, {
    headers: { Accept: "application/json", "X-CMC_PRO_API_KEY": apiKey },
  });
  if (!response.ok) throw new Error(`CoinMarketCap error: ${response.status}`);
  const data = await response.json() as { data: Array<{
    name: string; symbol: string;
    quote: { USD: { price: number; percent_change_24h: number; market_cap: number; volume_24h: number } };
  }> };
  return data.data.map((coin) => ({
    name: coin.name,
    symbol: coin.symbol,
    price: coin.quote.USD.price,
    percent_change_24h: coin.quote.USD.percent_change_24h,
    market_cap: coin.quote.USD.market_cap,
    volume_24h: coin.quote.USD.volume_24h,
  }));
}

marketRouter.get("/markets", marketDataLimit, async (_req, res) => {
  try {
    if (marketsCache && Date.now() - marketsCache.ts < CACHE_TTL) {
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
    if (marketsCache) {
      res.json(marketsCache.data);
      return;
    }
    res.status(502).json({ error: "Failed to fetch market data" });
  }
});

export default marketRouter;
