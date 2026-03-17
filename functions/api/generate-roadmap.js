export async function onRequestPost(context) {
  const { prompt } = await context.request.json();

  if (!prompt) {
    return new Response(JSON.stringify({ error: "No prompt provided" }), { status: 400 });
  }

  const apiKey = context.env.OPENROUTER_API_KEY;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cybermentor.aikigali.com",
        "X-Title": "CyberMentor"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ result: text }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://cybermentor.aikigali.com",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Roadmap generation failed" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://cybermentor.aikigali.com",
      },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://cybermentor.aikigali.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
