export async function onRequestGet(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://cybermentor.aikigali.com',
  };

  try {
    const resp = await fetch(
      'https://script.google.com/macros/s/AKfycbwOwKAk0A4epU_wGAu_43wkSSMen4E29OWxXovadvS0W4HiMRJRfZJe4v7xI2Z-IAfo7Q/exec',
      { redirect: 'follow' }
    );
    const text = await resp.text();

    // Verify we got valid JSON back, not an HTML error page
    try {
      JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Upstream returned invalid JSON', upstream: text.substring(0, 200) }),
        { status: 502, headers }
      );
    }

    return new Response(text, { headers });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch from upstream', message: String(err) }),
      { status: 502, headers }
    );
  }
}
