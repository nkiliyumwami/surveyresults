import { json, err, verifyPassword } from "../lib/utils.js";

/**
 * POST /telegram/webhook
 * Handle incoming Telegram bot updates.
 */
export async function handleTelegramWebhook(request, env) {
  // Verify webhook secret
  const secretHeader = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secretHeader !== env.TELEGRAM_WEBHOOK_SECRET) {
    return err("Invalid webhook secret", 403);
  }

  let update;
  try {
    update = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const message = update.message;
  if (!message || !message.text) {
    return json({ ok: true }); // ignore non-text updates
  }

  const chatId = message.chat.id;
  const text = message.text.trim();

  if (text === "/start") {
    await sendReply(
      env,
      chatId,
      "👋 Welcome to the *ICCA OpenClaw Bot*!\n\nUse /link <username> <password> to connect your account.\n\nCommands:\n/link — Link your account\n/status — Check trial status\n/creds — View SSH credentials\n/help — Show this message"
    );
  } else if (text.startsWith("/link ")) {
    await handleLink(env, chatId, text, message.from);
  } else if (text === "/status") {
    await handleStatus(env, chatId);
  } else if (text === "/creds") {
    await handleCreds(env, chatId);
  } else if (text === "/help") {
    await sendReply(
      env,
      chatId,
      "📋 *OpenClaw Bot Commands*\n\n/link <username> <password> — Link your account\n/status — Check trial status\n/creds — View SSH credentials\n/help — Show this message"
    );
  } else {
    await sendReply(
      env,
      chatId,
      "Unknown command. Use /help to see available commands."
    );
  }

  return json({ ok: true });
}

/**
 * /link <username> <password>
 */
async function handleLink(env, chatId, text, from) {
  const parts = text.split(/\s+/);
  if (parts.length < 3) {
    return sendReply(env, chatId, "Usage: /link <username> <password>");
  }

  const username = parts[1];
  const password = parts.slice(2).join(" ");

  const raw = await env.ICCA_KV.get(`student:${username}`);
  if (!raw) {
    return sendReply(env, chatId, "❌ Student not found.");
  }

  const student = JSON.parse(raw);

  const valid = await verifyPassword(password, student.passwordHash);
  if (!valid) {
    return sendReply(env, chatId, "❌ Invalid credentials.");
  }

  // Link Telegram account
  student.telegramId = String(chatId);
  student.telegramUsername = from.username || null;

  await env.ICCA_KV.put(`student:${username}`, JSON.stringify(student));

  await sendReply(
    env,
    chatId,
    `✅ Account linked! Hello *${student.name}*.\n\nUse /creds to view your SSH credentials.`
  );
}

/**
 * /status — Show trial status for the linked account.
 */
async function handleStatus(env, chatId) {
  const student = await findStudentByChatId(env, chatId);
  if (!student) {
    return sendReply(
      env,
      chatId,
      "❌ No account linked. Use /link <username> <password> first."
    );
  }

  const now = Date.now();
  const expires = new Date(student.expiresAt).getTime();
  const diff = expires - now;

  if (diff <= 0) {
    return sendReply(env, chatId, "⏱ Your trial has *expired*.");
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);

  await sendReply(
    env,
    chatId,
    `📊 *Trial Status*\n\nStatus: ${student.status}\nTime remaining: *${days}d ${hours}h*\nExpires: ${student.expiresAt}`
  );
}

/**
 * /creds — Send SSH credentials.
 */
async function handleCreds(env, chatId) {
  const student = await findStudentByChatId(env, chatId);
  if (!student) {
    return sendReply(
      env,
      chatId,
      "❌ No account linked. Use /link <username> <password> first."
    );
  }

  const c = student.creds;
  const msg = [
    "🔐 *Your SSH Credentials*\n",
    `Host: \`${c.host}\``,
    `Port: \`${c.sshPort}\``,
    `Username: \`${c.sshUser}\``,
    `Password: \`${c.sshPass}\``,
    "",
    `\`ssh ${c.sshUser}@${c.host} -p ${c.sshPort}\``,
  ].join("\n");

  await sendReply(env, chatId, msg);
}

/**
 * Find a student record by Telegram chat ID.
 */
async function findStudentByChatId(env, chatId) {
  const list = await env.ICCA_KV.list({ prefix: "student:" });
  for (const key of list.keys) {
    const raw = await env.ICCA_KV.get(key.name);
    if (!raw) continue;
    const student = JSON.parse(raw);
    if (student.telegramId === String(chatId)) {
      return student;
    }
  }
  return null;
}

/**
 * Send a Telegram message.
 */
async function sendReply(env, chatId, text) {
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
}
