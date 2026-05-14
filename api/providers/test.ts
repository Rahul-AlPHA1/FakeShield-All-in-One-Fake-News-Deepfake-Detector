import { testProviderConnection } from "../../lib/providerService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const config = req.body?.config || { provider: req.body?.provider || "gemini" };
    const result = await testProviderConnection(config);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Provider test failed." });
  }
}
