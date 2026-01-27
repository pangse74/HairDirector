
import React from 'react';

interface Props {
  onSelectKey: () => void;
}

export const Header: React.FC<Props> = ({ onSelectKey }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <i className="fas fa-cut"></i>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            HairGrid AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600 mr-4">
            <a href="#" className="hover:text-indigo-600 transition-colors">홈</a>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">결제 안내</a>
          </div>
          <button 
            onClick={onSelectKey}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors border border-slate-200"
            title="API 키 선택"
          >
            <i className="fas fa-key text-indigo-500"></i>
            <span className="hidden sm:inline">API 키 변경</span>
          </button>
        </div>
      </div>
    </header>
  );
};
