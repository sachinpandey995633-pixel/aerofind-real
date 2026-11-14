import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const expireTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        liveConnectConstraints: {
          model: "gemini-2.5-flash-native-audio-preview-12-2025",
          config: {
            responseModalities: ["AUDIO"],
            systemInstruction:
              "You are AeroFind Voice Concierge. Help passengers concisely with lost luggage, PNR tracking, and airport lost-and-found desks."
          }
        },
        httpOptions: { apiVersion: "v1alpha" }
      }
    });
    return res.status(200).json({ token: token.name });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Token creation failed" });
  }
}
