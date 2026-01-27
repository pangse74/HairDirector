
export interface HairstyleResult {
  imageUrl: string;
  styles: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PREVIEW = 'PREVIEW',       // 사진 미리보기 확인 단계
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// 히스토리 아이템 타입
export interface HistoryItem {
  id: string;
  date: string;
  originalImage: string;
  resultImage: string;
  faceAnalysis?: {
    faceShape: string;
    upperRatio: number;
    middleRatio: number;
    lowerRatio: number;
    features: string[];
  };
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
