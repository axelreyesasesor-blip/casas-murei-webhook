const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v23.0";

// ------------------------------------------------------------
// CASAS MUREI - DATOS DEL INMUEBLE
// ------------------------------------------------------------
const PROPERTY = {
  business: "CASAS MUREI",
  price: "$799,000",
  location: "Buena Vista 3er Sector, El Carmen, Nuevo León",
  bedrooms: 2,
  bathrooms: 1,
  features: [
    "Vitropiso",
    "Protectores en ventanas",
    "Casa remodelada",
    "Sin adeudos"
  ],
  acceptedPayments: ["Infonavit", "contado"],
  appraisal: "$6,500",
};

// ------------------------------------------------------------
// REGLAS ESPECIALES DEFINIDAS PARA EL BOT
// ------------------------------------------------------------
const SPECIAL_RULES = {
  // La pregunta 14 SIEMPRE debe indicar que la casa está disponible.
  q14AlwaysAvailable: true,

  // La pregunta 17: no ofrecer ni aceptar otra forma de pago.
q17OnlyPayments:
  "Únicamente aceptamos Infonavit o pago de contado. No aceptamos ninguna otra forma de pago.",

  // La pregunta 19: explicar todo lo que cubre el avalúo.
  q19Appraisal:
    "El pago del avalúo es de $6,500 y también cubre la separación de la casa, la carta de no propiedad y la actualización de documentos oficiales."
};

// ------------------------------------------------------------
// CONVERSACIÓN
// ------------------------------------------------------------
// IMPORTANTE:
// Los mensajes 1-13 y el texto exacto de los 15-16 y 18
// no están incluidos en el contexto disponible de esta sesión.
// No los inventamos para no alterar la conversación que ya habías aprobado.
//
// Cuando tengas el texto completo, puedes reemplazar estos campos
// directamente. Las reglas 14, 17 y 19 ya están protegidas abajo.
const CONVERSATION = {
  q01: null,
  q02: null,
  q03: null,
  q04: null,
  q05: null,
  q06: null,
  q07: null,
  q08: null,
  q09: null,
  q10: null,
  q11: null,
  q12: null,
  q13: null,

  q14: "Sí 😊 La casa está disponible.",
  q15: null,
  q16: null,

  q17: SPECIAL_RULES.q17OnlyPayments,

  q18: null,

  q19: SPECIAL_RULES.q19Appraisal
};

// ------------------------------------------------------------
// MENSAJES AUTOMÁTICOS BÁSICOS
// ------------------------------------------------------------
const FALLBACK =
  "¡Hola! 👋 Soy el asistente de CASAS MUREI. Con gusto te doy información sobre la casa. ¿Qué te gustaría saber?";

const PROPERTY_TEXT =
  `🏠 *Casa en venta - CASAS MUREI*\n\n` +
  `💰 Precio: ${PROPERTY.price}\n` +
  `📍 Ubicación: ${PROPERTY.location}\n` +
  `🛏️ ${PROPERTY.bedrooms} recámaras\n` +
  `🚿 ${PROPERTY.bathrooms} baño\n` +
  `✨ ${PROPERTY.features.join("\n✨ ")}\n\n` +
  `💳 Forma de pago: únicamente Infonavit o contado.`;

const APPRAISAL_TEXT = SPECIAL_RULES.q19Appraisal;

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getReply(text) {
  const t = normalize(text);

  if (t.includes("avaluo") || t.includes("avaluó")) {
    return APPRAISAL_TEXT;
  }

  if (
    t.includes("precio") ||
    t.includes("cuanto cuesta") ||
    t.includes("cuánto cuesta")
  ) {
    return `El precio de la casa es ${PROPERTY.price}.`;
  }

  if (
    t.includes("ubicacion") ||
    t.includes("ubicación") ||
    t.includes("donde esta") ||
    t.includes("dónde está")
  ) {
    return `📍 La casa está ubicada en ${PROPERTY.location}.`;
  }

  if (
    t.includes("pago") ||
    t.includes("infonavit") ||
    t.includes("contado") ||
    t.includes("credito") ||
    t.includes("crédito")
  ) {
    return SPECIAL_RULES.q17OnlyPayments;
  }

  if (
    t.includes("disponible") ||
    t.includes("sigue disponible") ||
    t.includes("esta disponible") ||
    t.includes("está disponible")
  ) {
    return SPECIAL_RULES.q14AlwaysAvailable
      ? "Sí 😊 La casa está disponible."
      : FALLBACK;
  }

  if (
    t.includes("vitropiso") ||
    t.includes("protectores") ||
    t.includes("recamaras") ||
    t.includes("recámaras") ||
    t.includes("banos") ||
    t.includes("baños")
  ) {
    return (
      `La casa cuenta con ${PROPERTY.bedrooms} recámaras y ${PROPERTY.bathrooms} baño. ` +
      `También incluye ${PROPERTY.features.join(", ")}.`
    );
  }

  if (
    t.includes("casa") ||
    t.includes("informacion") ||
    t.includes("información") ||
    t.includes("fotos")
  ) {
    return PROPERTY_TEXT;
  }

  return FALLBACK;
}

// ------------------------------------------------------------
// META WEBHOOK - VERIFICACIÓN
// ------------------------------------------------------------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook de Meta verificado correctamente.");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// ------------------------------------------------------------
// META WEBHOOK - MENSAJES ENTRANTES
// ------------------------------------------------------------
app.post("/webhook", async (req, res) => {
  console.log("==========================================");
  console.log("📩 POST recibido en /webhook");
  console.log("Hora:", new Date().toISOString());
  console.log("Body recibido:");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("==========================================");

  try {
    const body = req.body;

    if (body.object !== "page") {
      console.log("⚠️ El objeto recibido no es 'page':", body.object);
      return res.sendStatus(404);
    }

    for (const entry of body.entry || []) {
      console.log("📦 Procesando entry:", entry.id || "sin id");

      for (const event of entry.messaging || []) {
        console.log("💬 Evento de Messenger recibido");

        if (!event.message) {
          console.log("ℹ️ El evento no contiene message.");
          continue;
        }

        if (event.message.is_echo) {
          console.log("↩️ Mensaje echo ignorado.");
          continue;
        }

        const senderId = event.sender?.id;
        const text = event.message?.text;

        console.log("👤 Sender ID:", senderId || "no disponible");
        console.log("📝 Texto:", text || "sin texto");

        if (!senderId || !text) {
          console.log("⚠️ Falta senderId o texto. Evento ignorado.");
          continue;
        }

        const reply = getReply(text);

        console.log("🤖 Respuesta preparada:", reply);

        await sendMessage(senderId, reply);

        console.log("✅ Respuesta enviada correctamente.");
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error procesando webhook:", error);
    return res.sendStatus(500);
  }
});
async function sendMessage(recipientId, text) {
  if (!PAGE_ACCESS_TOKEN) {
    throw new Error("Falta PAGE_ACCESS_TOKEN en las variables de entorno.");
  }

  const url =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages` +
    `?access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: { text }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Meta API ${response.status}: ${errorText}`);
  }

  return response.json();
}

app.get("/", (_req, res) => {
  res.status(200).send("CASAS MUREI webhook activo.");
});

app.listen(PORT, () => {
  console.log(`CASAS MUREI webhook escuchando en puerto ${PORT}`);
});
