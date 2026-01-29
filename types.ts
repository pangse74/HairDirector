
export interface HairstyleResult {
  imageUrl: string;
  styles: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PREVIEW = 'PREVIEW',           // 사진 미리보기 확인 단계
  ANALYZING = 'ANALYZING',       // 얼굴 분석 중
  ANALYSIS_RESULT = 'ANALYSIS_RESULT', // 분석 결과 표시
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// 얼굴형 타입
export type FaceShape = 'oval' | 'round' | 'square' | 'oblong' | 'heart' | 'diamond';

// 피부톤 타입
export type SkinTone = 'fair' | 'medium' | 'tan' | 'dark';

// 얼굴 특징
export interface FaceFeature {
  name: string;           // 영문명
  nameKo: string;         // 한글명
  impact: 'positive' | 'neutral' | 'consideration'; // 영향도
}

// 추천 스타일
export interface RecommendedStyle {
  id: string;             // 스타일 ID
  name: string;           // 스타일 이름
  reason: string;         // 추천 이유
  score: number;          // 추천 점수 (0-100)
  priority: number;       // 우선순위 (1-9)
}

// 피해야 할 스타일
export interface AvoidStyle {
  name: string;           // 스타일 이름
  reason: string;         // 피해야 할 이유
}

// 얼굴 분석 결과
export interface FaceAnalysisResult {
  faceShape: FaceShape;
  faceShapeKo: string;         // 한글 얼굴형 이름
  skinTone: SkinTone;
  skinToneKo: string;          // 한글 피부톤 이름
  upperRatio: number;          // 상안부 비율
  middleRatio: number;         // 중안부 비율
  lowerRatio: number;          // 하안부 비율
  features: FaceFeature[];     // 얼굴 특징 목록
  recommendations: RecommendedStyle[];  // 추천 스타일 (최대 9개)
  avoidStyles: AvoidStyle[];   // 피해야 할 스타일
  stylingTips: string[];       // AI 맞춤형 스타일링 팁 (3개)
  overallImpression: string;   // 전체 인상 분석
}

// 히스토리 아이템 타입
export interface HistoryItem {
  id: string;
  date: string;
  originalImage: string;
  resultImage: string;
  originalThumbnail?: string;  // 리스트용 썸네일
  resultThumbnail?: string;    // 리스트용 썸네일
  faceAnalysis?: {
    faceShape: string;
    upperRatio: number;
    middleRatio: number;
    lowerRatio: number;
    features: string[];
  };
  fullAnalysisResult?: FaceAnalysisResult;  // 전체 분석 결과 (리포트 보기용)
  recommendedStyles: string[];
  liked: boolean;
}

// 저장된 스타일 타입
export interface SavedStyle {
  id: string;
  savedDate: string;
  type: 'simulation' | 'video' | 'blueprint';
  category: StyleCategory;
  title: string;
  thumbnail: string;
  sourceUrl?: string;
  videoId?: string;
  notes?: string;
  isPro?: boolean;
}

// 스타일 카테고리
export type StyleCategory = 'cut' | 'perm' | 'color' | 'all';

// 카테고리 라벨
export const categoryLabels: Record<StyleCategory, string> = {
  cut: '컷트',
  perm: '펌',
  color: '염색',
  all: '전체'
};
