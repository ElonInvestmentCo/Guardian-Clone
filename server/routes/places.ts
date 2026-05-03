import { Router } from "express";

const router = Router();

function apiKey(): string {
  return process.env["GOOGLE_PLACES_API_KEY"] ?? "";
}

router.get("/places/autocomplete", async (req, res) => {
  const key = apiKey();
  if (!key) {
    res.json({ status: "NO_API_KEY", predictions: [] });
    return;
  }

  const { input, sessiontoken } = req.query;
  if (!input || typeof input !== "string" || input.trim().length < 2) {
    res.json({ status: "INVALID_REQUEST", predictions: [] });
    return;
  }

  try {
    const params = new URLSearchParams({
      input: input.trim().slice(0, 200),
      key,
      types: "address",
    });
    if (typeof sessiontoken === "string" && sessiontoken.trim()) {
      params.set("sessiontoken", sessiontoken.trim().slice(0, 64));
    }
    const upstream = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
      { headers: { Accept: "application/json" } }
    );
    if (!upstream.ok) {
      res.status(502).json({ status: "UPSTREAM_ERROR", predictions: [] });
      return;
    }
    const data = await upstream.json() as Record<string, unknown>;
    res.json(data);
  } catch (err) {
    console.error("[Places] autocomplete error:", (err as Error).message);
    res.status(502).json({ status: "UPSTREAM_ERROR", predictions: [] });
  }
});

router.get("/places/details", async (req, res) => {
  const key = apiKey();
  if (!key) {
    res.json({ status: "NO_API_KEY", result: null });
    return;
  }

  const { place_id, sessiontoken } = req.query;
  if (!place_id || typeof place_id !== "string") {
    res.status(400).json({ error: "place_id is required" });
    return;
  }

  try {
    const params = new URLSearchParams({
      place_id: place_id.trim().slice(0, 256),
      key,
      fields: "address_components,formatted_address",
    });
    if (typeof sessiontoken === "string" && sessiontoken.trim()) {
      params.set("sessiontoken", sessiontoken.trim().slice(0, 64));
    }
    const upstream = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
      { headers: { Accept: "application/json" } }
    );
    if (!upstream.ok) {
      res.status(502).json({ status: "UPSTREAM_ERROR", result: null });
      return;
    }
    const data = await upstream.json() as Record<string, unknown>;
    res.json(data);
  } catch (err) {
    console.error("[Places] details error:", (err as Error).message);
    res.status(502).json({ status: "UPSTREAM_ERROR", result: null });
  }
});

export default router;
