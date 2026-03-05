import { json, err, generateToken, verifyPassword } from "../lib/utils.js";

/**
 * POST /login
 * Authenticate a student and issue a session token.
 */
export async function handleLogin(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { username, password } = body;
  if (!username || !password) {
    return err("Username and password are required", 400);
  }

  // Load student record
  const raw = await env.ICCA_KV.get(`student:${username}`);
  if (!raw) {
    return err("Invalid credentials", 401);
  }

  const student = JSON.parse(raw);

  // Check revoked
  if (student.revoked) {
    return err("Account has been revoked", 403);
  }

  // Check expired
  if (new Date(student.expiresAt) < new Date()) {
    return err("Trial has expired", 403);
  }

  // Verify password
  const valid = await verifyPassword(password, student.passwordHash);
  if (!valid) {
    return err("Invalid credentials", 401);
  }

  // Issue session token (8 hour TTL)
  const token = generateToken(32);
  await env.ICCA_KV.put(
    `session:${token}`,
    JSON.stringify({ username: student.username, createdAt: new Date().toISOString() }),
    { expirationTtl: 28800 }
  );

  // Sanitized student object (no passwordHash)
  const sanitized = {
    username: student.username,
    name: student.name,
    role: student.role,
    status: student.status,
    expiresAt: student.expiresAt,
    telegramLinked: !!student.telegramId,
    telegramUsername: student.telegramUsername || null,
  };

  return json({
    token,
    student: sanitized,
    creds: student.creds,
  });
}
