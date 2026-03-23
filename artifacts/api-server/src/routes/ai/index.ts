import { Router, type Request, type Response } from "express";
import { getAiProvider, type AiMessage } from "../../lib/ai/aiService.js";
import { buildSystemPrompt, getPortfolioData, getMarketData, getStakingData } from "../../lib/ai/tradingContext.js";
import { getRecentMessages, appendMessage, clearConversation, getConversation } from "../../lib/ai/chatStore.js";

const router = Router();

router.post("/ai/chat", async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, email } = req.body as { message?: string; email?: string };
    if (!message || !email) {
      res.status(400).json({ error: "message and email are required" });
      return;
    }

    appendMessage(email, "user", message);

    const systemPrompt = buildSystemPrompt(email);
    const history = getRecentMessages(email, 20);
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
        appendMessage(email, "assistant", fullResponse);
        saved = true;
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      }
    }

    if (!saved && fullResponse) {
      appendMessage(email, "assistant", fullResponse);
    }

    res.end();
  } catch (err) {
    console.error("[AI] Chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "AI service error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "AI service error" })}\n\n`);
      res.end();
    }
  }
});

router.get("/ai/history", (req: Request, res: Response): void => {
  const email = req.query.email as string;
  if (!email) { res.status(400).json({ error: "email is required" }); return; }

  const conv = getConversation(email);
  res.json({
    id: conv.id,
    messages: conv.messages.filter((m) => m.role !== "system"),
  });
});

router.post("/ai/clear", (req: Request, res: Response): void => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "email is required" }); return; }
  clearConversation(email);
  res.json({ success: true });
});

router.get("/ai/portfolio", (_req: Request, res: Response): void => {
  res.json(getPortfolioData());
});

router.get("/ai/market", (_req: Request, res: Response): void => {
  res.json(getMarketData());
});

router.get("/ai/staking", (_req: Request, res: Response): void => {
  res.json(getStakingData());
});

router.get("/ai/provider", (_req: Request, res: Response): void => {
  try {
    const provider = getAiProvider();
    res.json({ provider: provider.name });
  } catch {
    res.json({ provider: "none", error: "No AI provider configured" });
  }
});

export default router;
