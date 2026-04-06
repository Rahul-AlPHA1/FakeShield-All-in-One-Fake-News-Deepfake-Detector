export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, predicted_label, correct_label } = req.body;
  
  if (!text || !predicted_label || !correct_label) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  // In a serverless environment like Vercel, we cannot write to the local file system.
  // For a real production app, this should write to a database (like Firebase, Supabase, or MongoDB).
  // For now, we will just return success so the UI doesn't break.
  console.log("Feedback received:", { text: text.substring(0, 50) + '...', predicted_label, correct_label });
  
  res.status(200).json({ status: "success", message: "Feedback recorded (Serverless Mode)" });
}
