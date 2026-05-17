import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Route - Gemini
  app.post("/api/gemini", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      
      // If Groq is preferred or Gemini fails, we could fallback, 
      // but for now let's just use Gemini as primary and add a Groq endpoint.
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { systemInstruction }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Error Details:", JSON.stringify(error, null, 2));
      res.status(500).json({ error: error.message || "Gemini API Error" });
    }
  });

  // AI Route - Groq (Optional)
  app.post("/api/groq", async (req, res) => {
    if (!groq) {
      return res.status(503).json({ error: "Groq not configured" });
    }
    try {
      const { messages, systemInstruction } = req.body;
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          ...messages
        ],
        model: "llama3-8b-8192",
      });
      res.json({ text: completion.choices[0]?.message?.content });
    } catch (error: any) {
      console.error("Groq Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for OpenStreetMap Nominatim
  app.get("/api/search", async (req, res) => {
    const { q } = req.query;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q as string)}&addressdetails=1`, {
        headers: { 'User-Agent': 'MapsApp/1.0' }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Weather API Proxy
  app.get("/api/weather", async (req, res) => {
    const { lat, lon } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: "Weather API key not configured" });
    }
    try {
      const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Weather Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Thunderforest Proxy
  app.get("/api/tiles/transport/:z/:x/:y", async (req, res) => {
    const { z, x, y } = req.params;
    const apiKey = process.env.THUNDERFOREST_API_KEY;
    if (!apiKey) {
      return res.redirect(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`);
    }
    const url = `https://tile.thunderforest.com/transport-dark/${z}/${x}/${y}.png?apikey=${apiKey}`;
    try {
      const response = await fetch(url);
      const blob = await response.arrayBuffer();
      res.setHeader("Content-Type", "image/png");
      res.send(Buffer.from(blob));
    } catch (error) {
      res.status(500).send("Tile fetch failed");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
