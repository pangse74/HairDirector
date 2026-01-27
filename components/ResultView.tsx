
import React, { useState, useEffect, useRef } from 'react';
import { saveStyle, getSavedStyles } from '../services/storageService';

interface Props {
  originalImage: string;
  resultImage: string;
  onReset: () => void;
  onStyleClick: (styleId: string) => void;
}

const STYLES = ["포마드컷", "리프컷", "댄디컷", "리젠트컷", "쉐도우펌", "아이비리그", "애즈펌", "슬릭백", "투블럭컷"];

const STYLE_ID_MAP: Record<string, string> = {
  "포마드컷": "guile", // 포마드/가일 유사
  "리프컷": "leaf",
  "댄디컷": "dandy",
  "리젠트컷": "regent",
  "쉐도우펌": "perm",
  "아이비리그": "ivy",
  "애즈펌": "parting",
  "슬릭백": "slick",
  "투블럭컷": "twoblock"
};

export const ResultView: React.FC<Props> = ({ originalImage, resultImage, onReset, onStyleClick }) => {
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);
  const [savedStyles, setSavedStyles] = useState<Set<number>>(new Set());
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const hasAutoDownloaded = useRef(false);

  // ... (keep lines 20-192: utils and rendering up to grid start)
  // Since I cannot include 170 lines in replacement content easily without rewriting them,
  // I will target the two separate blocks if possible, OR I will just fix the top block first, 
  // then fix the bottom block in a second step, or rely on precise context matching.

  // Let's fix the top block (lines 27-31) first.

  // Actually, I can use the previous error context to just fix the top part.

  // Wait, I also need to update the grid buttons. The grid buttons are further down.
  // I will make this tool call fix BOTH by using a larger range if possible, or just fix the top error first to be safe.

  // Let's fix the top error first.


  // Base64를 Blob으로 변환하는 유틸리티 함수
  const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1] || 'image/png';
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  };

  // 자동 다운로드 함수
  const autoDownloadResult = () => {
    if (hasAutoDownloaded.current || !resultImage) return;
    hasAutoDownloaded.current = true;

    try {
      const fileName = `헤어핏_AI분석결과_${new Date().toISOString().split('T')[0]}_${Date.now()}.png`;

      // a 태그를 사용한 다운로드 (저장하기 버튼과 동일한 방식)
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
      }, 200);

      setAutoSaved(true);
      // 5초 후 토스트 숨기기
      setTimeout(() => setAutoSaved(false), 5000);
      console.log('✅ 결과 이미지 자동 저장 완료');
    } catch (error) {
      console.error('자동 저장 실패:', error);
    }
  };

  // 결과 이미지가 로드되면 자동으로 다운로드
  useEffect(() => {
    if (resultImage && !hasAutoDownloaded.current) {
      // 약간의 딜레이 후 다운로드 (UI가 먼저 표시되도록)
      const timer = setTimeout(() => {
        autoDownloadResult();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resultImage]);

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
  }, []);

  // 3x3 그리드에서 특정 셀을 크롭하는 함수
  const cropCellFromGrid = (imageBase64: string, cellIndex: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // 3x3 그리드에서 셀 위치 계산
        const row = Math.floor(cellIndex / 3);
        const col = cellIndex % 3;
        const cellWidth = img.width / 3;
        const cellHeight = img.height / 3;

        // 셀 크기로 캔버스 설정
        canvas.width = cellWidth;
        canvas.height = cellHeight;

        // 해당 셀만 그리기
        ctx.drawImage(
          img,
          col * cellWidth,    // 소스 x
          row * cellHeight,   // 소스 y
          cellWidth,          // 소스 너비
          cellHeight,         // 소스 높이
          0,                  // 대상 x
          0,                  // 대상 y
          cellWidth,          // 대상 너비
          cellHeight          // 대상 높이
        );

        // JPEG 80% 품질로 저장
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => {
        resolve(imageBase64); // 오류 시 원본 반환
      };
      img.src = imageBase64;
    });
  };

  // 스타일 저장 핸들러
  const handleSaveStyle = async (index: number) => {
    const styleName = STYLES[index];

    // 선택된 셀만 크롭
    const croppedImage = await cropCellFromGrid(resultImage, index);

    saveStyle({
      type: 'simulation',
      category: 'cut',
      title: styleName,
      thumbnail: croppedImage, // 크롭된 이미지를 썸네일로 사용
      notes: `AI 추천 스타일 #${index + 1}`,
    });

    // 저장 상태 업데이트
    setSavedStyles(prev => new Set([...prev, index]));

    // 토스트 표시
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };


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
    <div className="w-full h-full flex flex-col">
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
                onClick={() => {
                  setSelectedStyle(i);
                  onStyleClick(STYLE_ID_MAP[style] || 'default');
                }}
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
            <span>저장됨! 💕</span>
          </div>
        </div>
      )}

      {/* 자동 저장 완료 토스트 */}
      {autoSaved && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg shadow-green-500/30 flex items-center gap-2">
            <i className="fas fa-check-circle"></i>
            <span>결과 이미지가 기기에 자동 저장되었습니다! 📥</span>
          </div>
        </div>
      )}
    </div>
  );
};
