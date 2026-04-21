import type { AiMessage } from "./aiService.js";

// NOTE: This file is kept in sync with artifacts/api-server/src/lib/ai/tradingContext.ts

export interface UserAccountData {
  balance: number;
  profit: number;
  history: Array<{
    timestamp: string;
    transactionType: string;
    newBalance: number;
    balanceChange: number;
    note: string;
  }>;
}

export interface LiveMarketData {
  coins: Array<{
    name: string;
    symbol: string;
    price: number;
    percent_change_24h: number;
  }>;
}

const STAKING_OPPORTUNITIES = [
  { asset: "ETH", apy: "3–5%", lockPeriod: "Flexible", risk: "Low", minAmount: "$100" },
  { asset: "SOL", apy: "6–8%", lockPeriod: "30 days", risk: "Medium", minAmount: "$50" },
  { asset: "AVAX", apy: "7–10%", lockPeriod: "90 days", risk: "Medium-High", minAmount: "$200" },
  { asset: "DOT", apy: "10–14%", lockPeriod: "120 days", risk: "High", minAmount: "$100" },
];

function computeStakeRecommendation(balance: number, riskLevel: "low" | "medium" | "high"): {
  amount: number;
  pct: number;
  rationale: string;
} {
  const pcts = { low: 0.02, medium: 0.05, high: 0.10 };
  const rationales = {
    low: "2% of balance — preserves capital and limits downside exposure",
    medium: "5% of balance — balanced growth with manageable risk",
    high: "10% of balance — aggressive position sizing; only suitable with strong conviction and stop-loss",
  };
  const pct = pcts[riskLevel];
  const amount = Math.round(balance * pct);
  return { amount, pct: pct * 100, rationale: rationales[riskLevel] };
}

function buildMarketSection(liveMarket?: LiveMarketData): string {
  if (!liveMarket || liveMarket.coins.length === 0) {
    return "Live market data temporarily unavailable.";
  }
  const top5 = liveMarket.coins.slice(0, 5);
  return top5.map(c => {
    const chg = c.percent_change_24h;
    const sign = chg >= 0 ? "+" : "";
    return `- ${c.name} (${c.symbol.toUpperCase()}): $${c.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${sign}${chg.toFixed(2)}% 24h)`;
  }).join("\n");
}

function buildAccountSection(account: UserAccountData, userEmail: string): string {
  const balance = account.balance;
  const profit = account.profit;
  const recentActivity = account.history
    .slice()
    .reverse()
    .slice(0, 5)
    .map(h => {
      const sign = h.balanceChange >= 0 ? "+" : "";
      return `  • ${new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${sign}$${Math.abs(h.balanceChange).toLocaleString()} (${h.transactionType}${h.note ? ` — ${h.note}` : ""})`;
    }).join("\n");

  return `- Email: ${userEmail}
- Account Balance: $${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Total Profit/Loss: ${profit >= 0 ? "+" : ""}$${Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${
  recentActivity ? `\n- Recent Activity:\n${recentActivity}` : "\n- No transaction history yet"
}`;
}

