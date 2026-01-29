
import React, { useState, useEffect, useRef } from 'react';
import { saveStyle, getSavedStyles } from '../services/storageService';

interface Props {
  originalImage: string;
  resultImage: string;
  onReset: () => void;
  onStyleClick: (styleId: string) => void;
  styles?: string[];
}

const DEFAULT_STYLES = ["포마드컷", "리프컷", "댄디컷", "리젠트컷", "쉐도우펌", "아이비리그", "애즈펌", "슬릭백", "투블럭컷"];

// 스타일 이름 → ID 매핑 (분석 API의 모든 스타일 포함)
const STYLE_ID_MAP: Record<string, string> = {
  // 기본 스타일
  "포마드컷": "pomade",
  "포마드": "pomade",
  "리프컷": "leaf",
  "댄디컷": "dandy",
  "리젠트컷": "regent",
  "리젠트": "regent",
  "쉐도우펌": "shadow",
  "아이비리그컷": "ivy",
  "아이비리그": "ivy",
  "애즈펌": "ez",
  "슬릭백": "slick",
  "투블럭컷": "twoblock",
  "투블럭": "twoblock",
  // 확장 스타일
  "가르마펌": "comma",
  "가르마": "comma",
  "레이어드컷": "layered",
  "레이어드": "layered",
  "크롭컷": "crop",
  "크롭": "crop",
  "텍스쳐드펌": "textured",
  "텍스쳐드": "textured",
  "모히칸컷": "mohican",
  "모히칸": "mohican",
  "언더컷": "undercut",
  // 추가 인기 스타일
  "가일컷": "guile",
  "울프컷": "wolf",
  "히피펌": "hippie",
  "빌드펌": "build",
  "스왈로펌": "swallow",
};

