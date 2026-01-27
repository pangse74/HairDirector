
import React, { useState, useEffect } from 'react';

export const LoadingOverlay: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    "사진을 분석하고 있습니다...",
    "얼굴 특징점을 추출 중입니다...",
    "다양한 헤어스타일을 시뮬레이션하고 있습니다...",
    "3x3 고해상도 그리드를 생성 중입니다...",
    "자연스러운 질감을 합성하고 있습니다...",
    "거의 다 되었습니다. 잠시만 기다려주세요!"
  ];

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
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0f]/95 backdrop-blur-xl text-white p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 스캔 애니메이션 */}
        <div className="relative">
          <div className="w-36 h-36 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 mx-auto flex items-center justify-center"
            style={{
              boxShadow: '0 0 60px rgba(139, 92, 246, 0.5), 0 0 100px rgba(139, 92, 246, 0.3)',
              animation: 'pulse-glow 2s ease-in-out infinite'
            }}>
            <i className="fas fa-brain text-5xl text-white animate-pulse"></i>
          </div>
          {/* 회전 링 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-44 h-44 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"
              style={{ animationDuration: '3s' }}></div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">AI 분석 중</h2>
          <p className="text-gray-400 min-h-[1.5rem] transition-all duration-500">
            {messages[messageIndex]}
          </p>
        </div>

        {/* 프로그레스 바 */}
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
          <div
            className="bg-gradient-to-r from-violet-500 to-purple-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span className="uppercase tracking-widest font-semibold">GEMINI AI • 고해상도 처리 중</span>
        </div>
      </div>
    </div>
  );
};
