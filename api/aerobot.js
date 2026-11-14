import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history = [], mode = "general" } = req.body || {};
    if (!message) return res.status(400).json({ error: "Message required" });

    let model = "gemini-2.5-flash";
    const config = {
      systemInstruction:
        "You are AeroBot for AeroFind (aerofind.me). Help passengers track lost bags, locate airport lost-and-found desks, and check airline baggage rules. Sample reference 6E1234 is at Terminal 2, Lost & Found Desk B."
    };

    if (mode === "reasoning") {
      model = "gemini-2.5-pro";
    } else if (mode === "fast") {
      model = "gemini-2.5-flash-lite";
    } else if (mode === "search") {
      config.tools = [{ googleSearch: {} }];
    } else if (mode === "maps") {
      config.tools = [{ googleMaps: {} }];
    }

    const contents = [
      ...history.slice(-12).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({ model, contents, config });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = [];
    for (const c of chunks) {
      if (c.web?.uri) sources.push({ title: c.web.title || c.web.uri, url: c.web.uri });
      if (c.maps?.uri) sources.push({ title: c.maps.title || "Open in Google Maps", url: c.maps.uri });
    }

    return res.status(200).json({
      reply: response.text || "No response generated.",
      sources,
      model
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "AI request failed" });
  }
}
