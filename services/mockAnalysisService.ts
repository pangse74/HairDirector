/**
 * Mock Analysis Service
 * 무료 체험 모드에서 사용하는 가상의 분석 결과 생성 서비스
 * Gemini API 호출 없이 랜덤한 분석 결과를 반환합니다.
 */

import { FaceAnalysisResult, FaceShape, SkinTone, FaceFeature, RecommendedStyle, AvoidStyle } from '../types';

// 얼굴형 목록 및 한글명
const FACE_SHAPES: { shape: FaceShape; ko: string }[] = [
  { shape: 'oval', ko: '계란형' },
  { shape: 'round', ko: '둥근형' },
  { shape: 'square', ko: '각진형' },
  { shape: 'oblong', ko: '긴 얼굴형' },
  { shape: 'heart', ko: '하트형' },
  { shape: 'diamond', ko: '다이아몬드형' },
];

// 피부톤 목록 및 한글명
const SKIN_TONES: { tone: SkinTone; ko: string }[] = [
  { tone: 'fair', ko: '밝은 톤' },
  { tone: 'medium', ko: '중간 톤' },
  { tone: 'tan', ko: '웜 톤' },
  { tone: 'dark', ko: '어두운 톤' },
];

// 미리 정의된 얼굴 특징
const MOCK_FEATURES: FaceFeature[] = [
  { name: 'High cheekbones', nameKo: '높은 광대뼈', impact: 'positive' },
  { name: 'Defined jawline', nameKo: '뚜렷한 턱선', impact: 'positive' },
  { name: 'Balanced proportions', nameKo: '균형잡힌 비율', impact: 'positive' },
  { name: 'Soft features', nameKo: '부드러운 이목구비', impact: 'positive' },
  { name: 'Wide forehead', nameKo: '넓은 이마', impact: 'neutral' },
  { name: 'Rounded chin', nameKo: '둥근 턱', impact: 'neutral' },
  { name: 'Strong brow', nameKo: '진한 눈썹', impact: 'positive' },
  { name: 'Full cheeks', nameKo: '풍성한 볼살', impact: 'consideration' },
];

// 미리 정의된 추천 스타일 목록 (9개) - demo-grid.png 이미지 순서와 일치
const MOCK_STYLE_NAMES = [
  '포마드컷',
  '리프컷',
  '댄디컷',
  '리젠트컷',
  '쉐도우펌',
  '아이비리그컷',
  '애즈펌',
  '슬릭백',
  '투블럭컷',
];

// 추천 이유 템플릿
const RECOMMENDATION_REASONS = [
  '얼굴형과의 조화가 좋습니다',
  '피부톤을 돋보이게 합니다',
  '세련된 이미지를 연출합니다',
  '자연스러운 볼륨감을 줍니다',
  '이목구비를 강조합니다',
  '얼굴 비율을 보정합니다',
  '트렌디한 스타일입니다',
  '관리가 편한 스타일입니다',
  '다양한 연출이 가능합니다',
];

// 피해야 할 스타일
const MOCK_AVOID_STYLES: AvoidStyle[] = [
  { name: '가일컷', reason: '얼굴형에 맞지 않을 수 있습니다' },
  { name: '모히칸컷', reason: '일상적인 연출에 어려움이 있습니다' },
];

// 일반적인 스타일링 팁 (3개)
const MOCK_STYLING_TIPS = [
  '정수리 볼륨을 주어 세로 길이감을 더하면 좋습니다.',
  '앞머리를 자연스럽게 내려 이마를 살짝 가려주세요.',
  '사이드는 깔끔하게 정리하여 깔끔한 인상을 연출하세요.',
];

// 전체 인상 분석 템플릿
const MOCK_IMPRESSIONS = [
  '전체적으로 균형 잡힌 비율을 가지고 계시며, 부드러운 인상이 특징입니다. 다양한 스타일을 소화할 수 있는 좋은 조건을 갖추고 계십니다.',
  '세련되고 단정한 이미지를 가지고 계시며, 특히 눈매가 인상적입니다. 깔끔한 스타일이 잘 어울리실 것으로 분석됩니다.',
  '자연스럽고 친근한 이미지를 가지고 계십니다. 부드러운 질감의 스타일로 매력을 더욱 살릴 수 있습니다.',
];

/**
 * 랜덤 정수 생성
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 배열에서 랜덤 요소 선택
 */
function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 배열 셔플
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 가상의 얼굴 분석 결과 생성
 */
export function generateMockAnalysis(): FaceAnalysisResult {
  // 랜덤 얼굴형 선택
  const faceShapeData = randomPick(FACE_SHAPES);

  // 랜덤 피부톤 선택
  const skinToneData = randomPick(SKIN_TONES);

  // 비율 생성 (합이 100이 되도록)
  const upperRatio = randomInt(28, 38);
  const middleRatio = randomInt(30, 38);
  const lowerRatio = 100 - upperRatio - middleRatio;

  // 랜덤 특징 선택 (4-6개)
  const shuffledFeatures = shuffle(MOCK_FEATURES);
  const features = shuffledFeatures.slice(0, randomInt(4, 6));

  // 추천 스타일 생성 (9개)
  const shuffledReasons = shuffle(RECOMMENDATION_REASONS);
  const recommendations: RecommendedStyle[] = MOCK_STYLE_NAMES.map((name, index) => ({
    id: name.toLowerCase().replace(/\s/g, '-'),
    name,
    reason: shuffledReasons[index],
    score: randomInt(75, 98),
    priority: index + 1,
  }));

  // 점수로 정렬
  recommendations.sort((a, b) => b.score - a.score);
  recommendations.forEach((rec, index) => {
    rec.priority = index + 1;
  });

  return {
    faceShape: faceShapeData.shape,
    faceShapeKo: faceShapeData.ko,
    skinTone: skinToneData.tone,
    skinToneKo: skinToneData.ko,
    upperRatio,
    middleRatio,
    lowerRatio,
    features,
    recommendations,
    avoidStyles: MOCK_AVOID_STYLES,
    stylingTips: MOCK_STYLING_TIPS,
    overallImpression: randomPick(MOCK_IMPRESSIONS),
  };
}

/**
 * Mock 스타일 이름 목록 반환
 */
export function getMockStyleNames(): string[] {
  return [...MOCK_STYLE_NAMES];
}
