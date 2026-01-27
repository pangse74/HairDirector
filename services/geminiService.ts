
import { GoogleGenAI } from "@google/genai";

const STYLES = ["포마드컷", "리프컷", "댄디컷", "리젠트컷", "쉐도우펌", "아이비리그컷", "애즈펌", "슬릭백", "투블럭컷"];

export const generateHairstyleGrid = async (base64Image: string): Promise<string> => {
  // Use the most up-to-date API key from the environment/dialog
  const apiKey = (process as any).env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing. Please select one.");

  const ai = new GoogleGenAI({ apiKey });
  
  // Clean base64 data (remove prefix if present)
  const base64Data = base64Image.split(',')[1] || base64Image;
  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';

  const prompt = `You are an expert Korean hairstylist. This is a 3x3 grid image with 9 copies of the same Korean person's face.

CRITICAL INSTRUCTIONS:
1. DO NOT change the person's face, eyes, nose, mouth, or skin - keep them EXACTLY the same.
2. ONLY modify the HAIR in each cell.
3. Each cell should show a DIFFERENT hairstyle.
4. The output must be a single 3x3 grid image containing all 9 results.

Apply these specific Korean hairstyles to each position (from left to right, top to bottom):
- Cell 1 (1,1): ${STYLES[0]}
- Cell 2 (1,2): ${STYLES[1]}  
- Cell 3 (1,3): ${STYLES[2]}
- Cell 4 (2,1): ${STYLES[3]}
- Cell 5 (2,2): ${STYLES[4]}
- Cell 6 (2,3): ${STYLES[5]}
- Cell 7 (3,1): ${STYLES[6]}
- Cell 8 (3,2): ${STYLES[7]}
- Cell 9 (3,3): ${STYLES[8]}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("Invalid API response format");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
