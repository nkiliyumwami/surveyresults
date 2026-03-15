export async function onRequestGet() {
  return Response.json({ status: "Function is reachable" });
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const response = await fetch('http://187.77.9.140/matching/api/match/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  return Response.json(data);
}
