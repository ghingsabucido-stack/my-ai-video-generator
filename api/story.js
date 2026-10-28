
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing OPENAI_API_KEY in Vercel environment variables."
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
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions:
            "You are a friendly children's storyteller. Write an original, delightful short story in simple English for children ages 3 to 7. Use a cute, warm narrator-friendly style, gentle humor, vivid but simple scenes, and a happy or comforting ending. Keep it around 120 to 180 words. Make it safe and age-appropriate. Return only the story, with a short title and no explanations.",
          input: `Write a children's story about this topic: ${topic}`
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Story generation failed."
      });
    }

    const story = (data.output || [])
      .filter(item => item.type === "message")
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n")
      .trim();

    if (!story) {
      return res.status(500).json({
        error: "The AI did not return a story. Please try again."
      });
    }

    return res.status(200).json({ story });
  } catch (error) {
    return res.status(500).json({
      error: "Unable to generate the story."
    });
  }
}
