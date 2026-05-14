import { analyzeMediaWithProvider } from "../lib/providerService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { base64Data, mimeType, mediaType, config } = req.body || {};

  if (!base64Data || !mimeType || !["video", "audio", "image"].includes(mediaType)) {
    return res.status(400).json({ error: "Missing media payload." });
  }

  try {
    const result = await analyzeMediaWithProvider(base64Data, mimeType, mediaType, config || { provider: "auto" });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Media analysis failed." });
  }
}
