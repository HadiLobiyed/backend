import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
app.use(cors());
app.use(express.json());

// Faire confiance au proxy Render
app.set("trust proxy", 1); // <-- cette ligne est essentielle

// Limiter pour éviter les 429
const limiter = rateLimit({
  windowMs: 3000, // 3 secondes
  max: 1, // 1 requête toutes les 3 secondes par IP
});
app.use("/chat", limiter);

const OPENAI_KEY = "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";

app.post("/chat", async (req, res) => {
  const { message } = req.body;
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
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Backend démarré sur le port 3000"));

