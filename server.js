// server.js
import express from "express";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = "cur_live_qWnvjrA5N5RyYFr6QSqfAgw8qiSKF6Wk6B3A1sk9";
const API_URL = `https://api.currencyapi.com/v3/latest?apikey=${API_KEY}&base_currency=USD&currencies=COP,VES`;

let tasas = null;

// Cargar últimas tasas si existen
if (fs.existsSync("tasas.json")) {
  tasas = JSON.parse(fs.readFileSync("tasas.json", "utf8"));
  console.log("✅ Tasas cargadas desde archivo local");
}

// Función para actualizar las tasas
async function actualizarTasas() {
  try {
    console.log("🌐 Consultando nuevas tasas desde CurrencyAPI...");
    const res = await fetch(API_URL);
    const data = await res.json();

    const usd_cop = data.data.COP.value;
    const usd_ves = data.data.VES.value;
    const cop_ves = usd_ves / usd_cop;

    tasas = {
      usd_cop,
      usd_ves,
      cop_ves,
      actualizacion: new Date().toLocaleString("es-CO")
    };

    fs.writeFileSync("tasas.json", JSON.stringify(tasas, null, 2));
    console.log("💾 Tasas actualizadas y guardadas localmente");
  } catch (err) {
    console.error("❌ Error actualizando tasas:", err.message);
  }
}

// Actualiza automáticamente a las 8 AM y 4 PM
setInterval(() => {
  const hora = new Date().getHours();
  if (hora === 8 || hora === 16) actualizarTasas();
}, 1000 * 60 * 10); // revisa cada 10 minutos

// Endpoint público para el frontend
app.get("/api/tasas", (req, res) => {
  if (tasas) res.json(tasas);
  else res.status(503).json({ error: "Datos no disponibles todavía" });
});

// Servir archivos estáticos (frontend)
app.use(express.static("public"));

// Iniciar servidor
app.listen(PORT, () =>
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`)
);

// Actualización inicial si no hay datos guardados
if (!tasas) actualizarTasas();
