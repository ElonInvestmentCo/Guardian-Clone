import { Router, type Request, type Response } from "express";
import { requireUser } from "../middleware/requireUser.js";
import { getUserBalance } from "../lib/userDataStore.js";
import {
  executeOrder,
  calculatePositionSize,
  assessPortfolioRisk,
  calculateMarginLevel,
} from "../modules/guardian-trading/index.js";
import { emitTradeExecuted, emitRiskAlert } from "../lib/aiAlertEngine.js";

const router = Router();

/* ── GET /api/trading/status ─────────────────────────────────────── */
router.get("/trading/status", requireUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.user!.email;
    const bal = await getUserBalance(email);

    const portfolioRisk = assessPortfolioRisk(bal.balance, 0, 0);
    const marginLevel = calculateMarginLevel(bal.balance, 0);

    res.json({
      accountBalance: bal.balance,
      profit: bal.profit,
      openPositions: 0,
      buyingPower: bal.balance,
      marginStatus: marginLevel,
      portfolioRisk,
      tradingEnabled: bal.balance > 0 && marginLevel.status !== "LIQUIDATION",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Trading] Status error:", err);
    res.status(500).json({ error: "Failed to load trading status" });
  }
});

/* ── POST /api/trading/execute ───────────────────────────────────── */
router.post("/trading/execute", requireUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.user!.email;
    const {
      symbol,
      side,
      type = "MARKET",
      quantity,
      limitPrice,
      stopPrice,
      currentPrice,
    } = req.body as {
      symbol?: string;
      side?: string;
      type?: string;
      quantity?: number;
      limitPrice?: number;
      stopPrice?: number;
      currentPrice?: number;
    };

    if (!symbol || !side || !quantity || !currentPrice) {
      res.status(400).json({ error: "symbol, side, quantity, and currentPrice are required" });
      return;
    }

    const bal = await getUserBalance(email);

    const result = executeOrder(
      {
        symbol,
        side: side as "BUY" | "SELL",
        type: (type as "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT") ?? "MARKET",
        quantity,
        limitPrice,
        stopPrice,
        accountBalance: bal.balance,
      },
      currentPrice,
    );

    if ("approved" in result && result.approved === false) {
      res.status(422).json({ error: result.error, code: result.code });
      return;
    }

    const tradeResult = result as Exclude<typeof result, { approved: false }>;

    emitTradeExecuted(email, {
      id: tradeResult.orderId,
      symbol: tradeResult.symbol,
      side: tradeResult.side,
      qty: tradeResult.filledQty,
      price: tradeResult.fillPrice,
      type: tradeResult.type,
    });

    if (tradeResult.riskLevel === "HIGH") {
      emitRiskAlert(email, {
        message: `High-risk order filled: ${tradeResult.side} ${tradeResult.filledQty} ${tradeResult.symbol} at $${tradeResult.fillPrice}`,
        severity: "HIGH",
        recommendedAction: "Monitor position closely — set stop-loss if not already configured",
      });
    }

    res.json(tradeResult);
  } catch (err) {
    console.error("[Trading] Execute error:", err);
    res.status(500).json({ error: "Trade execution failed" });
  }
});

/* ── POST /api/trading/position-size ─────────────────────────────── */
router.post("/trading/position-size", requireUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.user!.email;
    const {
      entryPrice,
      stopLoss,
      takeProfit,
      riskTolerance = "medium",
    } = req.body as {
      entryPrice?: number;
      stopLoss?: number;
      takeProfit?: number;
      riskTolerance?: "low" | "medium" | "high";
    };

    if (!entryPrice || !stopLoss || !takeProfit) {
      res.status(400).json({ error: "entryPrice, stopLoss, and takeProfit are required" });
      return;
    }

    const bal = await getUserBalance(email);
    const result = calculatePositionSize(bal.balance, entryPrice, stopLoss, takeProfit, riskTolerance);
    res.json({ accountBalance: bal.balance, ...result });
  } catch (err) {
    console.error("[Trading] Position size error:", err);
    res.status(500).json({ error: "Failed to calculate position size" });
  }
});

export default router;
