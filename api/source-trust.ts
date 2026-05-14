import { scoreSourceTrust } from "../lib/intelligenceService";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sourceUrl } = req.body || {};
  res.status(200).json(scoreSourceTrust(sourceUrl || null));
}
