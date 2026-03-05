/**
 * Sign a request body with HMAC-SHA256.
 */
async function sign(body, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return Array.from(new Uint8Array(sig), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

/**
 * Make a signed request to the VPS webhook.
 */
async function vpsRequest(env, path, payload) {
  const body = JSON.stringify(payload);
  const signature = await sign(body, env.VPS_WEBHOOK_SECRET);

  const res = await fetch(`${env.VPS_WEBHOOK_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ICCA-Signature": signature,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`VPS error (${res.status}): ${text}`);
  }

  return res.json();
}

export async function vpsProvision(env, { username, password, expiresAt }) {
  return vpsRequest(env, "/provision", { username, password, expiresAt });
}

export async function vpsRemove(env, { username, containerId }) {
  return vpsRequest(env, "/remove", { username, containerId });
}

export async function vpsRestart(env, { username, containerId }) {
  return vpsRequest(env, "/restart", { username, containerId });
}

export async function vpsStop(env, { username, containerId }) {
  return vpsRequest(env, "/stop", { username, containerId });
}

export async function vpsStatus(env, { containerId }) {
  return vpsRequest(env, "/status", { containerId });
}
