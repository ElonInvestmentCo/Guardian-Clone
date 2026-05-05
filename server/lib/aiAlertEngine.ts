import { emitToUser } from "./socketServer.js";
import { getUserBalance } from "./userDataStore.js";
import { getPool } from "./db.js";

const MARGIN_LOW_THRESHOLD = 1000;
const RISK_CHECK_INTERVAL_MS = 5 * 60 * 1000;

async function getAllApprovedUsers(): Promise<string[]> {
  try {
    const pool = getPool();
    const result = await pool.query<{ email: string }>(
      `SELECT email FROM users WHERE data->>'status' = 'approved' LIMIT 200`,
    );
    return result.rows.map((r) => r.email);
  } catch (err) {
    console.warn("[AIAlertEngine] Could not query users:", err);
    return [];
  }
}

async function runMarginCheck(): Promise<void> {
  const users = await getAllApprovedUsers();
  for (const email of users) {
    try {
      const bal = await getUserBalance(email);
      if (bal.balance > 0 && bal.balance < MARGIN_LOW_THRESHOLD) {
        emitToUser(email, "ai:alert", {
          type: "MARGIN_CALL",
          severity: "HIGH",
          message: `Account balance critically low at $${bal.balance.toFixed(2)}`,
          recommendedAction: "Deposit funds or reduce open positions to avoid forced liquidation",
          balance: bal.balance,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      /* skip user on error */
    }
  }
}

export function emitTradeSignal(
  email: string,
  signal: {
    asset: string;
    action: "BUY" | "SELL";
    confidence: number;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    reasoning?: string;
  },
): void {
  emitToUser(email, "ai:signal", {
    ...signal,
    timestamp: new Date().toISOString(),
  });
}

export function emitMarginCall(email: string, balance: number): void {
  emitToUser(email, "ai:alert", {
    type: "MARGIN_CALL",
    severity: "HIGH",
    message: "Your margin level is critically low",
    recommendedAction: "Add funds or close positions immediately to avoid forced liquidation",
    balance,
    timestamp: new Date().toISOString(),
  });
}

export function emitRiskAlert(
  email: string,
  details: { message: string; severity: "LOW" | "MEDIUM" | "HIGH"; recommendedAction?: string },
): void {
  emitToUser(email, "ai:alert", {
    type: "RISK_ALERT",
    ...details,
    timestamp: new Date().toISOString(),
  });
}

export function emitBalanceUpdate(email: string, balance: number, profit: number): void {
  emitToUser(email, "account:balance_update", {
    balance,
    profit,
    timestamp: new Date().toISOString(),
  });
}

export function emitTradeExecuted(
  email: string,
  trade: { id: string; symbol: string; side: "BUY" | "SELL"; qty: number; price: number; type: string },
): void {
  emitToUser(email, "trade:executed", {
    ...trade,
    timestamp: new Date().toISOString(),
  });
}

export function emitSystemNotification(email: string, message: string): void {
  emitToUser(email, "system:notification", {
    type: "info",
    message,
    timestamp: new Date().toISOString(),
  });
}

export function startAiAlertEngine(): void {
  setTimeout(async () => {
    try {
      await runMarginCheck();
    } catch (err) {
      console.error("[AIAlertEngine] Initial margin check error:", err);
    }
  }, 30_000);

  setInterval(async () => {
    try {
      await runMarginCheck();
    } catch (err) {
      console.error("[AIAlertEngine] Periodic margin check error:", err);
    }
  }, RISK_CHECK_INTERVAL_MS);

  console.log("[AIAlertEngine] AI Alert Engine started (margin checks every 5 min)");
}
