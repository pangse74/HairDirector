
import React, { useState } from 'react';

interface Props {
  originalImage: string;
  resultImage: string;
  onReset: () => void;
}

const STYLES = ["포마드컷", "리프컷", "댄디컷", "리젠트컷", "쉐도우펌", "아이비리그", "애즈펌", "슬릭백", "투블럭컷"];

export const ResultView: React.FC<Props> = ({ originalImage, resultImage, onReset }) => {
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);

  // 3x3 그리드에서 특정 셀의 위치 계산 (0-8)
  const getCellPosition = (index: number) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    return {
      top: `${(row / 3) * 100}%`,
      left: `${(col / 3) * 100}%`,
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 py-4">
        <button
          onClick={onReset}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <i className="fas fa-arrow-left text-white/70"></i>
        </button>
        <h1 className="text-white font-bold text-lg">스타일 결과</h1>
        <div className="w-10"></div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 px-4 pb-6 overflow-y-auto">
        {/* 결과 이미지 */}
        <div className="bg-white/5 p-2 rounded-3xl border border-white/10 overflow-hidden mb-6">
          <img
            src={resultImage}
            alt="Generated Hairstyles 3x3 Grid"
            className="w-full h-auto rounded-2xl block"
          />
        </div>

        {/* 스타일 선택 카드 */}
        <div className="p-5 mb-4 rounded-2xl" style={{ background: 'rgba(20, 20, 30, 0.8)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <i className="fas fa-th text-violet-400"></i>
            스타일 선택하기
          </h3>
          <p className="text-gray-400 text-xs mb-4">원하는 스타일을 클릭해서 크게 보세요!</p>
          <div className="grid grid-cols-3 gap-2">
            {STYLES.map((style, i) => (
              <button
                key={i}
                onClick={() => setSelectedStyle(i)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${selectedStyle === i
                    ? 'bg-violet-600/30 border-violet-500 scale-105'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-violet-500/50'
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

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <a
            href={resultImage}
            download="hairfit-styles.png"
            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:opacity-90 transition-all"
          >
            <i className="fas fa-download"></i>
            <span>저장하기</span>
          </a>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: '헤어핏 스타일 결과',
                  text: 'AI가 추천한 나의 헤어스타일을 확인해보세요!',
                });
              }
            }}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/10 border border-white/10 text-white font-bold hover:bg-white/20 transition-all"
          >
            <i className="fas fa-share-alt"></i>
            <span>공유하기</span>
          </button>
        </div>

        {/* 다시 하기 버튼 */}
        <button
          onClick={onReset}
          className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-redo"></i>
          <span>새로운 사진으로 다시 하기</span>
        </button>

        {/* 팁 카드 */}
        <div className="mt-6 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-lightbulb text-violet-400"></i>
            </div>
            <div>
              <h4 className="text-violet-300 font-bold text-sm mb-1">💡 Tip</h4>
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
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setSelectedStyle(selectedStyle > 0 ? selectedStyle - 1 : 8)}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <i className="fas fa-chevron-left text-white"></i>
              </button>
              <button
                onClick={() => setSelectedStyle(null)}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:opacity-90 transition-all"
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
    </div>
  );
};
