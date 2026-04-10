export async function onRequestGet(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://cybermentor.aikigali.com',
  };

  try {
    const resp = await fetch(
      'https://script.google.com/macros/s/AKfycbwXjTBkN7dpGGHgLmsUFL17xrf3-juxbZ_dCXS39x0Z0eScMays9VkXwOWMHKIPoC--/exec',
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
