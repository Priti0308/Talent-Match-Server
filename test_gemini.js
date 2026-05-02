const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

async function test() {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: "Hello" }] }],
    });
    console.log(result.text);
  } catch (error) {
    console.error("ERROR:", error.message);
  }
}

test();
