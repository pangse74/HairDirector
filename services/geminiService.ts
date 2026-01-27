const STYLES = ["포마드컷", "리프컷", "댄디컷", "리젠트컷", "쉐도우펌", "아이비리그컷", "애즈펌", "슬릭백", "투블럭컷"];

// API 응답 타입 정의
interface GenerateResponse {
  success?: boolean;
  image?: string;
  mimeType?: string;
  error?: string;
}

// Cloudflare Pages Functions API 호출 (프로덕션/개발 공용)
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
    let errorMsg = 'API 요청 실패';
    try {
      const error = await response.json() as GenerateResponse;
      errorMsg = error.error || errorMsg;
    } catch (e) {
      // JSON 파싱 실패 시 텍스트로 읽기 시도
      try {
        const text = await response.text();
        if (text) errorMsg = text;
      } catch (inner) {
        // 무시
      }
    }
    throw new Error(errorMsg);
  }

  const data = await response.json() as GenerateResponse;

  if (!data.success || !data.image) {
    throw new Error('이미지 생성 실패');
  }

  return `data:${data.mimeType || 'image/png'};base64,${data.image}`;
};

export const generateHairstyleGrid = async (base64Image: string): Promise<string> => {
  // Clean base64 data (remove prefix if present)
  const base64Data = base64Image.split(',')[1] || base64Image;
  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';

  try {
    console.log('🚀 API 호출: Cloudflare Functions (/api/generate)');
    return await generateViaCloudflare(base64Data, mimeType);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// 스타일 목록 export
export { STYLES };
