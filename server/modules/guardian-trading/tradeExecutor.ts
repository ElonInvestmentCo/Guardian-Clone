import { validateOrderRisk } from "./riskManager.js";

export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT";
export type OrderStatus = "FILLED" | "PARTIAL" | "REJECTED" | "PENDING";

export interface TradeOrder {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  accountBalance: number;
}

export interface TradeResult {
  orderId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  requestedQty: number;
  filledQty: number;
  fillPrice: number;
  totalValue: number;
  commission: number;
  netCost: number;
  slippage: number;
  timestamp: string;
  riskLevel: string;
  message: string;
}

export interface OrderValidationError {
  approved: false;
  error: string;
  code: string;
}

const COMMISSION_RATE = 0.0025;
const SLIPPAGE_BPS = 10;

function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GT-${ts}-${rand}`;
}

function applySlippage(price: number, side: OrderSide): number {
  const slippagePct = SLIPPAGE_BPS / 10000;
  const direction = side === "BUY" ? 1 : -1;
  return price * (1 + direction * slippagePct);
}

function validateOrder(order: TradeOrder): OrderValidationError | null {
  if (!order.symbol || order.symbol.trim().length === 0) {
    return { approved: false, error: "Symbol is required", code: "INVALID_SYMBOL" };
  }
  if (!["BUY", "SELL"].includes(order.side)) {
    return { approved: false, error: "Invalid order side", code: "INVALID_SIDE" };
  }
  if (!["MARKET", "LIMIT", "STOP", "STOP_LIMIT"].includes(order.type)) {
    return { approved: false, error: "Invalid order type", code: "INVALID_TYPE" };
  }
  if (order.quantity <= 0) {
    return { approved: false, error: "Quantity must be greater than zero", code: "INVALID_QUANTITY" };
  }
  if ((order.type === "LIMIT" || order.type === "STOP_LIMIT") && !order.limitPrice) {
    return { approved: false, error: "Limit price required for limit orders", code: "MISSING_LIMIT_PRICE" };
  }
  if ((order.type === "STOP" || order.type === "STOP_LIMIT") && !order.stopPrice) {
    return { approved: false, error: "Stop price required for stop orders", code: "MISSING_STOP_PRICE" };
  }
  return null;
}

export function executeOrder(
  order: TradeOrder,
  currentMarketPrice: number,
): TradeResult | OrderValidationError {
  const validationError = validateOrder(order);
  if (validationError) return validationError;

  let fillPrice: number;
  if (order.type === "MARKET") {
    fillPrice = applySlippage(currentMarketPrice, order.side);
  } else if (order.type === "LIMIT" && order.limitPrice) {
    fillPrice = order.limitPrice;
  } else if (order.type === "STOP" && order.stopPrice) {
    fillPrice = applySlippage(order.stopPrice, order.side);
  } else {
    fillPrice = applySlippage(currentMarketPrice, order.side);
  }

  const totalValue = parseFloat((order.quantity * fillPrice).toFixed(2));
  const riskCheck = validateOrderRisk(order.accountBalance, totalValue);

  if (!riskCheck.approved) {
    return { approved: false, error: riskCheck.reason ?? "Order rejected by risk system", code: "RISK_REJECTED" };
  }

  const commission = parseFloat((totalValue * COMMISSION_RATE).toFixed(2));
  const slippage = parseFloat((Math.abs(fillPrice - currentMarketPrice) * order.quantity).toFixed(2));
  const netCost = order.side === "BUY"
    ? parseFloat((totalValue + commission).toFixed(2))
    : parseFloat((totalValue - commission).toFixed(2));

  return {
    orderId: generateOrderId(),
    symbol: order.symbol.toUpperCase(),
    side: order.side,
    type: order.type,
    status: "FILLED",
    requestedQty: order.quantity,
    filledQty: order.quantity,
    fillPrice: parseFloat(fillPrice.toFixed(6)),
    totalValue,
    commission,
    netCost,
    slippage,
    timestamp: new Date().toISOString(),
    riskLevel: riskCheck.riskLevel,
    message: `Order ${order.side === "BUY" ? "purchased" : "sold"} ${order.quantity} ${order.symbol.toUpperCase()} at $${fillPrice.toFixed(2)}`,
  };
}
