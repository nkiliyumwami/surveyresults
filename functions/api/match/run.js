export async function onRequestPost(context) {
  const body = await context.request.text();
  const upstream = await fetch("https://matching.aikigali.com/api/match/run", {
    method: "POST",
    headers: {
      "Content-Type": context.request.headers.get("Content-Type") || "application/json",
      "Authorization": context.request.headers.get("Authorization") || "",
    },
    body,
  });
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set("Cache-Control", "no-store");
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://surveyresults.pages.dev",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Cache-Control": "no-store",
    },
  });
}
