import { json, err } from "./lib/utils.js";
import { handleLogin } from "./routes/auth.js";
import { handleMe } from "./routes/me.js";
import {
  handleListStudents,
  handleCreateStudent,
  handleExtend,
  handleRevoke,
  handleNotify,
  handleContainerRestart,
  handleContainerStop,
  handleContainerStatus,
} from "./routes/admin.js";
import { handleTelegramWebhook } from "./routes/telegram.js";
import { vpsStop } from "./lib/vps.js";

export default {
  /**
   * HTTP request handler.
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    let response;

    try {
      // Route matching
      if (method === "POST" && pathname === "/login") {
        response = await handleLogin(request, env);
      } else if (method === "GET" && pathname === "/me") {
        response = await handleMe(request, env);
      } else if (method === "GET" && pathname === "/admin/students") {
        response = await handleListStudents(request, env);
      } else if (method === "POST" && pathname === "/admin/students") {
        response = await handleCreateStudent(request, env);
      } else if (method === "POST" && pathname === "/admin/extend") {
        response = await handleExtend(request, env);
      } else if (method === "POST" && pathname === "/admin/revoke") {
        response = await handleRevoke(request, env);
      } else if (method === "POST" && pathname === "/admin/notify") {
        response = await handleNotify(request, env);
      } else if (method === "POST" && pathname === "/admin/container/restart") {
        response = await handleContainerRestart(request, env);
      } else if (method === "POST" && pathname === "/admin/container/stop") {
        response = await handleContainerStop(request, env);
      } else if (method === "POST" && pathname === "/admin/container/status") {
        response = await handleContainerStatus(request, env);
      } else if (method === "POST" && pathname === "/telegram/webhook") {
        response = await handleTelegramWebhook(request, env);
      } else if (method === "GET" && pathname === "/health") {
        response = json({ ok: true, timestamp: new Date().toISOString() });
      } else {
        response = err("Not found", 404);
      }
    } catch (e) {
      console.error("Unhandled error:", e);
      response = err("Internal server error", 500);
    }

    // Attach CORS headers to all responses
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }

    return response;
  },

  /**
   * Cron trigger handler — runs hourly.
   * Checks for expiring/expired students and sends notifications.
   */
  async scheduled(event, env, ctx) {
    const list = await env.ICCA_KV.list({ prefix: "student:" });

    for (const key of list.keys) {
      const raw = await env.ICCA_KV.get(key.name);
      if (!raw) continue;

      const student = JSON.parse(raw);
      if (student.role === "admin" || student.revoked) continue;

      const now = Date.now();
      const expires = new Date(student.expiresAt).getTime();
      const diff = expires - now;
      let changed = false;

      // 24h warning
      if (diff > 0 && diff <= 86400000 && !student.warned24h) {
        student.warned24h = true;
        changed = true;
        if (student.telegramId) {
          await sendTelegramNotification(
            env,
            student.telegramId,
            `⚠️ *Trial Expiring Soon*\n\nYour OpenClaw trial expires in less than 24 hours.\nUsername: \`${student.username}\``
          );
        }
      }

      // 1h warning
      if (diff > 0 && diff <= 3600000 && !student.warned1h) {
        student.warned1h = true;
        changed = true;
        if (student.telegramId) {
          await sendTelegramNotification(
            env,
            student.telegramId,
            `🚨 *Trial Expiring in 1 Hour*\n\nYour OpenClaw trial expires in less than 1 hour!\nUsername: \`${student.username}\``
          );
        }
      }

      // Expired — stop container
      if (diff <= 0 && !student.notifiedExpired) {
        student.notifiedExpired = true;
        student.status = "expired";
        changed = true;

        // Stop VPS container
        if (student.containerId) {
          try {
            await vpsStop(env, {
              username: student.username,
              containerId: student.containerId,
            });
          } catch {
            // best effort
          }
        }

        if (student.telegramId) {
          await sendTelegramNotification(
            env,
            student.telegramId,
            `❌ *Trial Expired*\n\nYour OpenClaw trial has ended. Your container has been stopped.\nContact your instructor to extend.`
          );
        }

        // Notify admin
        if (env.TELEGRAM_ADMIN_CHAT) {
          await sendTelegramNotification(
            env,
            env.TELEGRAM_ADMIN_CHAT,
            `📛 Student *${student.name}* (\`${student.username}\`) trial expired — container stopped.`
          );
        }
      }

      if (changed) {
        await env.ICCA_KV.put(key.name, JSON.stringify(student));
      }
    }
  },
};

async function sendTelegramNotification(env, chatId, text) {
  try {
    await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      }
    );
  } catch {
    // don't crash cron for TG failures
  }
}
