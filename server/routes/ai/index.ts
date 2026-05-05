import { Router, type Request, type Response } from "express";
import { getAiProvider, type AiMessage } from "../../lib/ai/aiService.js";
import { buildSystemPrompt, buildStakeRecommendation, getStakingData, type UserAccountData, type LiveMarketData } from "../../lib/ai/tradingContext.js";
import {
  getRecentMessages, appendMessage, clearConversation, getConversation,
  saveCurrentAsSession, listSessions, getSession, deleteSession, restoreSession,
} from "../../lib/ai/chatStore.js";
import { aiChatLimit } from "../../middleware/security.js";
import { getUserBalance, getUserData } from "../../lib/userDataStore.js";
import { requireUser } from "../../middleware/requireUser.js";

let marketsCache: { data: LiveMarketData; ts: number } | null = null;
const MARKET_CACHE_TTL = 60_000;

async function getLiveMarketData(): Promise<LiveMarketData | undefined> {
  try {
    if (marketsCache && Date.now() - marketsCache.ts < MARKET_CACHE_TTL) {
      return marketsCache.data;
    }
    const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false";
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return marketsCache?.data;
    const raw = await response.json() as Array<{
      name: string; symbol: string; current_price: number;
      price_change_percentage_24h: number;
    }>;
    const data: LiveMarketData = {
      coins: raw.map(c => ({
        name: c.name,
        symbol: c.symbol,
        price: c.current_price,
        percent_change_24h: c.price_change_percentage_24h,
      })),
    };
    marketsCache = { data, ts: Date.now() };
    return data;
  } catch {
    return marketsCache?.data;
  }
}

const router = Router();

