// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiter : 1 requête toutes les 3 secondes par IP
const limiter = rateLimit({
  windowMs: 3000, // 3 secondes
  max: 1, 
  standardHeaders: true, 
  legacyHeaders: false,
});
app.use("/chat", limiter);

// Récupère la clé OpenAI depuis les variables d'environnement
const OPENAI_KEY = process.env.OPENAI_KEY;

if (!OPENAI_KEY) {
  console.error("❌ Veuillez définir la variable d'environnement OPENAI_KEY !");
  process.exit(1);
}
console.log("OPENAI_KEY:", OPENAI_KEY ? "OK" : "NON DEFINI");

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Le message est requis." });
  }

  try {
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

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Render fournit le port via process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend démarré sur le port ${PORT}`));

