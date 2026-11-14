import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { imageBase64, mimeType = "image/jpeg", reference = "" } = req.body || {};
    if (!imageBase64 || !reference) {
      return res.status(400).json({ error: "imageBase64 and reference are required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { data: imageBase64, mimeType } },
        `Inspect this luggage photo for reference ${reference}. Identify color, shell type, straps/tags, confidence (0-100), summary, and recommended next step.`
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchConfidence: { type: Type.INTEGER },
            detectedColorAndType: { type: Type.STRING },
            summary: { type: Type.STRING },
            recommendedNextStep: { type: Type.STRING }
          },
          required: ["matchConfidence", "detectedColorAndType", "summary", "recommendedNextStep"]
        }
      }
    });

    return res.status(200).json(JSON.parse(response.text));
  } catch (err) {
    return res.status(500).json({ error: err.message || "Photo analysis failed" });
  }
}
