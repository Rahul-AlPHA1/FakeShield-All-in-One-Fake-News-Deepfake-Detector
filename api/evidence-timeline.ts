import { getEvidenceTimeline } from "../lib/intelligenceService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, sourceUrl } = req.body || {};
  const result = await getEvidenceTimeline(String(query || ""), sourceUrl || null);
  res.status(200).json(result);
}
