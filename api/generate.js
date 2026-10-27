
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.MAGIC_HOUR_API_KEY;
    const prompt = req.body?.prompt?.trim();

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing Magic Hour API key in Vercel."
      });
    }

    if (!prompt) {
      return res.status(400).json({
        error: "Please enter a video description."
      });
    }

    const response = await fetch(
      "https://api.magichour.ai/v1/text-to-video",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          end_seconds: 3,
          aspect_ratio: "16:9",
          style: { prompt },
          name: "My AI Video Generator",
          model: "ltx-2.5",
          resolution: "480p",
          audio: false
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || data.error || "Magic Hour request failed."
      });
    }

    return res.status(200).json(data);
  } catch {
    return res.status(500).json({
      error: "Unable to contact Magic Hour."
    });
  }
}
