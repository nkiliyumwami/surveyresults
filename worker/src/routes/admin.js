import { json, err, hashPassword } from "../lib/utils.js";
import {
  vpsProvision,
  vpsRemove,
  vpsRestart,
  vpsStop,
  vpsStatus,
} from "../lib/vps.js";

/**
 * Verify the request has an admin session.
 * Returns the student record or a Response (error).
 */
async function requireAdmin(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return err("Missing authorization token", 401);
  }

  const token = auth.slice(7);
  const sessionRaw = await env.ICCA_KV.get(`session:${token}`);
  if (!sessionRaw) {
    return err("Invalid or expired session", 401);
  }

  const session = JSON.parse(sessionRaw);
  const studentRaw = await env.ICCA_KV.get(`student:${session.username}`);
  if (!studentRaw) {
    return err("Student not found", 404);
  }

  const student = JSON.parse(studentRaw);
  if (student.role !== "admin") {
    return err("Admin access required", 403);
  }

  return student;
}

/**
 * GET /admin/students — List all student records (excluding admins).
 */
export async function handleListStudents(request, env) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const list = await env.ICCA_KV.list({ prefix: "student:" });
  const students = [];

  for (const key of list.keys) {
    const raw = await env.ICCA_KV.get(key.name);
    if (!raw) continue;
    const s = JSON.parse(raw);
    if (s.role === "admin") continue;

    students.push({
      username: s.username,
      name: s.name,
      host: s.creds?.host || null,
      sshPort: s.creds?.sshPort || null,
      containerId: s.containerId || null,
      status: s.status,
      expiresAt: s.expiresAt,
      telegramLinked: !!s.telegramId,
      revoked: !!s.revoked,
      createdAt: s.createdAt,
    });
  }

  return json({ students });
}

/**
 * POST /admin/students — Provision a new student.
 */
export async function handleCreateStudent(request, env) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { username, name, password, days, telegramUsername } = body;
  if (!username || !name || !password || !days) {
    return err("username, name, password, and days are required", 400);
  }

  // Check if student already exists
  const existing = await env.ICCA_KV.get(`student:${username}`);
  if (existing) {
    return err("Student already exists", 409);
  }

  const expiresAt = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  ).toISOString();

  // Provision VPS container
  let vpsResult;
  try {
    vpsResult = await vpsProvision(env, { username, password, expiresAt });
  } catch (e) {
    return err(`VPS provisioning failed: ${e.message}`, 502);
  }

  const passwordHash = await hashPassword(password);

  const student = {
    username,
    name,
    passwordHash,
    role: "student",
    status: "running",
    expiresAt,
    containerId: vpsResult.containerId,
    telegramId: null,
    telegramUsername: telegramUsername || null,
    creds: {
      host: vpsResult.host,
      sshPort: vpsResult.sshPort,
      sshUser: username,
      sshPass: password,
    },
    warned24h: false,
    warned1h: false,
    notifiedExpired: false,
    revoked: false,
    createdAt: new Date().toISOString(),
  };

  await env.ICCA_KV.put(`student:${username}`, JSON.stringify(student));

  // Notify admin via Telegram
  try {
    await sendTelegramMessage(
      env,
      env.TELEGRAM_ADMIN_CHAT,
      `✅ *New student provisioned*\n\nName: ${name}\nUsername: \`${username}\`\nSSH: \`${vpsResult.host}:${vpsResult.sshPort}\`\nExpires: ${expiresAt}`
    );
  } catch {
    // Non-critical — don't fail provisioning if TG notification fails
  }

  return json({
    ok: true,
    host: vpsResult.host,
    sshPort: vpsResult.sshPort,
  });
}

/**
 * POST /admin/extend — Extend a student's trial.
 */
export async function handleExtend(request, env) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { username, days } = body;
  if (!username || !days) {
    return err("username and days are required", 400);
  }

  const raw = await env.ICCA_KV.get(`student:${username}`);
  if (!raw) return err("Student not found", 404);

  const student = JSON.parse(raw);
  const currentExpiry = new Date(student.expiresAt).getTime();
  const base = Math.max(currentExpiry, Date.now());
  student.expiresAt = new Date(base + days * 86400000).toISOString();
  student.warned24h = false;
  student.warned1h = false;
  student.notifiedExpired = false;

  // Restart container if it was stopped/expired
  if (student.status !== "running" && student.containerId) {
    try {
      await vpsRestart(env, {
        username: student.username,
        containerId: student.containerId,
      });
      student.status = "running";
    } catch {
      // best effort
    }
  }

  await env.ICCA_KV.put(`student:${username}`, JSON.stringify(student));

  return json({ ok: true });
}

