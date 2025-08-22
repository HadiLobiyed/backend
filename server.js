// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
app.use(cors());
app.use(express.json());

// Limiter pour éviter les 429
const limiter = rateLimit({
  windowMs: 3000, // 3 secondes
  max: 1, // 1 requête toutes les 3 secondes par IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/chat", limiter);

// Utilisation de la clé via variable d'environnement
// Sur Render : Settings -> Environment -> Ajouter OPENAI_KEY
const OPENAI_KEY = process.env.OPENAI_KEY;

// Route racine pour test
app.get("/", (req, res) => {
  res.send("Backend Ecogrow OK !");
});

// Route /chat pour recevoir les messages depuis Flutter
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: "Message manquant" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // ou "gpt-4o-mini"
        messages: [{ role: "user", content: message }],
        max_tokens: 200,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend démarré sur le port ${PORT}`));
