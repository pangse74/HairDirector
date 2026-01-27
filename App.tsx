
import React, { useState, useCallback } from 'react';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ResultView } from './components/ResultView';
import { generateHairstyleGrid } from './services/geminiService';
import { AppState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'saved'>('home');

  const handleOpenKeyDialog = async () => {
    try {
      await (window as any).aistudio?.openSelectKey();
    } catch (err) {
      console.error("Failed to open key dialog", err);
    }
  };

  const handleScanClick = useCallback(async () => {
    // 파일 선택 다이얼로그 열기
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        setOriginalImage(base64Image);
        setErrorMessage(null);

        // API 키 확인
        const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
        if (!hasKey) {
          await handleOpenKeyDialog();
        }

        setState(AppState.GENERATING);

        try {
          const result = await generateHairstyleGrid(base64Image);
          setResultImage(result);
          setState(AppState.COMPLETED);
        } catch (error: any) {
          console.error("Generation failed:", error);
          const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
          
          if (errorStr.includes("Requested entity was not found") || errorStr.includes("PERMISSION_DENIED") || errorStr.includes("403")) {
            setErrorMessage("이 기능을 사용하려면 유료 결제가 활성화된 API 키가 필요합니다.");
            await handleOpenKeyDialog();
          } else {
            setErrorMessage(error.message || "이미지 생성 중 오류가 발생했습니다.");
          }
          setState(AppState.ERROR);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, []);

  const handleReset = () => {
    setState(AppState.IDLE);
    setOriginalImage(null);
    setResultImage(null);
    setErrorMessage(null);
  };

  // 결과 화면
  if (state === AppState.COMPLETED && resultImage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
        <ResultView 
          originalImage={originalImage!} 
          resultImage={resultImage} 
          onReset={handleReset} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#12121a] flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <i className="fas fa-robot text-white text-sm"></i>
          </div>
          <span className="text-white font-bold text-lg">헤어핏</span>
        </div>
        <button 
          onClick={handleOpenKeyDialog}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <i className="fas fa-user text-white/70"></i>
        </button>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col items-center px-5 pb-24 overflow-y-auto">
        {/* AI 기반 배지 */}
        <div className="fade-in-up mt-6 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-sm text-gray-400">AI 기반 V2.0</span>
          </div>
        </div>

        {/* 메인 타이틀 */}
        <div className="text-center mb-8 fade-in-up-delay-1">
          <h1 className="text-4xl font-black text-white mb-2 leading-tight">
            3초 만에
          </h1>
          <h1 className="text-4xl font-black text-white leading-tight">
            인생 헤어 찾기
          </h1>
          <p className="text-gray-400 mt-4 text-sm">
            AI 얼굴형 분석 및 가상 헤어 체험
          </p>
        </div>

        {/* 스캔 버튼 */}
        <div className="fade-in-up-delay-2 my-8">
          <button
            onClick={handleScanClick}
            className="relative w-44 h-44 rounded-full glow-button pulse-animation flex flex-col items-center justify-center gap-3 cursor-pointer"
          >
            <i className="fas fa-camera text-white text-4xl"></i>
            <span className="text-white font-bold text-lg">스캔 시작</span>
          </button>
        </div>

        {/* 100% 개인정보 보호 */}
        <div className="fade-in-up-delay-2 flex items-center gap-2 text-gray-400 text-sm mb-8">
          <i className="fas fa-shield-alt text-green-400"></i>
          <span>100% 개인정보 보호. 광고 없음</span>
        </div>

        {/* 에러 메시지 */}
        {state === AppState.ERROR && errorMessage && (
          <div className="w-full max-w-md p-4 mb-6 rounded-2xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-3 text-red-400 mb-2">
              <i className="fas fa-exclamation-circle"></i>
              <span className="font-bold">오류 발생</span>
            </div>
            <p className="text-red-300 text-sm">{errorMessage}</p>
            <button 
              onClick={handleOpenKeyDialog}
              className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-300 text-sm font-medium transition-all"
            >
              <i className="fas fa-key mr-2"></i>API 키 변경
            </button>
          </div>
        )}

        {/* 기능 카드 */}
        <div className="w-full max-w-md fade-in-up-delay-3">
          <div className="glass-card-dark p-4">
            <div className="flex items-center justify-around">
              <FeatureItem icon="fa-upload" label="업로드" />
              <div className="w-16 h-0.5 bg-gradient-to-r from-violet-500/0 via-violet-500/50 to-violet-500/0"></div>
              <FeatureItem icon="fa-face-smile" label="AI 분석" />
              <div className="w-16 h-0.5 bg-gradient-to-r from-violet-500/0 via-violet-500/50 to-violet-500/0"></div>
              <FeatureItem icon="fa-scissors" label="스타일 추천" />
            </div>
          </div>
        </div>

        {/* 인기 스타일 섹션 */}
        <div className="w-full max-w-md mt-8 fade-in-up-delay-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-white font-bold text-lg">인기 스타일</h2>
              <span className="badge-live px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase">
                Live
              </span>
            </div>
            <span className="text-gray-400 text-sm">
              <span className="text-violet-400">전체 보기</span>
              <i className="fas fa-chevron-right ml-1 text-xs text-violet-400"></i>
            </span>
          </div>
          <p className="text-gray-500 text-sm mb-4">지금 가장 사랑받는 디자인</p>
          
          {/* 스타일 프리뷰 (플레이스홀더) */}
          <div className="grid grid-cols-3 gap-3">
            <StyleCard color="from-violet-600 to-purple-700" />
            <StyleCard color="from-blue-600 to-indigo-700" />
            <StyleCard color="from-pink-600 to-rose-700" />
          </div>
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card-dark border-t border-white/5">
        <div className="flex items-center justify-around py-4 max-w-md mx-auto">
          <NavItem 
            icon="fa-home" 
            label="홈" 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
          />
          <NavItem 
            icon="fa-clock-rotate-left" 
            label="히스토리" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
          <NavItem 
            icon="fa-bookmark" 
            label="저장됨" 
            active={activeTab === 'saved'} 
            onClick={() => setActiveTab('saved')} 
          />
        </div>
      </nav>

      {/* 로딩 오버레이 */}
      {state === AppState.GENERATING && <LoadingOverlay />}
    </div>
  );
};

// 기능 아이템 컴포넌트
const FeatureItem: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
      <i className={`fas ${icon} text-white/70`}></i>
    </div>
    <span className="text-gray-400 text-xs">{label}</span>
  </div>
);

// 스타일 카드 컴포넌트
const StyleCard: React.FC<{ color: string }> = ({ color }) => (
  <div className={`aspect-square rounded-2xl bg-gradient-to-br ${color} opacity-60 hover:opacity-100 transition-opacity cursor-pointer`}>
  </div>
);

// 네비게이션 아이템 컴포넌트
const NavItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`nav-item flex flex-col items-center gap-1 ${active ? 'text-violet-400' : 'text-gray-500'}`}
  >
    <i className={`fas ${icon} text-lg`}></i>
    <span className="text-xs">{label}</span>
  </button>
);

export default App;
