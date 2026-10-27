
import express from "express";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.post("/api/generate", async (req, res) => {
  try {
    const apiKey = process.env.MAGIC_HOUR_API_KEY;
    const prompt = req.body?.prompt?.trim();

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing MAGIC_HOUR_API_KEY in server environment."
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
        error: data.message || data.error || "Magic Hour request failed.",
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Unable to contact Magic Hour API."
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
