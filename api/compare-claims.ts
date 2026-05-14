import { compareClaimsWithProvider } from "../lib/providerService";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { left, right, config } = req.body || {};
  if (!left || !right || String(left).trim().length < 10 || String(right).trim().length < 10) {
    return res.status(400).json({ error: "Both claims need at least 10 characters." });
  }

  try {
    const result = await compareClaimsWithProvider(String(left), String(right), config || { provider: "auto" });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Claim comparison failed." });
  }
}
