import type { AiMessage } from "./aiService.js";

const PORTFOLIO = {
  equity: 127450,
  positions: [
    { symbol: "NVDA", shares: 120, avgCost: 245.30, currentPrice: 291.70, pnl: "+$5,568", pnlPct: "+18.9%" },
    { symbol: "AAPL", shares: 85, avgCost: 178.20, currentPrice: 187.24, pnl: "+$768", pnlPct: "+5.1%" },
    { symbol: "TSLA", shares: 50, avgCost: 220.50, currentPrice: 248.50, pnl: "+$1,400", pnlPct: "+12.7%" },
    { symbol: "AMD", shares: 200, avgCost: 155.00, currentPrice: 162.80, pnl: "+$1,560", pnlPct: "+5.0%" },
  ],
  buyingPower: 45200,
  todayPnl: "+$2,340",
  todayPnlPct: "+1.84%",
};

const MARKET_DATA = {
  indices: [
    { name: "S&P 500", value: 5892.45, change: "+0.62%" },
    { name: "NASDAQ", value: 18734.20, change: "+0.88%" },
    { name: "DOW", value: 43520.15, change: "+0.31%" },
  ],
  trending: ["NVDA", "AAPL", "TSLA", "AMD", "MSFT", "META", "AMZN", "GOOG"],
  sectors: {
    technology: "+1.2%",
    healthcare: "-0.3%",
    financials: "+0.8%",
    energy: "-0.5%",
    consumer: "+0.4%",
  },
  vix: 14.8,
};

const STAKING_OPPORTUNITIES = [
  { asset: "ETH", apy: "4.2%", lockPeriod: "Flexible", risk: "Low", minAmount: "$100" },
  { asset: "SOL", apy: "6.8%", lockPeriod: "30 days", risk: "Medium", minAmount: "$50" },
  { asset: "AVAX", apy: "8.5%", lockPeriod: "90 days", risk: "Medium-High", minAmount: "$200" },
  { asset: "DOT", apy: "12.1%", lockPeriod: "120 days", risk: "High", minAmount: "$100" },
];

export function buildSystemPrompt(userEmail?: string): AiMessage {
  return {
    role: "system",
    content: `You are Guardian AI, an elite AI trading assistant for Guardian Trading. You are confident, sharp, and deeply knowledgeable about markets, trading strategies, and portfolio management.

PERSONALITY:
- Fast, direct, and conversational — not generic or robotic
- Confident but measured — provide clear opinions with supporting rationale
- Market-savvy — reference real patterns, technical analysis, and market dynamics
- You use concise language. Avoid fluff. Be the trader's trusted co-pilot.

USER CONTEXT:
- Email: ${userEmail ?? "trader"}
- Account Equity: $${PORTFOLIO.equity.toLocaleString()}
- Buying Power: $${PORTFOLIO.buyingPower.toLocaleString()}
- Today's P&L: ${PORTFOLIO.todayPnl} (${PORTFOLIO.todayPnlPct})
- Positions: ${PORTFOLIO.positions.map(p => `${p.symbol}: ${p.shares} shares @ $${p.avgCost} → $${p.currentPrice} (${p.pnlPct})`).join("; ")}

MARKET SNAPSHOT:
- ${MARKET_DATA.indices.map(i => `${i.name}: ${i.value} (${i.change})`).join(" | ")}
- VIX: ${MARKET_DATA.vix}
- Sector Performance: ${Object.entries(MARKET_DATA.sectors).map(([k, v]) => `${k}: ${v}`).join(", ")}
- Trending: ${MARKET_DATA.trending.join(", ")}

STAKING OPTIONS:
${STAKING_OPPORTUNITIES.map(s => `- ${s.asset}: ${s.apy} APY, ${s.lockPeriod} lock, ${s.risk} risk, min ${s.minAmount}`).join("\n")}

CAPABILITIES:
1. Portfolio analysis and optimization suggestions
2. Buy/Sell recommendations with entry/exit points and risk levels
3. Market analysis and trend identification
4. Strategy insights (swing, day trading, options, long-term)
5. Risk assessment and stop-loss recommendations
6. Staking opportunity analysis
7. Real-time alert suggestions

RULES:
- Always reference the user's actual portfolio data when giving advice
- Include specific price targets and stop-loss levels when suggesting trades
- Rate risk on a scale: Low / Medium / High / Very High
- When discussing staking, include APY, lock period, and risk level
- Never guarantee profits — use phrases like "potential upside," "based on current momentum"
- Keep responses under 300 words unless the user asks for detailed analysis
- Format with markdown for readability (bold, lists, etc.)
- If asked about auto-trading, explain it requires explicit user activation with risk disclaimers`,
  };
}

export function getPortfolioData() {
  return PORTFOLIO;
}

export function getMarketData() {
  return MARKET_DATA;
}

export function getStakingData() {
  return STAKING_OPPORTUNITIES;
}
