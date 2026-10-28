
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing GEMINI_API_KEY in Vercel."
    });
  }

  try {
    const topic =
      typeof req.body?.topic === "string"
        ? req.body.topic.trim()
        : "";

    if (!topic) {
      return res.status(400).json({
        error: "Please enter a story topic."
      });
    }

    if (topic.length > 200) {
      return res.status(400).json({
        error: "Please keep the topic under 200 characters."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          model: "gemini-3.1-flash-lite",
          input:
            "Write an original children's story in simple English " +
            "for children ages 3 to 7 about this topic: " +
            topic +
            "\n\nWrite 120 to 180 words. Include a short title, " +
            "a clear beginning, middle, and ending, cute characters, " +
            "and a happy ending. Make it safe and suitable for " +
            "children's video narration. Return only the story."
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(response.status).json({
        error:
          data.error?.message ||
          "Gemini could not generate the story."
      });
    }

    // Extract text from the Interactions API response.
    let story = "";

    if (typeof data.output_text === "string") {
      story = data.output_text;
    }

    if (!story && Array.isArray(data.steps)) {
      story = data.steps
        .filter(step => step.type === "model_output")
        .flatMap(step => step.content || [])
        .filter(part => part.type === "text")
        .map(part => part.text || "")
        .join("\n");
    }

    // Compatibility fallback for other response shapes.
    if (!story && Array.isArray(data.output)) {
      story = data.output
        .flatMap(item => item.content || [])
        .filter(part => !part.type || part.type === "text")
        .map(part => part.text || "")
        .join("\n");
    }

    story = story.trim();

    if (!story) {
      console.error(
        "Gemini returned no story text. Status:",
        data.status,
        "Response keys:",
        Object.keys(data)
      );

      return res.status(502).json({
        error:
          "Gemini returned no story text. Status: " +
          (data.status || "unknown") +
          ". Please check the Vercel function logs."
      });
    }

    return res.status(200).json({ story });
  } catch (error) {
    console.error("Story generation error:", error);

    return res.status(500).json({
      error:
        "Unable to generate the story. Please check the Vercel logs."
    });
  }
}
