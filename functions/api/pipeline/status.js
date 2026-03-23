export async function onRequestGet(context) {
  const resp = await fetch('https://matching.aikigali.com/api/pipeline/status');
  const data = await resp.json();
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://cybermentor.aikigali.com',
    },
  });
}
