
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultView } from './components/ResultView';
import { LoadingOverlay } from './components/LoadingOverlay';
import { generateHairstyleGrid } from './services/geminiService';
import { AppState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenKeyDialog = async () => {
    try {
      await (window as any).aistudio?.openSelectKey();
    } catch (err) {
      console.error("Failed to open key dialog", err);
    }
  };

  const handleImageUpload = useCallback(async (base64Image: string) => {
    setOriginalImage(base64Image);
    setErrorMessage(null);

    // Check for API Key first - mandatory for gemini-3-pro-image-preview
    const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
    if (!hasKey) {
      await handleOpenKeyDialog();
      // Proceeding directly after triggering as per instructions
    }

    setState(AppState.GENERATING);

    try {
      const result = await generateHairstyleGrid(base64Image);
      setResultImage(result);
      setState(AppState.COMPLETED);
    } catch (error: any) {
      console.error("Generation failed:", error);
      const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
      
      // Specifically target 403/PERMISSION_DENIED for high-tier preview models
      if (errorStr.includes("Requested entity was not found") || errorStr.includes("PERMISSION_DENIED") || errorStr.includes("403")) {
        setErrorMessage("이 기능(gemini-3-pro-image-preview)을 사용하려면 '유료 결제'가 활성화된 구글 클라우드 프로젝트의 API 키가 필요합니다. 결제 수단이 등록된 프로젝트의 키를 선택해 주세요.");
        await handleOpenKeyDialog();
      } else {
        setErrorMessage(error.message || "이미지 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
      setState(AppState.ERROR);
    }
  }, []);

  const handleReset = () => {
    setState(AppState.IDLE);
    setOriginalImage(null);
    setResultImage(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header onSelectKey={handleOpenKeyDialog} />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {state === AppState.IDLE || state === AppState.ERROR ? (
          <div className="space-y-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">당신에게 어울리는 스타일은?</h2>
              <p className="text-slate-600">얼굴 사진 한 장으로 9가지 인기 헤어스타일을 3x3 그리드로 확인하세요.</p>
            </div>
            
            <ImageUploader onUpload={handleImageUpload} />
            
            {state === AppState.ERROR && (
              <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex flex-col gap-3 shadow-sm animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3 font-bold">
                  <i className="fas fa-exclamation-triangle text-xl"></i>
                  <span>서비스 권한 오류 (403)</span>
                </div>
                <p className="text-sm opacity-90 leading-relaxed">{errorMessage}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button 
                    onClick={handleOpenKeyDialog}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-md active:scale-95"
                  >
                    <i className="fas fa-key mr-2"></i> API 키 변경하기
                  </button>
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all shadow-sm"
                  >
                    <i className="fas fa-external-link-alt mr-2"></i> 결제 등록 가이드
                  </a>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <FeatureCard icon="fa-wand-magic-sparkles" title="AI 정밀 분석" desc="얼굴형과 특징을 유지하며 자연스럽게 헤어를 합성합니다." />
              <FeatureCard icon="fa-th" title="3x3 비교" desc="9가지 스타일을 한눈에 비교하여 최적의 선택을 돕습니다." />
              <FeatureCard icon="fa-image" title="1K 고해상도" desc="디테일이 살아있는 고품질 결과물을 제공합니다." />
            </div>
          </div>
        ) : null}

        {state === AppState.COMPLETED && resultImage && (
          <ResultView 
            originalImage={originalImage!} 
            resultImage={resultImage} 
            onReset={handleReset} 
          />
        )}
      </main>

      {state === AppState.GENERATING && <LoadingOverlay />}

      <footer className="py-6 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        &copy; 2024 AI Hairstyle Grid. Powered by Gemini 3 Pro Vision.
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 text-xl">
      <i className={`fas ${icon}`}></i>
    </div>
    <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default App;
