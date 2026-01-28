
import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  phase?: 'analyzing' | 'generating';
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ phase = 'generating' }) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  // phase별 메시지
  const analyzingMessages = [
    "얼굴 특징을 분석하고 있습니다...",
    "얼굴형을 측정 중입니다...",
    "피부톤을 분석하고 있습니다...",
    "얼굴 비율을 계산 중입니다...",
    "맞춤 스타일을 추천 중입니다...",
    "분석이 거의 완료되었습니다!"
  ];

  const generatingMessages = [
    "사진을 분석하고 있습니다...",
    "추천 스타일을 적용 중입니다...",
    "다양한 헤어스타일을 시뮬레이션하고 있습니다...",
    "3x3 그리드를 생성 중입니다...",
    "자연스러운 질감을 합성하고 있습니다...",
    "거의 다 되었습니다. 잠시만 기다려주세요!"
  ];

  const messages = phase === 'analyzing' ? analyzingMessages : generatingMessages;

  // phase별 아이콘
  const icon = phase === 'analyzing' ? 'fa-search' : 'fa-brain';
  const title = phase === 'analyzing' ? '얼굴 분석 중' : 'AI 스타일 생성 중';

  useEffect(() => {
    // phase 변경 시 progress 초기화
    setProgress(0);
    setMessageIndex(0);
  }, [phase]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return prev;
        return prev + (100 - prev) * 0.05;
      });
    }, 500);

    const msgTimer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(msgTimer);
    };
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0f]/95 backdrop-blur-xl text-white p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 스캔 애니메이션 */}
        <div className="relative">
          <div className={`w-36 h-36 rounded-full mx-auto flex items-center justify-center ${
            phase === 'analyzing'
              ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
              : 'bg-gradient-to-br from-violet-600 to-purple-700'
          }`}
            style={{
              boxShadow: phase === 'analyzing'
                ? '0 0 60px rgba(6, 182, 212, 0.5), 0 0 100px rgba(6, 182, 212, 0.3)'
                : '0 0 60px rgba(139, 92, 246, 0.5), 0 0 100px rgba(139, 92, 246, 0.3)',
              animation: 'pulse-glow 2s ease-in-out infinite'
            }}>
            <i className={`fas ${icon} text-5xl text-white animate-pulse`}></i>
          </div>
          {/* 회전 링 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-44 h-44 border-2 rounded-full animate-spin ${
              phase === 'analyzing'
                ? 'border-cyan-500/30 border-t-cyan-500'
                : 'border-violet-500/30 border-t-violet-500'
            }`}
              style={{ animationDuration: '3s' }}></div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">{title}</h2>
          <p className="text-gray-400 min-h-[1.5rem] transition-all duration-500">
            {messages[messageIndex]}
          </p>
        </div>

        {/* 프로그레스 바 */}
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              phase === 'analyzing'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                : 'bg-gradient-to-r from-violet-500 to-purple-500'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>

      </div>
    </div>
  );
};
