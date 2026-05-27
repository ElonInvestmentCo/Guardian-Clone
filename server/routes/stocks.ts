import { Router, type Request, type Response } from "express";
import YahooFinanceLib from "yahoo-finance2";

const router = Router();
const yf = new (YahooFinanceLib as any)({ suppressNotices: ["yahooSurvey"] });

const SYMBOLS = [
  "AAPL", "MSFT", "NVDA", "TSLA", "META", "GOOGL", "AMZN", "AMD",
  "SPY",  "QQQ",  "PLTR", "NFLX", "GME",  "AMC",  "SOFI", "BA",
  "COIN", "HOOD", "MSTR", "RIVN",
];

interface QuoteResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

let cache: { data: QuoteResult[]; ts: number } | null = null;
const CACHE_TTL_MS = 60_000;

async function fetchQuotes(): Promise<QuoteResult[]> {
  const settled = await Promise.allSettled(
    SYMBOLS.map((symbol) =>
      yf.quote(symbol).then((q: any) => ({
        symbol: q.symbol ?? symbol,
        name: q.shortName ?? q.longName ?? symbol,
        price: q.regularMarketPrice ?? 0,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
      } as QuoteResult))
    )
  );

  return settled
    .filter((r): r is PromiseFulfilledResult<QuoteResult> => r.status === "fulfilled")
    .map((r) => r.value);
}

router.get("/stocks/quotes", async (_req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (cache && now - cache.ts < CACHE_TTL_MS) {
      res.json({ quotes: cache.data, cached: true });
      return;
    }

    const data = await fetchQuotes();
    if (data.length > 0) {
      cache = { data, ts: now };
    }
    res.json({ quotes: data, cached: false });
  } catch (err: any) {
    if (cache) {
      res.json({ quotes: cache.data, cached: true, stale: true });
      return;
    }
    res.status(502).json({ error: "Unable to fetch stock quotes", detail: err?.message });
  }
});

export default router;
