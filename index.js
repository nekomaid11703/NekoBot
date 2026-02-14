// dependencias

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const sessions = require("./sessions");
const fs = require("fs");
const { editSessions } = require("./commands/editar_ficha");
const { handleCommand } = require("./commandHandler");

// funciones auxiliares
function extractTextFromMsg(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    ""
  );
}

// función principal para iniciar el bot
async function startBot() {
  try {
    // Configuración de autenticación con almacenamiento en archivos
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const sock = makeWASocket({
      auth: state,
      browser: ["NekoBot", "Chrome", "1.0.0"]
    });
    // Guardar credenciales cuando cambien
    sock.ev.on("creds.update", saveCreds);
    // Manejo de conexión (QR, open, close)
    sock.ev.on("connection.update", (update) => {
      // update puede contener { qr } o { connection, lastDisconnect, ... }
      if (update.qr) {
        console.log("🔑 Nuevo QR recibido. Escanéalo con WhatsApp -> Dispositivos -> Vincular un dispositivo:");
        qrcode.generate(update.qr, { small: true });
      }
      const connection = update.connection;
      const lastDisconnect = update.lastDisconnect;
      if (connection === "open") {
        console.log("🟢 Bot conectado correctamente a WhatsApp");
      }
      if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log("🔴 Conexión cerrada. Razón (statusCode):", reason);
        // Si no fue cierre por logout, intenta reconectar
        if (reason !== DisconnectReason.loggedOut) {
          console.log("↻ Intentando reconectar...");
          startBot();
        } else {
          console.log("❗ Sesión cerrada (logged out). Borra la carpeta 'auth' y vuelve a ejecutar para obtener un nuevo QR.");
        }
      }
    });

    // Manejo de mensajes entrantes
    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        // 'from' es el chat al que respondemos (grupo o privado)
        const from = msg.key.remoteJid;
        // userId es el identificador del remitente real:
        // - en grupos: msg.key.participant (ej: 5731xxxx@s.whatsapp.net)
        // - en privado: msg.key.remoteJid
        const userId = msg.key.participant || msg.key.remoteJid;
        const text = extractTextFromMsg(msg);
        if (!text) return;
        // 0) Si hay una sesión de flujo activa para ESTE USUARIO (no para el grupo)
        const session = sessions.getSession(userId);
        if (session) {
          const flowName = session.flow;
          try {
            const flowModule = require(`./commands/${flowName}.js`);
            if (flowModule && typeof flowModule.handleFlow === "function") {
              await flowModule.handleFlow(session, text, sock, msg);
              return;
            } else {
              sessions.deleteSession(userId);
            }
          } catch (e) {
            console.error("Error en flow handler:", e);
            sessions.deleteSession(userId);
          }
        }

        // 1) Si este usuario está en modo edición (editSessions key = userId), manejar primero
        const edit = editSessions.get(userId);
        if (edit) {
          if (text.toLowerCase() === "cancel") {
            editSessions.delete(userId);
            await sock.sendMessage(from, { text: "❌ Edición cancelada." });
            return;
          }

          const ficha = JSON.parse(fs.readFileSync(edit.filepath, "utf8"));

          if (edit.field.startsWith("skill")) {
            const [name, ...desc] = text.split(":");
            ficha[edit.field] = {
              name: name ? name.trim() : "",
              desc: desc.length ? desc.join(":").trim() : ""
            };
          } else if (edit.field === "stats") {
            const lines = text.split("\n");
            let error = false;

            for (const line of lines) {
              const clean = line.trim();
              if (!clean) continue;

              const match = clean.match(/^(\w+)\s*([+=-])\s*(-?\d+)$/);
              if (!match) {
                error = true;
                break;
              }

              const [, stat, op, valueRaw] = match;
              const value = Number(valueRaw);

              if (!ficha.stats.hasOwnProperty(stat)) {
                error = true;
                break;
              }

              if (op === "=") ficha.stats[stat] = value;
              if (op === "+") ficha.stats[stat] += value;
              if (op === "-") ficha.stats[stat] -= value;
            }

            if (error) {
              await sock.sendMessage(from, {
                text:
                  "❌ Error en el formato.\n\n" +
                  "Ejemplos válidos:\n" +
                  "• fuerza = 60\n" +
                  "• fulgor +200\n" +
                  "• resistencia -5"
              });
              return;
            }
          }
          else {
            ficha[edit.field] = text;
          }

          fs.writeFileSync(edit.filepath, JSON.stringify(ficha, null, 2));
          editSessions.delete(userId);

          await sock.sendMessage(from, { text: "✅ Ficha actualizada correctamente." });
          return;
        }

        // 2) Si no hay edición/flujo, procesar como comando normal
        await handleCommand(sock, msg, text.trim());
      } catch (e) {
        console.error("Error en messages.upsert:", e);
      }
    });


    // Opcional: escuchar errores no atrapados
    sock.ev.on("error", (err) => {
      console.error("Error en el socket:", err);
    });
  } catch (err) {
    console.error("Fallo al iniciar el bot:", err);
  }
}

startBot();

