
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
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md text-white p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fas fa-scissors text-3xl text-indigo-400 animate-pulse"></i>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">AI 스타일러 가동 중</h2>
          <p className="text-slate-400 min-h-[1.5rem] transition-all duration-500">
            {messages[messageIndex]}
          </p>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
          GEMINI 3 PRO VISION • 1K RESOLUTION
        </p>
      </div>
    </div>
  );
};
