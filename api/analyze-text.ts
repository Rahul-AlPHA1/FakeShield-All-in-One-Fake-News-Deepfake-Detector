import { analyzeTextWithProvider } from "../lib/providerService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, sourceUrl, config } = req.body || {};

  if (!text || typeof text !== "string" || text.trim().length < 10) {
    return res.status(400).json({ error: "Please enter more text (at least 10 characters)." });
  }

  try {
    const result = await analyzeTextWithProvider(text, sourceUrl || null, config || { provider: "auto" });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Text analysis failed." });
  }
}
