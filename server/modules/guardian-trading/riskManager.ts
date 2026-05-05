export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface PositionSizeResult {
  riskLevel: RiskLevel;
  conservativeSize: number;
  standardSize: number;
  aggressiveSize: number;
  maxPositionSize: number;
  marginRequired: number;
  riskRewardRatio: number;
  recommendation: string;
}

export interface PortfolioRisk {
  overallRisk: RiskLevel;
  concentrationRisk: boolean;
  leverageRisk: boolean;
  liquidityRisk: boolean;
  riskScore: number;
  warnings: string[];
}

export function calculatePositionSize(
  accountBalance: number,
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
  riskTolerance: "low" | "medium" | "high" = "medium",
): PositionSizeResult {
  const riskPcts = { low: 0.01, medium: 0.02, high: 0.05 };
  const riskPct = riskPcts[riskTolerance];

  const riskPerUnit = Math.abs(entryPrice - stopLoss);
  const rewardPerUnit = Math.abs(takeProfit - entryPrice);
  const riskRewardRatio = riskPerUnit > 0 ? rewardPerUnit / riskPerUnit : 0;

  const maxRiskAmount = accountBalance * riskPct;
  const units = riskPerUnit > 0 ? maxRiskAmount / riskPerUnit : 0;

  const conservativeSize = parseFloat((accountBalance * 0.01).toFixed(2));
  const standardSize = parseFloat((accountBalance * 0.03).toFixed(2));
  const aggressiveSize = parseFloat((accountBalance * 0.07).toFixed(2));
  const maxPositionSize = parseFloat((accountBalance * 0.10).toFixed(2));
  const marginRequired = parseFloat((units * entryPrice * 0.1).toFixed(2));

  let riskLevel: RiskLevel = "LOW";
  if (riskTolerance === "high" || units * entryPrice > accountBalance * 0.1) riskLevel = "HIGH";
  else if (riskTolerance === "medium") riskLevel = "MEDIUM";

  const recommendation =
    riskLevel === "HIGH"
      ? "High-risk sizing — ensure stop-loss is set before entry"
      : riskLevel === "MEDIUM"
      ? "Standard sizing — monitor position daily"
      : "Conservative sizing — suitable for capital preservation";

  return {
    riskLevel,
    conservativeSize,
    standardSize,
    aggressiveSize,
    maxPositionSize,
    marginRequired,
    riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
    recommendation,
  };
}

export function assessPortfolioRisk(
  balance: number,
  openPositions: number,
  largestPositionPct: number,
): PortfolioRisk {
  const warnings: string[] = [];
  let riskScore = 0;

  const concentrationRisk = largestPositionPct > 20;
  if (concentrationRisk) {
    warnings.push("Single position exceeds 20% of portfolio — concentration risk");
    riskScore += 30;
  }

  const leverageRisk = openPositions > 5;
  if (leverageRisk) {
    warnings.push("More than 5 open positions — consider reducing exposure");
    riskScore += 20;
  }

  const liquidityRisk = balance < 1000;
  if (liquidityRisk) {
    warnings.push("Low account balance — insufficient buffer for margin requirements");
    riskScore += 40;
  }

  if (balance === 0) {
    warnings.push("Account not funded — no trading capital available");
    riskScore = 100;
  }

  let overallRisk: RiskLevel = "LOW";
  if (riskScore >= 80) overallRisk = "CRITICAL";
  else if (riskScore >= 50) overallRisk = "HIGH";
  else if (riskScore >= 20) overallRisk = "MEDIUM";

  return {
    overallRisk,
    concentrationRisk,
    leverageRisk,
    liquidityRisk,
    riskScore,
    warnings,
  };
}

export function validateOrderRisk(
  accountBalance: number,
  orderSizeUsd: number,
): { approved: boolean; reason?: string; riskLevel: RiskLevel } {
  if (orderSizeUsd <= 0) {
    return { approved: false, reason: "Order size must be greater than zero", riskLevel: "CRITICAL" };
  }
  if (accountBalance <= 0) {
    return { approved: false, reason: "Insufficient account balance", riskLevel: "CRITICAL" };
  }
  if (orderSizeUsd > accountBalance) {
    return { approved: false, reason: "Order size exceeds available balance", riskLevel: "CRITICAL" };
  }
  const pct = (orderSizeUsd / accountBalance) * 100;
  if (pct > 20) {
    return { approved: false, reason: "Order exceeds 20% of account — reduce position size", riskLevel: "HIGH" };
  }
  if (pct > 10) {
    return { approved: true, riskLevel: "HIGH" };
  }
  if (pct > 5) {
    return { approved: true, riskLevel: "MEDIUM" };
  }
  return { approved: true, riskLevel: "LOW" };
}
