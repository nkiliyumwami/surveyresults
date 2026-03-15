const BACKEND_URL = "http://187.77.9.140/matching/api/match/run";

export async function onRequestPost(context) {
  const body = await context.request.text();

  const response = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
