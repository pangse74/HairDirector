import { GoogleGenAI } from "@google/genai";

const STYLES = ["포마드컷", "리프컷", "댄디컷", "리젠트컷", "쉐도우펌", "아이비리그컷", "애즈펌", "슬릭백", "투블럭컷"];

// 개발 환경인지 확인
const isDevelopment = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;

// API 키 존재 여부 확인
const hasApiKey = (): boolean => {
  const apiKey = (process as any).env?.API_KEY || (process as any).env?.GEMINI_API_KEY;
  return !!(apiKey && apiKey.trim().length > 0);
};

// 디버그 모드: API 없이 3x3 그리드 생성 (원본 이미지 복제)
const generateDebugGrid = async (base64Image: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 3x3 그리드 캔버스 생성
      const cellSize = Math.min(img.width, img.height);
      const gridSize = cellSize * 3;
      const canvas = document.createElement('canvas');
      canvas.width = gridSize;
      canvas.height = gridSize;
      const ctx = canvas.getContext('2d')!;

      // 배경 설정
      ctx.fillStyle = '#1a1a24';
      ctx.fillRect(0, 0, gridSize, gridSize);

      // 각 셀에 원본 이미지 복사 및 스타일 라벨 추가
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const x = col * cellSize;
          const y = row * cellSize;
          const styleIndex = row * 3 + col;

          // 원본 이미지를 정사각형으로 crop하여 그리기
          const srcSize = Math.min(img.width, img.height);
          const srcX = (img.width - srcSize) / 2;
          const srcY = (img.height - srcSize) / 2;

          ctx.drawImage(img, srcX, srcY, srcSize, srcSize, x, y, cellSize, cellSize);

          // 스타일 이름 라벨 추가
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(x, y + cellSize - 40, cellSize, 40);

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.floor(cellSize / 10)}px "Noto Sans KR", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(STYLES[styleIndex], x + cellSize / 2, y + cellSize - 20);

          // 셀 경계선
          ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }

      // 디버그 모드 표시
      ctx.fillStyle = 'rgba(255, 165, 0, 0.9)';
      ctx.fillRect(10, 10, 200, 30);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 14px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔧 디버그 모드 (API 미사용)', 20, 25);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = base64Image;
  });
};

// API 응답 타입 정의
interface GenerateResponse {
  success?: boolean;
  image?: string;
  mimeType?: string;
  error?: string;
}

// Cloudflare Pages Functions API 호출 (프로덕션용)
const generateViaCloudflare = async (base64Data: string, mimeType: string): Promise<string> => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64Data,
      mimeType: mimeType,
    }),
  });

  if (!response.ok) {
    const error = await response.json() as GenerateResponse;
    throw new Error(error.error || 'API 요청 실패');
  }

  const data = await response.json() as GenerateResponse;

  if (!data.success || !data.image) {
    throw new Error('이미지 생성 실패');
  }

  return `data:${data.mimeType || 'image/png'};base64,${data.image}`;
};

// 직접 Gemini API 호출 (개발용)
const generateViaDirect = async (base64Data: string, mimeType: string): Promise<string> => {
  const apiKey = (process as any).env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing. Please select one.");

  const ai = new GoogleGenAI({ apiKey });

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
};

export const generateHairstyleGrid = async (base64Image: string): Promise<string> => {
  // API 키가 없으면 디버그 모드로 동작
  if (!hasApiKey()) {
    console.log('⚠️ 디버그 모드: API 키 없음 - 3x3 그리드 미리보기 생성');
    return await generateDebugGrid(base64Image);
  }

  // Clean base64 data (remove prefix if present)
  const base64Data = base64Image.split(',')[1] || base64Image;
  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';

  try {
    // 개발 환경에서는 직접 API 호출, 프로덕션에서는 Cloudflare Functions 사용
    if (isDevelopment) {
      console.log('🔧 개발 모드: 직접 Gemini API 호출');
      return await generateViaDirect(base64Data, mimeType);
    } else {
      console.log('🚀 프로덕션 모드: Cloudflare Functions API 호출');
      return await generateViaCloudflare(base64Data, mimeType);
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// 스타일 목록 export
export { STYLES };
