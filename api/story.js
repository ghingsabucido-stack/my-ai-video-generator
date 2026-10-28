
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing GEMINI_API_KEY in Vercel environment variables."
    });
  }

  try {
    const topic = req.body?.topic?.trim();

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
          model: "gemini-3.8-flash",
          input:
            "Write an original children's story in simple English " +
            "for ages 3 to 7 about this topic: " + topic +
            "\n\nMake it 120–180 words, warm, cute, safe, " +
            "easy to narrate, and end happily. Include a short title. " +
            "Return only the story, without explanations."
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Story generation failed."
      });
    }

    const story = (
      data.output_text ||
      data.output?.map(item =>
        (item.content || [])
          .map(part => part.text || "")
          .join("\n")
      ).join("\n") ||
      ""
    ).trim();

    if (!story) {
      return res.status(500).json({
        error: "The AI did not return a story. Please try again."
      });
    }

    return res.status(200).json({ story });
  } catch (error) {
    return res.status(500).json({
      error: "Unable to generate the story. Please try again."
    });
  }
}
