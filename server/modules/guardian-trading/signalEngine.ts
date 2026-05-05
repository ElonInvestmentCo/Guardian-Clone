import { getAiProvider } from "../../lib/ai/aiService.js";
import { analyzeCoins, type CoinData, type TechnicalIndicators } from "./marketAnalysis.js";

export interface TradingSignal {
  id: string;
  asset: string;
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskRewardRatio: number;
  timeframe: string;
  reasoning: string;
  indicators: {
    rsi: number;
    trend: string;
    volatility: string;
    momentum: number;
  };
  generatedAt: string;
  expiresAt: string;
}

export interface SignalEngineResult {
  signals: TradingSignal[];
  marketSentiment: "BULLISH" | "BEARISH" | "NEUTRAL" | "MIXED";
  generatedAt: string;
  source: "ai" | "technical";
}

const signalCache = new Map<string, { result: SignalEngineResult; ts: number }>();
const SIGNAL_CACHE_TTL = 15 * 60 * 1000;

function generateSignalId(): string {
  return `SIG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function buildSignalExpiry(): string {
  return new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
}

function computeMarketSentiment(indicators: TechnicalIndicators[]): SignalEngineResult["marketSentiment"] {
  const bullish = indicators.filter(i => i.trend === "BULLISH").length;
  const bearish = indicators.filter(i => i.trend === "BEARISH").length;
  const total = indicators.length;
  if (total === 0) return "NEUTRAL";
  const bullRatio = bullish / total;
  const bearRatio = bearish / total;
  if (bullRatio > 0.6) return "BULLISH";
  if (bearRatio > 0.6) return "BEARISH";
  if (Math.abs(bullRatio - bearRatio) < 0.15) return "MIXED";
  return "NEUTRAL";
}

function deriveSignalsFromTechnicals(indicators: TechnicalIndicators[]): TradingSignal[] {
  return indicators
    .filter(i => i.signal !== "HOLD")
    .slice(0, 5)
    .map(i => {
      const action: "BUY" | "SELL" | "HOLD" =
        i.signal === "STRONG_BUY" || i.signal === "BUY" ? "BUY" :
        i.signal === "STRONG_SELL" || i.signal === "SELL" ? "SELL" : "HOLD";

      const confidence =
        i.signal === "STRONG_BUY" || i.signal === "STRONG_SELL" ? 80 :
        i.signal === "BUY" || i.signal === "SELL" ? 65 : 50;

      const slBuffer = i.price * 0.04;
      const tpBuffer = i.price * (action === "BUY" ? 0.08 : 0.06);
      const stopLoss = parseFloat((action === "BUY" ? i.price - slBuffer : i.price + slBuffer).toFixed(2));
      const takeProfit = parseFloat((action === "BUY" ? i.price + tpBuffer : i.price - tpBuffer).toFixed(2));
      const riskRewardRatio = parseFloat((tpBuffer / slBuffer).toFixed(2));

      const riskLevel: "LOW" | "MEDIUM" | "HIGH" =
        i.volatility === "HIGH" ? "HIGH" :
        i.volatility === "MEDIUM" ? "MEDIUM" : "LOW";

      const reasoning =
        action === "BUY"
          ? `RSI at ${i.rsi.toFixed(0)} with ${i.trend.toLowerCase()} momentum (${i.change24h >= 0 ? "+" : ""}${i.change24h.toFixed(2)}% 24h). Support at $${i.support.toFixed(2)}.`
          : `RSI at ${i.rsi.toFixed(0)} with ${i.trend.toLowerCase()} pressure (${i.change24h >= 0 ? "+" : ""}${i.change24h.toFixed(2)}% 24h). Resistance at $${i.resistance.toFixed(2)}.`;

      return {
        id: generateSignalId(),
        asset: i.symbol,
        symbol: i.symbol,
        action,
        confidence,
        entryPrice: i.price,
        stopLoss,
        takeProfit,
        riskLevel,
        riskRewardRatio,
        timeframe: "4H",
        reasoning,
        indicators: {
          rsi: parseFloat(i.rsi.toFixed(1)),
          trend: i.trend,
          volatility: i.volatility,
          momentum: parseFloat(i.momentum.toFixed(1)),
        },
        generatedAt: new Date().toISOString(),
        expiresAt: buildSignalExpiry(),
      };
    });
}

async function generateAiSignals(
  indicators: TechnicalIndicators[],
): Promise<TradingSignal[]> {
  const provider = getAiProvider();

  const marketSnapshot = indicators.slice(0, 8).map(i =>
    `${i.symbol}: $${i.price.toFixed(2)}, RSI=${i.rsi.toFixed(0)}, 24h=${i.change24h >= 0 ? "+" : ""}${i.change24h.toFixed(2)}%, trend=${i.trend}, vol=${i.volatility}`
  ).join("\n");

  const prompt = `You are an institutional-grade trading signal engine for Guardian Trading.

Current market data:
${marketSnapshot}

Generate 3 high-conviction trading signals (BUY or SELL only, no HOLD). Respond ONLY with a JSON array, no other text:

[
  {
    "asset": "SYMBOL",
    "action": "BUY"|"SELL",
    "confidence": 55-90,
    "entryPrice": number,
    "stopLoss": number,
    "takeProfit": number,
    "riskLevel": "LOW"|"MEDIUM"|"HIGH",
    "timeframe": "1H"|"4H"|"1D",
    "reasoning": "one sentence, specific and quantified"
  }
]

Rules:
- Entry, stop-loss and take-profit must be consistent with the action direction
- BUY: takeProfit > entryPrice > stopLoss
- SELL: stopLoss > entryPrice > takeProfit
- Risk/reward ratio must be at least 1.5:1
- Use only assets from the market data provided`;

  const raw = await provider.chat([
    { role: "system", content: "You are a trading signal engine. Always respond with valid JSON arrays only." },
    { role: "user", content: prompt },
  ]);

  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON array in AI response");

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    asset: string;
    action: string;
    confidence: number;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    riskLevel: string;
    timeframe: string;
    reasoning: string;
  }>;

  return parsed.map(s => {
    const indicator = indicators.find(i => i.symbol === s.asset.toUpperCase());
    const riskRewardRatio = s.action === "BUY"
      ? parseFloat(((s.takeProfit - s.entryPrice) / Math.abs(s.entryPrice - s.stopLoss)).toFixed(2))
      : parseFloat(((s.entryPrice - s.takeProfit) / Math.abs(s.stopLoss - s.entryPrice)).toFixed(2));

    return {
      id: generateSignalId(),
      asset: s.asset.toUpperCase(),
      symbol: s.asset.toUpperCase(),
      action: s.action as "BUY" | "SELL",
      confidence: Math.min(95, Math.max(40, s.confidence)),
      entryPrice: s.entryPrice,
      stopLoss: s.stopLoss,
      takeProfit: s.takeProfit,
      riskLevel: s.riskLevel as "LOW" | "MEDIUM" | "HIGH",
      riskRewardRatio: isNaN(riskRewardRatio) ? 1.5 : riskRewardRatio,
      timeframe: s.timeframe || "4H",
      reasoning: s.reasoning,
      indicators: {
        rsi: indicator?.rsi ?? 50,
        trend: indicator?.trend ?? "NEUTRAL",
        volatility: indicator?.volatility ?? "MEDIUM",
        momentum: indicator?.momentum ?? 0,
      },
      generatedAt: new Date().toISOString(),
      expiresAt: buildSignalExpiry(),
    };
  });
}

export async function generateSignals(coins: CoinData[]): Promise<SignalEngineResult> {
  const cacheKey = "global";
  const cached = signalCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < SIGNAL_CACHE_TTL) {
    return cached.result;
  }

  const indicators = analyzeCoins(coins);
  const marketSentiment = computeMarketSentiment(indicators);
  const generatedAt = new Date().toISOString();

  let signals: TradingSignal[];
  let source: "ai" | "technical" = "technical";

  try {
    signals = await generateAiSignals(indicators);
    source = "ai";
  } catch (err) {
    console.warn("[SignalEngine] AI generation failed, falling back to technical analysis:", err);
    signals = deriveSignalsFromTechnicals(indicators);
  }

  const result: SignalEngineResult = { signals, marketSentiment, generatedAt, source };
  signalCache.set(cacheKey, { result, ts: Date.now() });
  return result;
}

export function invalidateSignalCache(): void {
  signalCache.clear();
}
