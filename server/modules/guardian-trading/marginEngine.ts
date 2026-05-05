export type MarginStatus = "SAFE" | "WARNING" | "DANGER" | "MARGIN_CALL" | "LIQUIDATION";

export interface MarginLevel {
  status: MarginStatus;
  balance: number;
  maintenanceMargin: number;
  availableMargin: number;
  marginRatio: number;
  liquidationLevel: number;
  warningLevel: number;
  message: string;
  requiredDeposit: number;
}

const MAINTENANCE_MARGIN_RATE = 0.25;
const WARNING_THRESHOLD = 0.40;
const MARGIN_CALL_THRESHOLD = 0.30;
const LIQUIDATION_THRESHOLD = 0.20;

export function calculateMarginLevel(
  balance: number,
  totalPositionValue: number = 0,
): MarginLevel {
  const maintenanceMargin = totalPositionValue * MAINTENANCE_MARGIN_RATE;
  const availableMargin = balance - maintenanceMargin;
  const marginRatio = totalPositionValue > 0 ? balance / totalPositionValue : 1;

  const liquidationLevel = totalPositionValue * LIQUIDATION_THRESHOLD;
  const warningLevel = totalPositionValue * WARNING_THRESHOLD;

  let status: MarginStatus = "SAFE";
  let message = "Account margin is healthy";
  let requiredDeposit = 0;

  if (balance <= 0) {
    status = "LIQUIDATION";
    message = "Account balance depleted — positions will be liquidated";
    requiredDeposit = maintenanceMargin;
  } else if (totalPositionValue > 0 && marginRatio < LIQUIDATION_THRESHOLD) {
    status = "LIQUIDATION";
    message = "Margin ratio critically low — forced liquidation imminent";
    requiredDeposit = Math.max(0, maintenanceMargin - balance);
  } else if (totalPositionValue > 0 && marginRatio < MARGIN_CALL_THRESHOLD) {
    status = "MARGIN_CALL";
    message = "Margin call triggered — deposit funds or close positions immediately";
    requiredDeposit = Math.max(0, warningLevel - balance);
  } else if (balance < 500) {
    status = "DANGER";
    message = "Account balance critically low — risk of margin call on new positions";
    requiredDeposit = 1000 - balance;
  } else if (balance < 1000) {
    status = "WARNING";
    message = "Account balance low — limited buying power for new positions";
    requiredDeposit = 0;
  } else if (totalPositionValue > 0 && marginRatio < WARNING_THRESHOLD) {
    status = "WARNING";
    message = "Approaching margin call level — consider reducing open positions";
    requiredDeposit = 0;
  }

  return {
    status,
    balance,
    maintenanceMargin: parseFloat(maintenanceMargin.toFixed(2)),
    availableMargin: parseFloat(availableMargin.toFixed(2)),
    marginRatio: parseFloat(marginRatio.toFixed(4)),
    liquidationLevel: parseFloat(liquidationLevel.toFixed(2)),
    warningLevel: parseFloat(warningLevel.toFixed(2)),
    message,
    requiredDeposit: parseFloat(requiredDeposit.toFixed(2)),
  };
}

export function isMarginCallTriggered(balance: number, totalPositionValue: number = 0): boolean {
  const { status } = calculateMarginLevel(balance, totalPositionValue);
  return status === "MARGIN_CALL" || status === "LIQUIDATION" || status === "DANGER";
}

export function getMarginCallSeverity(status: MarginStatus): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  switch (status) {
    case "WARNING": return "LOW";
    case "DANGER": return "MEDIUM";
    case "MARGIN_CALL": return "HIGH";
    case "LIQUIDATION": return "CRITICAL";
    default: return "LOW";
  }
}
