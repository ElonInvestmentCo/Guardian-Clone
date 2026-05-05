export interface CoinData {
  name: string;
  symbol: string;
  price: number;
  percent_change_24h: number;
}

export interface TechnicalIndicators {
  symbol: string;
  price: number;
  change24h: number;
  rsi: number;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  volatility: "LOW" | "MEDIUM" | "HIGH";
  momentum: number;
  support: number;
  resistance: number;
  signal: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
}

export function computeRSI(change24h: number): number {
  const gain = Math.max(change24h, 0);
  const loss = Math.abs(Math.min(change24h, 0));
  if (gain + loss === 0) return 50;
  const rs = gain / (loss || 0.001);
  const rsi = 100 - 100 / (1 + rs);
  const base = 50 + (rsi - 50) * 2.5;
  return Math.min(95, Math.max(5, base));
}

export function computeTrend(change24h: number): "BULLISH" | "BEARISH" | "NEUTRAL" {
  if (change24h > 2) return "BULLISH";
  if (change24h < -2) return "BEARISH";
  return "NEUTRAL";
}

export function computeVolatility(change24h: number): "LOW" | "MEDIUM" | "HIGH" {
  const abs = Math.abs(change24h);
  if (abs < 1.5) return "LOW";
  if (abs < 5) return "MEDIUM";
  return "HIGH";
}

export function computeMomentum(change24h: number): number {
  return Math.tanh(change24h / 5) * 100;
}

export function computeSupportResistance(price: number, change24h: number): { support: number; resistance: number } {
  const swing = price * Math.abs(change24h / 100);
  const buffer = Math.max(swing * 1.5, price * 0.01);
  return {
    support: parseFloat((price - buffer).toFixed(2)),
    resistance: parseFloat((price + buffer).toFixed(2)),
  };
}

export function computeSignal(rsi: number, change24h: number): TechnicalIndicators["signal"] {
  if (rsi < 30 && change24h < -3) return "STRONG_BUY";
  if (rsi < 40 && change24h < 0) return "BUY";
  if (rsi > 70 && change24h > 3) return "STRONG_SELL";
  if (rsi > 60 && change24h > 0) return "SELL";
  return "HOLD";
}

export function analyzeCoins(coins: CoinData[]): TechnicalIndicators[] {
  return coins.map((coin) => {
    const rsi = computeRSI(coin.percent_change_24h);
    const { support, resistance } = computeSupportResistance(coin.price, coin.percent_change_24h);
    return {
      symbol: coin.symbol.toUpperCase(),
      price: coin.price,
      change24h: coin.percent_change_24h,
      rsi,
      trend: computeTrend(coin.percent_change_24h),
      volatility: computeVolatility(coin.percent_change_24h),
      momentum: computeMomentum(coin.percent_change_24h),
      support,
      resistance,
      signal: computeSignal(rsi, coin.percent_change_24h),
    };
  });
}