router.post("/ai/chat", requireUser, aiChatLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.user!.email;
    const { message } = req.body as { message?: string; email?: string };
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    await appendMessage(email, "user", message);

    let account: UserAccountData | undefined;
    let liveMarket: LiveMarketData | undefined;

    try {
      const [userData, bal, mkt] = await Promise.all([
        getUserData(email),
        getUserBalance(email),
        getLiveMarketData(),
      ]);
      if (userData) {
        account = {
          balance: bal.balance,
          profit: bal.profit,
          history: (bal.history ?? []) as UserAccountData["history"],
        };
      }
      liveMarket = mkt;
    } catch (dataErr) {
      console.warn("[AI] Could not load user/market data for system prompt:", dataErr);
    }

    const systemPrompt = buildSystemPrompt(email, account, liveMarket);
    const history = await getRecentMessages(email, 20);
    const messages: AiMessage[] = [
      systemPrompt,
      ...history.map((m) => ({ role: m.role as AiMessage["role"], content: m.content })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const provider = getAiProvider();
    let fullResponse = "";
    let clientDisconnected = false;
    let saved = false;

    req.on("close", () => { clientDisconnected = true; });

    for await (const chunk of provider.chatStream(messages)) {
      if (clientDisconnected) break;
      if (chunk.content) {
        fullResponse += chunk.content;
        res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
      }
      if (chunk.done && fullResponse) {
        await appendMessage(email, "assistant", fullResponse);
        saved = true;
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      }
    }

    if (!saved && fullResponse) {
      await appendMessage(email, "assistant", fullResponse);
    }

    res.end();
  } catch (err) {
    console.error("[AI] Chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "AI service error" });
    } else {
      try {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: "AI service error" })}\n\n`);
          res.end();
        }
      } catch (writeErr) {
        console.error("[AI] Failed to write error to stream:", writeErr);
      }
    }
  }
});

router.get("/ai/history", requireUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.user!.email;
    const conv = await getConversation(email);
    res.json({
      id: conv.id,
      messages: conv.messages.filter((m) => m.role !== "system"),
    });
  } catch (err) {
    console.error("[AI] History error:", err);
    res.status(500).json({ error: "Failed to load chat history" });
  }
});

router.post("/ai/clear", requireUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.user!.email;
    await clearConversation(email);
    res.json({ success: true });
  } catch (err) {
    console.error("[AI] Clear error:", err);
    res.status(500).json({ error: "Failed to clear conversation" });
  }
});

/* ── Conversation sessions ──────────────────────────────────────── */

router.get("/ai/sessions", requireUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.user!.email;
    const sessions = await listSessions(email.toLowerCase().trim());
    res.json({ sessions });
  } catch (err) {
    console.error("[AI] List sessions error:", err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
});

router.post("/ai/sessions", requireUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const normalEmail = req.user!.email.toLowerCase().trim();
    const sessionId = await saveCurrentAsSession(normalEmail);
    if (sessionId) {
      await clearConversation(normalEmail);
    }
    res.json({ sessionId, cleared: true });
  } catch (err) {
    console.error("[AI] Save session error:", err);
    res.status(500).json({ error: "Failed to save session" });
  }
});

router.post("/ai/sessions/resume", requireUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body as { sessionId?: string };
    if (!sessionId) {
      res.status(400).json({ error: "sessionId required" });
      return;
    }
    const normalEmail = req.user!.email.toLowerCase().trim();
    const messages = await restoreSession(normalEmail, sessionId);
    res.json({ messages });
  } catch (err) {
    console.error("[AI] Resume session error:", err);
    res.status(500).json({ error: "Failed to resume session" });
  }
});

router.get("/ai/sessions/:id", requireUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const email = req.user!.email;
    const session = await getSession(id, email.toLowerCase().trim());
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session);
  } catch (err) {
    console.error("[AI] Get session error:", err);
    res.status(500).json({ error: "Failed to load session" });
  }
});

router.delete("/ai/sessions/:id", requireUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const email = req.user!.email;
    await deleteSession(id, email.toLowerCase().trim());
    res.json({ success: true });
  } catch (err) {
    console.error("[AI] Delete session error:", err);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

/* ── Market / staking ───────────────────────────────────────────── */

router.get("/ai/market", async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await getLiveMarketData();
    res.json(data ?? { coins: [] });
  } catch (err) {
    console.error("[AI] Market error:", err);
    res.status(500).json({ error: "Failed to load market data" });
  }
});

router.get("/ai/staking", (_req: Request, res: Response): void => {
  try {
    res.json(getStakingData());
  } catch (err) {
    console.error("[AI] Staking error:", err);
    res.status(500).json({ error: "Failed to load staking data" });
  }
});

router.get("/ai/stake-calculator", async (req: Request, res: Response): Promise<void> => {
  try {
    const { balance, risk, market, email } = req.query as {
      balance?: string;
      risk?: string;
      market?: string;
      email?: string;
    };

    let parsedBalance = balance ? parseFloat(balance) : undefined;
    if (parsedBalance !== undefined && (isNaN(parsedBalance) || parsedBalance <= 0)) {
      res.status(400).json({ error: "balance must be a positive number" });
      return;
    }

    if (!parsedBalance && email) {
      try {
        const bal = await getUserBalance(email);
        parsedBalance = bal.balance > 0 ? bal.balance : undefined;
      } catch {
        // ignore
      }
    }

    const riskLevels = ["low", "medium", "high"] as const;
    const riskTolerance = riskLevels.includes(risk as typeof riskLevels[number])
      ? (risk as typeof riskLevels[number])
      : "medium";

    const marketConditions = ["bullish", "bearish", "neutral"] as const;
    const marketCondition = marketConditions.includes(market as typeof marketConditions[number])
      ? (market as typeof marketConditions[number])
      : undefined;

    const effectiveBalance = parsedBalance ?? 0;
    const result = buildStakeRecommendation(effectiveBalance, riskTolerance, marketCondition);
    res.json({
      balance: effectiveBalance,
      riskTolerance,
      marketCondition: marketCondition ?? "neutral",
      ...result,
    });
  } catch (err) {
    console.error("[AI] Stake calculator error:", err);
    res.status(500).json({ error: "Failed to calculate stake recommendation" });
  }
});

router.get("/ai/provider", (_req: Request, res: Response): void => {
  try {
    const provider = getAiProvider();
    res.json({ provider: provider.name });
  } catch {
    res.json({ provider: "none", error: "No AI provider configured" });
  }
});

router.get("/ai/status", (_req: Request, res: Response): void => {
  const hasOpenAi = !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL);
  const hasGrok = !!(process.env.XAI_API_KEY || process.env.GROK_API_KEY);
  const hasCloudflare = !!(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID);

  try {
    const provider = getAiProvider();
    res.json({
      configured: true,
      provider: provider.name,
      message: `Guardian AI is active using the ${provider.name} provider.`,
    });
  } catch (err) {
    res.json({
      configured: false,
      provider: null,
      message: "No AI provider is configured. Set AI_INTEGRATIONS_OPENAI_API_KEY, XAI_API_KEY, or CLOUDFLARE_API_TOKEN.",
      hints: {
        openai: hasOpenAi,
        grok: hasGrok,
        cloudflare: hasCloudflare,
      },
    });
  }
});

export default router;
