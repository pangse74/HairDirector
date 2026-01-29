import { FaceAnalysisResult } from '../types';

const STYLES = ["포마드컷", "리프컷", "댄디컷", "리젠트컷", "쉐도우펌", "아이비리그컷", "애즈펌", "슬릭백", "투블럭컷"];

// API 응답 타입 정의
interface GenerateResponse {
  success?: boolean;
  image?: string;
  mimeType?: string;
  error?: string;
}

interface AnalyzeResponse {
  success?: boolean;
  analysis?: FaceAnalysisResult;
  error?: string;
  message?: string;
  retryAfter?: number;
}

// Cloudflare Pages Functions API 호출 (프로덕션/개발 공용)
const generateViaCloudflare = async (base64Data: string, mimeType: string, styles?: string[]): Promise<string> => {
  // 타임아웃 90초 설정 (고품질 이미지 생성 대기)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Data,
        mimeType: mimeType,
        styles: styles,  // 동적 스타일 전달
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = 'API 요청 실패';
      try {
        const error = await response.json() as GenerateResponse & { message?: string; retryAfter?: number };
        // 429 Rate Limit 에러 처리
        if (response.status === 429 || error.error === 'RATE_LIMIT_EXCEEDED') {
          const retryAfter = error.retryAfter || 60;
          throw new Error(`⏳ API 요청 한도 초과\n\n무료 티어 한도에 도달했습니다.\n${retryAfter}초 후에 다시 시도해주세요.\n\n💡 Tip: Google AI Studio에서 유료 플랜으로 업그레이드하면 더 많은 요청이 가능합니다.`);
        }
        errorMsg = error.error || errorMsg;
      } catch (e) {
        if (e instanceof Error && e.message.includes('API 요청 한도')) {
          throw e;
        }
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
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('시간 초과: 이미지 생성이 너무 오래 걸립니다 (90초). 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.');
    }
    throw error;
  }
};

// 얼굴 분석 API 호출
export const analyzeFace = async (base64Image: string): Promise<FaceAnalysisResult> => {
  // Clean base64 data (remove prefix if present)
  const base64Data = base64Image.split(',')[1] || base64Image;
  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';

  console.log('🔍 API 호출: Cloudflare Functions (/api/analyze)');

  const response = await fetch('/api/analyze', {
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
    let errorMsg = '얼굴 분석 실패';
    try {
      const error = await response.json() as AnalyzeResponse;
      // 429 Rate Limit 에러 처리
      if (response.status === 429 || error.error === 'RATE_LIMIT_EXCEEDED') {
        const retryAfter = error.retryAfter || 60;
        throw new Error(`⏳ API 요청 한도 초과\n\n무료 티어 한도에 도달했습니다.\n${retryAfter}초 후에 다시 시도해주세요.\n\n💡 Tip: Google AI Studio에서 유료 플랜으로 업그레이드하면 더 많은 요청이 가능합니다.`);
      }
      errorMsg = error.message || error.error || errorMsg;
    } catch (e) {
      if (e instanceof Error && e.message.includes('API 요청 한도')) {
        throw e;
      }
      try {
        const text = await response.text();
        if (text) errorMsg = text;
      } catch (inner) {
        // 무시
      }
    }
    throw new Error(errorMsg);
  }

  const data = await response.json() as AnalyzeResponse;

  if (!data.success || !data.analysis) {
    throw new Error('얼굴 분석 결과를 받지 못했습니다');
  }

  console.log('✅ 얼굴 분석 완료:', data.analysis);
  return data.analysis;
};

export const generateHairstyleGrid = async (base64Image: string, styles?: string[]): Promise<string> => {
  // Clean base64 data (remove prefix if present)
  const base64Data = base64Image.split(',')[1] || base64Image;
  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';

  // 스타일 배열이 없거나 비어있으면 기본값 사용
  const finalStyles = (styles && styles.length > 0) ? styles : STYLES;

  try {
    console.log('🚀 API 호출: Cloudflare Functions (/api/generate)');
    console.log('📋 적용할 스타일 (', finalStyles.length, '개):', finalStyles);
    return await generateViaCloudflare(base64Data, mimeType, finalStyles);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// 스타일 목록 export
export { STYLES };
