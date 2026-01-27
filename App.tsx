
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ResultView } from './components/ResultView';
import { HistoryView } from './components/HistoryView';
import { SavedView } from './components/SavedView';
import { generateHairstyleGrid } from './services/geminiService';
import { addHistoryItem, saveStyle } from './services/storageService';
import { AppState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'saved'>('home');
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleOpenKeyDialog = async () => {
    try {
      await (window as any).aistudio?.openSelectKey();
    } catch (err) {
      console.error("Failed to open key dialog", err);
    }
  };

  // 파일 처리 함수 (공통)
  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Image = event.target?.result as string;
      setOriginalImage(base64Image);
      setErrorMessage(null);
      setState(AppState.PREVIEW); // 미리보기 단계로 이동
    };
    reader.readAsDataURL(file);
  }, []);

  // 스캔 버튼 클릭 - 모달 열기
  const handleScanClick = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    setShowUploadModal(false);
    setCameraError(null);
    setShowCamera(true);
  }, []);

  // 카메라가 활성화되면 스트림 연결
  useEffect(() => {
    if (!showCamera) return;

    let mounted = true;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      } catch (err) {
        console.error('카메라 접근 실패:', err);
        if (mounted) {
          setCameraError('카메라에 접근할 수 없습니다. 카메라 권한을 허용해주세요.');
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [showCamera]);

  // 카메라 중지
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCameraError(null);
  }, []);

  // 사진 촬영
  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // 좌우 반전 (거울 모드)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
    }

    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
    setOriginalImage(base64Image);
    setErrorMessage(null);
    stopCamera();
    setState(AppState.PREVIEW);
  }, [stopCamera]);

  // 컴포넌트 언마운트 시 스트림 정리
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 갤러리에서 사진 선택
  const handleGallerySelect = useCallback(() => {
    setShowUploadModal(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) processFile(file);
    };
    input.click();
  }, [processFile]);

  // 드래그 이벤트 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // 분석 시작 (미리보기 확인 후)
  const handleStartAnalysis = useCallback(async () => {
    if (!originalImage) return;

    // API 키 확인 (디버그 모드에서는 스킵)
    const hasKey = await (window as any).aistudio?.hasSelectedApiKey?.();
    const apiKeyEnv = (process as any).env?.API_KEY || (process as any).env?.GEMINI_API_KEY;
    const hasApiKeyEnv = !!(apiKeyEnv && apiKeyEnv.trim().length > 0);

    // API 키가 없어도 디버그 모드로 진행
    if (!hasKey && hasApiKeyEnv) {
      await handleOpenKeyDialog();
    }

    setState(AppState.GENERATING);

    try {
      const result = await generateHairstyleGrid(originalImage);
      setResultImage(result);

      // 히스토리에 저장 (비동기, 이미지 압축 포함)
      try {
        await addHistoryItem({
          originalImage: originalImage,
          resultImage: result,
          faceAnalysis: {
            faceShape: '계란형',
            upperRatio: 33,
            middleRatio: 34,
            lowerRatio: 33,
            features: ['균형잡힌 이목구비', '부드러운 턱선']
          },
          recommendedStyles: ['레이어드 컷', '에어펌', '시스루뱅'],
          liked: false
        });
      } catch (storageError) {
        console.warn('히스토리 저장 실패:', storageError);
      }

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
  }, [originalImage]);

  const handleReset = () => {
    setState(AppState.IDLE);
    setOriginalImage(null);
    setResultImage(null);
    setErrorMessage(null);
  };

  // 영상 저장 핸들러
  const handleSaveVideo = (videoId: string, title: string) => {
    saveStyle({
      type: 'video',
      category: 'cut',
      title: title,
      thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`,
      videoId: videoId,
    });
    alert(`"${title}" 스타일이 저장되었습니다! 🎉`);
  };

  // 미리보기 화면 (사진 확인 단계)
  if (state === AppState.PREVIEW && originalImage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#12121a] flex flex-col">
        {/* 헤더 */}
        <header className="flex items-center justify-between px-5 py-4">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            <span>뒤로</span>
          </button>
          <span className="text-white font-bold">사진 확인</span>
          <div className="w-16"></div>
        </header>

        {/* 미리보기 콘텐츠 */}
        <main className="flex-1 flex flex-col items-center justify-center px-5 pb-8">
          {/* 안내 메시지 */}
          <div className="mb-6 text-center">
            <h2 className="text-white text-xl font-bold mb-2">사진이 잘 나왔나요?</h2>
            <p className="text-gray-400 text-sm">얼굴이 정면으로 나온 사진이 가장 정확해요!</p>
          </div>

          {/* 이미지 미리보기 */}
          <div className="relative w-full max-w-sm mb-8">
            <div className="aspect-square rounded-3xl overflow-hidden border-4 border-violet-500/30 shadow-2xl shadow-violet-500/20">
              <img
                src={originalImage}
                alt="업로드된 사진"
                className="w-full h-full object-cover"
              />
            </div>
            {/* 교체 버튼 */}
            <button
              onClick={handleScanClick}
              className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <i className="fas fa-sync-alt text-white"></i>
            </button>
          </div>

          {/* 팁 */}
          <div className="w-full max-w-sm mb-6">
            <div className="glass-card-dark p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-lightbulb text-violet-400 text-sm"></i>
                </div>
                <div>
                  <p className="text-gray-300 text-sm font-medium mb-1">팁!</p>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    얼굴 전체가 보이고, 정면을 바라보는 사진일수록 더 정확한 분석이 가능해요.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div className="w-full max-w-sm space-y-3">
            {/* 분석 시작 버튼 */}
            <button
              onClick={handleStartAnalysis}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-all glow-button"
            >
              <i className="fas fa-magic"></i>
              AI 분석 시작
            </button>

            {/* 다른 사진 선택 */}
            <button
              onClick={handleScanClick}
              className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
            >
              <i className="fas fa-camera"></i>
              다른 사진 선택
            </button>
          </div>
        </main>
      </div>
    );
  }

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
        {/* 홈 탭 */}
        {activeTab === 'home' && (
          <div
            className="w-full flex flex-col items-center relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* 전체 화면 드래그 오버레이 */}
            {isDragging && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center pointer-events-none">
                <div className="w-80 h-80 rounded-3xl border-4 border-dashed border-violet-400 bg-violet-500/20 flex flex-col items-center justify-center gap-4 animate-pulse">
                  <i className="fas fa-cloud-upload-alt text-violet-400 text-6xl"></i>
                  <span className="text-violet-300 font-bold text-xl">사진을 여기에 놓으세요!</span>
                  <span className="text-violet-400/70 text-sm">지원 형식: JPG, PNG, WEBP</span>
                </div>
              </div>
            )}
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
                30초 만에
              </h1>
              <h1 className="text-4xl font-black text-white leading-tight">
                인생 헤어스타일 찾기
              </h1>
              <p className="text-gray-400 mt-4 text-sm">
                AI 얼굴형 분석 및 가상 헤어 체험
              </p>
            </div>

            {/* 스캔 버튼 */}
            <div className="fade-in-up-delay-2 my-8">
              <button
                onClick={handleScanClick}
                className={`relative w-44 h-44 rounded-full glow-button pulse-animation flex flex-col items-center justify-center gap-3 cursor-pointer ${isDragging ? 'opacity-50 scale-110' : ''} transition-all`}
              >
                <i className="fas fa-camera text-white text-4xl"></i>
                <span className="text-white font-bold text-lg">스캔 시작</span>
              </button>
            </div>

            {/* 드래그 앤 드롭 안내 */}
            <div className="fade-in-up-delay-2 flex items-center gap-2 text-gray-500 text-xs mb-4">
              <i className="fas fa-hand-pointer"></i>
              <span>클릭하거나 사진을 여기로 드래그하세요</span>
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
                <button
                  onClick={() => setActiveTab('saved')}
                  className="text-gray-400 text-sm hover:text-violet-400 transition-colors"
                >
                  <span className="text-violet-400">전체 보기</span>
                  <i className="fas fa-chevron-right ml-1 text-xs text-violet-400"></i>
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-4">지금 가장 사랑받는 디자인</p>

              {/* 스타일 프리뷰 - 유튜브 쇼츠 */}
              <div className="grid grid-cols-3 gap-3">
                <YouTubeShort
                  videoId="L2Wcjvr6bNQ"
                  onSave={() => handleSaveVideo('L2Wcjvr6bNQ', '트렌디 레이어드 컷')}
                />
                <YouTubeShort
                  videoId="bmzZ13cx_fA"
                  onSave={() => handleSaveVideo('bmzZ13cx_fA', '볼륨 에어펌')}
                />
                <YouTubeShort
                  videoId="Dt3XwYI4lzo"
                  onSave={() => handleSaveVideo('Dt3XwYI4lzo', '내추럴 시스루뱅')}
                />
              </div>
            </div>
          </div>
        )}

        {/* 히스토리 탭 */}
        {activeTab === 'history' && (
          <div className="w-full mt-6">
            <HistoryView />
          </div>
        )}

        {/* 저장됨 탭 */}
        {activeTab === 'saved' && (
          <div className="w-full mt-6">
            <SavedView />
          </div>
        )}
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

      {/* 업로드 방식 선택 모달 */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center animate-fadeIn"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#1a1a24] rounded-t-3xl p-6 pb-10 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-6"></div>
            <h3 className="text-white text-lg font-bold text-center mb-6">사진 업로드 방법 선택</h3>

            <div className="space-y-3">
              {/* 카메라 촬영 */}
              <button
                onClick={startCamera}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold flex items-center gap-4 hover:opacity-90 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <i className="fas fa-camera text-xl"></i>
                </div>
                <div className="text-left">
                  <div className="font-bold">카메라로 촬영</div>
                  <div className="text-sm text-white/70">지금 바로 셀카 촬영하기</div>
                </div>
              </button>

              {/* 갤러리 선택 */}
              <button
                onClick={handleGallerySelect}
                className="w-full py-4 px-5 rounded-2xl bg-white/10 border border-white/10 text-white font-semibold flex items-center gap-4 hover:bg-white/15 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <i className="fas fa-images text-xl text-violet-400"></i>
                </div>
                <div className="text-left">
                  <div className="font-bold">갤러리에서 선택</div>
                  <div className="text-sm text-gray-400">저장된 사진 불러오기</div>
                </div>
              </button>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowUploadModal(false)}
              className="w-full mt-4 py-3 text-gray-400 hover:text-white transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 카메라 촬영 화면 */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* 헤더 */}
          <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 text-white"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
            <span className="text-white font-bold">카메라</span>
            <div className="w-8"></div>
          </header>

          {/* 카메라 뷰 */}
          <div className="flex-1 flex items-center justify-center">
            {cameraError ? (
              <div className="text-center px-8">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-video-slash text-red-400 text-3xl"></i>
                </div>
                <p className="text-red-400 font-medium mb-2">카메라 접근 실패</p>
                <p className="text-gray-400 text-sm mb-6">{cameraError}</p>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium"
                >
                  닫기
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            )}
          </div>

          {/* 촬영 컨트롤 */}
          {!cameraError && (
            <div className="absolute bottom-0 left-0 right-0 pb-10 pt-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-center gap-8">
                {/* 촬영 버튼 */}
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-gray-300"></div>
                </button>
              </div>
              <p className="text-center text-gray-400 text-sm mt-4">
                정면을 바라보고 촬영해주세요
              </p>
            </div>
          )}
        </div>
      )}
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

// 유튜브 쇼츠 컴포넌트
const YouTubeShort: React.FC<{ videoId: string; onSave?: () => void }> = ({ videoId, onSave }) => (
  <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-black/50 hover:scale-105 transition-transform cursor-pointer relative group">
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?loop=1&playlist=${videoId}`}
      title="YouTube Short"
      className="w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
    {/* 저장 버튼 */}
    {onSave && (
      <button
        onClick={(e) => { e.stopPropagation(); onSave(); }}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white/70 hover:text-pink-400 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
      >
        <i className="fas fa-bookmark text-sm"></i>
      </button>
    )}
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
