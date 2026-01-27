
import React from 'react';

interface Props {
  originalImage: string;
  resultImage: string;
  onReset: () => void;
}

export const ResultView: React.FC<Props> = ({ originalImage, resultImage, onReset }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">생성된 스타일 가이드</h2>
        <button 
          onClick={onReset}
          className="px-6 py-2 border border-slate-200 bg-white rounded-full text-slate-600 hover:bg-slate-50 transition-colors font-medium flex items-center gap-2"
        >
          <i className="fas fa-redo"></i>
          다시 하기
        </button>
      </div>

      <div className="bg-white p-2 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden ring-4 ring-indigo-50">
        <img 
          src={resultImage} 
          alt="Generated Hairstyles 3x3 Grid" 
          className="w-full h-auto rounded-2xl block"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i className="fas fa-info-circle text-indigo-500"></i>
            스타일 구성 정보
          </h3>
          <ul className="grid grid-cols-3 gap-2 text-xs text-slate-600">
            {["포마드컷", "리프컷", "댄디컷", "리젠트컷", "쉐도우펌", "아이비리그컷", "애즈펌", "슬릭백", "투블럭컷"].map((s, i) => (
              <li key={i} className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                <span className="block font-bold text-indigo-600 mb-0.5">{i+1}</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-indigo-600 p-6 rounded-2xl text-white flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-2">이미지를 저장하세요!</h3>
            <p className="text-indigo-100 text-sm opacity-90">
              미용실에서 디자이너에게 원하는 스타일을 보여줄 때 유용합니다.
            </p>
          </div>
          <a 
            href={resultImage} 
            download="ai-hairstyle-3x3.png"
            className="mt-4 bg-white text-indigo-600 py-3 rounded-xl font-bold text-center hover:bg-indigo-50 transition-colors"
          >
            <i className="fas fa-download mr-2"></i> 이미지 다운로드
          </a>
        </div>
      </div>
    </div>
  );
};
