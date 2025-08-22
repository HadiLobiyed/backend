import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
app.use(cors());
app.use(express.json());

// ⚡️ Trust proxy pour express-rate-limit derrière un proxy (comme Render)
app.set('trust proxy', 1);

// Rate limiter : 1 requête toutes les 3 secondes par IP
const limiter = rateLimit({
  windowMs: 3000, // 3 secondes
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/chat", limiter);

// Récupère la clé OpenAI depuis les variables d'environnement
const OPENAI_KEY = process.env.OPENAI_KEY?.trim(); // on retire espaces ou retours à la ligne

if (!OPENAI_KEY) {
  console.error("❌ Veuillez définir la variable d'environnement OPENAI_KEY !");
  process.exit(1);
}
console.log("OPENAI_KEY:", OPENAI_KEY ? "OK" : "NON DEFINI");

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message invalide" });
  }

  try {
    console.log("Message reçu:", message);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    console.log("Réponse OpenAI:", data);

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: err.message });
  }
});

// Render fournit le port via process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend démarré sur le port ${PORT}`));