export function buildSystemPrompt(userEmail?: string, account?: UserAccountData, liveMarket?: LiveMarketData): AiMessage {
  const effectiveBalance = account?.balance ?? 0;
  const stake = {
    low: computeStakeRecommendation(effectiveBalance, "low"),
    medium: computeStakeRecommendation(effectiveBalance, "medium"),
    high: computeStakeRecommendation(effectiveBalance, "high"),
  };

  const accountSection = account
    ? buildAccountSection(account, userEmail ?? "trader")
    : `- Email: ${userEmail ?? "trader"}\n- Account not yet funded`;

  const marketSection = buildMarketSection(liveMarket);

  return {
    role: "system",
    content: `You are Guardian AI — a professional trading instructor and intelligent assistant for Guardian Trading. You combine deep market expertise with the clarity of a trusted mentor.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROLE & PERSONA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- You are a professional, trustworthy trading mentor — not a broker or automated system
- You educate users about trading mechanics, staking strategies, and risk management
- You help users make informed decisions — you never act on their behalf
- Your tone is confident, clear, and respectful — like a seasoned portfolio manager talking to a client

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER ACCOUNT CONTEXT (LIVE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${accountSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIVE CRYPTO MARKET SNAPSHOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${marketSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STAKING OPPORTUNITIES (TYPICAL RANGES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${STAKING_OPPORTUNITIES.map(s =>
  `- ${s.asset}: ${s.apy} APY | ${s.lockPeriod} lock | Risk: ${s.risk} | Min: ${s.minAmount}`
).join("\n")}
Note: APY rates are typical market ranges and fluctuate — always confirm current rates before committing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECOMMENDED STAKE CALCULATOR (based on $${effectiveBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} balance)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${effectiveBalance > 0 ? `When a user asks about staking or position sizing, use these dynamically calculated amounts:
- 🟢 Low Risk:    $${stake.low.amount.toLocaleString()} (${stake.low.pct}% of balance) — ${stake.low.rationale}
- 🟡 Medium Risk: $${stake.medium.amount.toLocaleString()} (${stake.medium.pct}% of balance) — ${stake.medium.rationale}
- 🔴 High Risk:   $${stake.high.amount.toLocaleString()} (${stake.high.pct}% of balance) — ${stake.high.rationale}

If the user shares their own balance or different amount, recalculate these percentages dynamically in your response.` : "User has not yet funded their account. Explain staking concepts educationally and encourage them to fund their account first before committing capital."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RISK METER CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every trade suggestion or staking recommendation must include a risk classification:

🟢 LOW RISK — Diversified, small position, high-liquidity asset, short exposure window, tight stop-loss
🟡 MEDIUM RISK — Moderate position, sector concentration, some volatility, defined exit strategy
🔴 HIGH RISK — Large position relative to portfolio, speculative asset, high volatility, extended lock period

Always explain WHY a classification was assigned.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT (ALWAYS use this structure)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Structure every substantive response as:

**📊 Analysis**
[Clear explanation of the situation, asset, or concept]

**💡 Recommendation**
[Specific, actionable guidance — include price targets, entry/exit levels, or stake amounts where relevant]

**⚠️ Risk Level: [🟢 Low / 🟡 Medium / 🔴 High]**
[Why this risk level applies]

**📋 Next Steps**
[Step-by-step what the user should do — always ending with confirmation requirement]

For educational/informational questions that don't involve a specific action, you can use a simpler format with just explanation and key takeaways.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAPABILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **Trading Education** — Explain concepts (options, margin, stop-loss, P/E ratios, technical indicators, etc.) in plain language
2. **Account Overview** — Summarize the user's real balance, recent deposits/withdrawals, P&L
3. **Trade Guidance** — Walk users through how to evaluate and execute a trade step by step
4. **Staking Education** — Explain staking mechanics, rewards, lock periods, and risk profiles
5. **Recommended Stake Calculator** — Calculate optimal position sizes based on real balance and risk tolerance
6. **Risk Assessment** — Classify any proposed action by risk level with full rationale
7. **Market Insights** — Interpret live crypto market conditions and volatility signals
8. **Withdrawal Guidance** — Explain withdrawal process, timelines, and tax implications (never initiate)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RULES — NON-NEGOTIABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 NEVER automatically execute a trade — always end with "Please confirm to proceed"
🚫 NEVER automatically stake or unstake funds
🚫 NEVER automatically initiate a withdrawal
🚫 NEVER guarantee profits or specific returns — use "potential upside," "historically," "based on current data"
🚫 NEVER fabricate portfolio positions, holdings, or account values not shown in the User Account Context above
✅ ALL financial actions require the user to explicitly say "Yes, confirm" or take action in the platform UI
✅ Always include a risk disclaimer when recommending a position size above 5% of balance
✅ Always reference the user's actual account data when giving advice
✅ When in doubt, recommend the lower-risk approach and explain why

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRADE EXPLANATION TEMPLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When suggesting a trade, always cover:
- **Why this trade**: What signals or reasoning support it
- **Expected outcome**: Realistic upside/downside scenario
- **Risks involved**: What could go wrong and how to mitigate
- **Entry point**: Suggested price or condition to enter
- **Exit strategy**: Target price and stop-loss level
- **Confirmation required**: Remind user no action is taken until they confirm`,
  };
}

export function buildStakeRecommendation(
  balance: number,
  riskTolerance: "low" | "medium" | "high",
  marketCondition?: "bullish" | "bearish" | "neutral"
): {
  recommendedAmount: number;
  percentage: number;
  rationale: string;
  adjustmentNote?: string;
} {
  const pcts = { low: 0.02, medium: 0.05, high: 0.10 };
  const rationales = {
    low: "2% of balance — preserves capital and limits downside exposure",
    medium: "5% of balance — balanced growth with manageable risk",
    high: "10% of balance — aggressive position sizing; only suitable with strong conviction and stop-loss",
  };
  const pct = pcts[riskTolerance];
  let adjustmentFactor = 1;
  let adjustmentNote: string | undefined;

  if (marketCondition === "bearish") {
    adjustmentFactor = 0.7;
    adjustmentNote = "Reduced by 30% due to bearish market conditions — capital preservation priority";
  } else if (marketCondition === "bullish") {
    adjustmentFactor = 1.2;
    adjustmentNote = "Increased by 20% to capitalize on bullish momentum — ensure stop-loss is set";
  }

  return {
    recommendedAmount: Math.round(balance * pct * adjustmentFactor),
    percentage: pct * 100,
    rationale: rationales[riskTolerance],
    adjustmentNote,
  };
}

export function getStakingData() {
  return STAKING_OPPORTUNITIES;
}
