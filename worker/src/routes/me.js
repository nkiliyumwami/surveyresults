import { json, err } from "../lib/utils.js";

/**
 * GET /me
 * Return the current session's student data and credentials.
 */
export async function handleMe(request, env) {
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
    student: sanitized,
    creds: student.creds,
  });
}
