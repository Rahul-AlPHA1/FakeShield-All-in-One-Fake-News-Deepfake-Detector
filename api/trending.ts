import { getTrendingMisinformation } from "../lib/trendingService.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = await getTrendingMisinformation();
  res.status(200).json(result);
}