export const ResultView: React.FC<Props> = ({ originalImage, resultImage, onReset, onStyleClick, styles }) => {
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);
  const [savedStyles, setSavedStyles] = useState<Set<number>>(new Set());
  const [showSaveToast, setShowSaveToast] = useState(false);
  const hasAutoDownloaded = useRef(false);

  // 동적 스타일 사용 (prop이 없으면 기본값)
  const STYLES = styles && styles.length === 9 ? styles : DEFAULT_STYLES;

  // 3x3 그리드에서 특정 셀을 크롭하는 함수
  const cropCellFromGrid = (imageBase64: string, cellIndex: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const row = Math.floor(cellIndex / 3);
        const col = cellIndex % 3;
        const cellWidth = img.width / 3;
        const cellHeight = img.height / 3;

        canvas.width = cellWidth;
        canvas.height = cellHeight;

        ctx.drawImage(
          img,
          col * cellWidth,
          row * cellHeight,
          cellWidth,
          cellHeight,
          0,
          0,
          cellWidth,
          cellHeight
        );

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => {
        resolve(imageBase64);
      };
      img.src = imageBase64;
    });
  };

  // 저장된 스타일 체크
  useEffect(() => {
    const saved = getSavedStyles();
    const savedIndexes = new Set<number>();
    saved.forEach(s => {
      if (s.title && STYLES.includes(s.title)) {
        savedIndexes.add(STYLES.indexOf(s.title));
      }
    });
    setSavedStyles(savedIndexes);
  }, [STYLES]);

  // 스타일 저장 핸들러
  const handleSaveStyle = async (index: number) => {
    const styleName = STYLES[index];
    const croppedImage = await cropCellFromGrid(resultImage, index);

    saveStyle({
      type: 'simulation',
      category: 'cut',
      title: styleName,
      thumbnail: croppedImage,
      notes: `AI 추천 스타일 #${index + 1}`,
    });

    setSavedStyles(prev => new Set([...prev, index]));
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  // 이미지 다운로드 핸들러
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `헤어디렉터_AI추천스타일_${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <button
          onClick={onReset}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <i className="fas fa-arrow-left text-white/70"></i>
        </button>
        <h1 className="text-white font-bold text-lg">AI 추천 스타일</h1>
        <div className="w-10"></div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 px-4 pb-6 overflow-y-auto">
        {/* 3x3 결과 그리드 + 텍스트 오버레이 */}
        <div className="mt-4 mb-6">
          <div className="relative rounded-3xl overflow-hidden border-2 border-violet-500/30 shadow-2xl shadow-violet-500/20">
            <img
              src={resultImage}
              alt="AI 추천 헤어스타일 3x3 그리드"
              className="w-full h-auto block"
            />
            {/* 3x3 텍스트 오버레이 그리드 */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {STYLES.map((style, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedStyle(index);
                    onStyleClick(STYLE_ID_MAP[style] || 'default');
                  }}
                  className="relative flex items-end justify-center hover:bg-white/10 transition-all"
                >
                  {/* 하단 그라데이션 레이어 */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                  {/* 텍스트 (박스 없음) */}
                  <span
                    className="mb-2 text-sm font-bold text-white tracking-wide"
                    style={{
                      textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,1)'
                    }}
                  >
                    {index + 1}. {style}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 추천된 스타일 목록 */}
        <div className="mb-6">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-scissors text-violet-400"></i>
            추천된 스타일
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {STYLES.map((style, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedStyle(i);
                  onStyleClick(STYLE_ID_MAP[style] || 'default');
                }}
                className={`p-3 rounded-xl border text-center transition-all ${selectedStyle === i
                    ? 'bg-violet-600/30 border-violet-500'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
              >
                <span className={`block font-bold text-sm mb-1 ${selectedStyle === i ? 'text-violet-300' : 'text-violet-400'}`}>
                  {i + 1}
                </span>
                <span className={`text-xs ${selectedStyle === i ? 'text-white' : 'text-gray-300'}`}>
                  {style}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 다운로드 버튼 */}
        <button
          onClick={handleDownload}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-violet-500/30 mb-4"
        >
          <i className="fas fa-download"></i>
          이미지 다운로드
        </button>

        {/* 다시 하기 버튼 */}
        <button
          onClick={onReset}
          className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-camera"></i>
          새로운 사진으로 다시 하기
        </button>

        {/* 팁 카드 */}
        <div className="mt-6 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-lightbulb text-violet-400"></i>
            </div>
            <div>
              <h4 className="text-violet-300 font-bold text-sm mb-1">Tip</h4>
              <p className="text-violet-200/70 text-xs leading-relaxed">
                미용실에서 원하는 스타일 번호를 디자이너에게 보여주세요. 더 정확한 시술이 가능합니다!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 스타일 상세 모달 */}
      {selectedStyle !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          onClick={() => setSelectedStyle(null)}
        >
          <div
            className="relative w-full max-w-lg animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setSelectedStyle(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all z-10"
            >
              <i className="fas fa-times text-white"></i>
            </button>

            {/* 스타일 이름 */}
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600/30 border border-violet-500/50">
                <span className="text-violet-300 font-bold">{selectedStyle + 1}</span>
                <span className="text-white font-bold">{STYLES[selectedStyle]}</span>
              </span>
            </div>

            {/* 이미지 크롭 뷰 */}
            <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-white/5 border border-white/10">
              <div
                className="absolute w-[300%] h-[300%]"
                style={{
                  top: `-${Math.floor(selectedStyle / 3) * 100}%`,
                  left: `-${(selectedStyle % 3) * 100}%`,
                }}
              >
                <img
                  src={resultImage}
                  alt={STYLES[selectedStyle]}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* 하단 액션 */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setSelectedStyle(selectedStyle > 0 ? selectedStyle - 1 : 8)}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <i className="fas fa-chevron-left text-white"></i>
              </button>

              {/* 저장 버튼 */}
              <button
                onClick={() => handleSaveStyle(selectedStyle)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${savedStyles.has(selectedStyle)
                    ? 'bg-pink-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-pink-500/30 hover:text-pink-400'
                  }`}
              >
                <i className={`fas fa-heart ${savedStyles.has(selectedStyle) ? 'animate-pulse' : ''}`}></i>
              </button>

              <button
                onClick={() => setSelectedStyle(null)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:opacity-90 transition-all"
              >
                확인
              </button>

              <button
                onClick={() => setSelectedStyle(selectedStyle < 8 ? selectedStyle + 1 : 0)}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <i className="fas fa-chevron-right text-white"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 저장 완료 토스트 */}
      {showSaveToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="px-6 py-3 rounded-full bg-pink-500 text-white font-bold shadow-lg shadow-pink-500/30 flex items-center gap-2">
            <i className="fas fa-heart"></i>
            <span>저장됨!</span>
          </div>
        </div>
      )}
    </div>
  );
};
