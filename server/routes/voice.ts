import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

const XAI_VOICE_API = "https://api.x.ai/v1/realtime/client_secrets";

router.post("/voice/token", async (req: Request, res: Response) => {
  const apiKey =
    process.env.XAI_API_KEY ||
    process.env.GROK_API_KEY;

  if (!apiKey) {
    res.status(503).json({
      error: "Voice agent not configured. Set XAI_API_KEY as a secret to enable this feature.",
    });
    return;
  }

  try {
    const response = await fetch(XAI_VOICE_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expires_after: { seconds: 300 } }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[Voice] xAI token mint failed:", response.status, body);
      res.status(502).json({ error: "Failed to create voice session token." });
      return;
    }

    const data = (await response.json()) as { value: string; expires_at: number };
    res.json({ token: data.value, expiresAt: data.expires_at });
  } catch (err) {
    console.error("[Voice] Token endpoint error:", err);
    res.status(500).json({ error: "Voice token request failed." });
  }
});

export default router;
