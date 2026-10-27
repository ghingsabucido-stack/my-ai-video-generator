
export default async function handler(req, res) {
  const apiKey = process.env.MAGIC_HOUR_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing Magic Hour API key in Vercel."
    });
  }

  // Check the status of an existing video.
  if (req.method === "GET") {
    const id = req.query?.id;

    if (!id) {
      return res.status(400).json({
        error: "Please provide a video job ID."
      });
    }

    try {
      const response = await fetch(
        `https://api.magichour.ai/v1/video-projects/${encodeURIComponent(id)}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        }
      );

      const data = await response.json();

      return res.status(response.status).json(data);
    } catch {
      return res.status(500).json({
        error: "Unable to check video status."
      });
    }
  }

  // Create a new video only when requested.
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const prompt = req.body?.prompt?.trim();

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
    return res.status(response.status).json(data);
  } catch {
    return res.status(500).json({
      error: "Unable to contact Magic Hour."
    });
  }
}
