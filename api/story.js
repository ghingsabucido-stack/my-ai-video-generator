
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error:
        "Missing GEMINI_API_KEY. Please check your Vercel environment variables."
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
            "\n\n" +
            "Requirements:\n" +
            "- Write 120 to 180 words.\n" +
            "- Give the story a short, charming title.\n" +
            "- Use simple English suitable for young children.\n" +
            "- Make the story warm, cute, imaginative, and safe.\n" +
            "- Include a clear beginning, middle, and ending.\n" +
            "- End with a happy or comforting conclusion.\n" +
            "- Make it suitable for children's video narration.\n" +
            "- Return only the story and its title, without explanations."
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini story API error:", data);

      return res.status(response.status).json({
        error:
          data.error?.message ||
          "Story generation failed. Please try again."
      });
    }

    const story = (
      data.output_text ||
      data.output
        ?.map((item) =>
          (item.content || [])
            .map((part) => part.text || "")
            .join("\n")
        )
        .join("\n") ||
      ""
    ).trim();

    if (!story) {
      console.error("Gemini returned no story text:", data);

      return res.status(500).json({
        error:
          "The AI did not return a story. Please try again."
      });
    }

    return res.status(200).json({
      story: story
    });
  } catch (error) {
    console.error("Story generation error:", error);

    return res.status(500).json({
      error:
        "Unable to generate the story. Please try again."
    });
  }
}