/**
 * POST /admin/revoke — Revoke a student's access.
 */
export async function handleRevoke(request, env) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { username } = body;
  if (!username) return err("username is required", 400);

  const raw = await env.ICCA_KV.get(`student:${username}`);
  if (!raw) return err("Student not found", 404);

  const student = JSON.parse(raw);
  student.revoked = true;
  student.status = "revoked";

  // Remove VPS container
  if (student.containerId) {
    try {
      await vpsRemove(env, {
        username: student.username,
        containerId: student.containerId,
      });
    } catch {
      // best effort
    }
  }

  await env.ICCA_KV.put(`student:${username}`, JSON.stringify(student));

  // Invalidate all sessions for this user
  const sessions = await env.ICCA_KV.list({ prefix: "session:" });
  for (const key of sessions.keys) {
    const sessRaw = await env.ICCA_KV.get(key.name);
    if (!sessRaw) continue;
    const sess = JSON.parse(sessRaw);
    if (sess.username === username) {
      await env.ICCA_KV.delete(key.name);
    }
  }

  return json({ ok: true });
}

/**
 * POST /admin/notify — Send SSH credentials to student via Telegram.
 */
export async function handleNotify(request, env) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { username } = body;
  if (!username) return err("username is required", 400);

  const raw = await env.ICCA_KV.get(`student:${username}`);
  if (!raw) return err("Student not found", 404);

  const student = JSON.parse(raw);
  if (!student.telegramId) {
    return err("Student has not linked Telegram", 400);
  }

  const msg = [
    "🔐 *Your OpenClaw SSH Credentials*\n",
    `Host: \`${student.creds.host}\``,
    `Port: \`${student.creds.sshPort}\``,
    `Username: \`${student.creds.sshUser}\``,
    `Password: \`${student.creds.sshPass}\``,
    "",
    `\`ssh ${student.creds.sshUser}@${student.creds.host} -p ${student.creds.sshPort}\``,
  ].join("\n");

  await sendTelegramMessage(env, student.telegramId, msg);

  return json({ ok: true });
}

/**
 * POST /admin/container/restart
 */
export async function handleContainerRestart(request, env) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { username } = body;
  if (!username) return err("username is required", 400);

  const raw = await env.ICCA_KV.get(`student:${username}`);
  if (!raw) return err("Student not found", 404);

  const student = JSON.parse(raw);
  if (!student.containerId) return err("No container assigned", 400);

  await vpsRestart(env, {
    username: student.username,
    containerId: student.containerId,
  });

  student.status = "running";
  await env.ICCA_KV.put(`student:${username}`, JSON.stringify(student));

  return json({ ok: true });
}

/**
 * POST /admin/container/stop
 */
export async function handleContainerStop(request, env) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { username } = body;
  if (!username) return err("username is required", 400);

  const raw = await env.ICCA_KV.get(`student:${username}`);
  if (!raw) return err("Student not found", 404);

  const student = JSON.parse(raw);
  if (!student.containerId) return err("No container assigned", 400);

  await vpsStop(env, {
    username: student.username,
    containerId: student.containerId,
  });

  student.status = "stopped";
  await env.ICCA_KV.put(`student:${username}`, JSON.stringify(student));

  return json({ ok: true });
}

/**
 * POST /admin/container/status
 */
export async function handleContainerStatus(request, env) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { username } = body;
  if (!username) return err("username is required", 400);

  const raw = await env.ICCA_KV.get(`student:${username}`);
  if (!raw) return err("Student not found", 404);

  const student = JSON.parse(raw);
  if (!student.containerId) return err("No container assigned", 400);

  const result = await vpsStatus(env, { containerId: student.containerId });

  return json(result);
}

/**
 * Helper: send a Telegram message.
 */
async function sendTelegramMessage(env, chatId, text) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error: ${body}`);
  }
}
