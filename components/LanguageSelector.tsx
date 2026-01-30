import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="relative">
      {/* 언어 선택 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white text-sm border border-white/10"
      >
        <i className="fas fa-globe text-violet-400"></i>
        <span className="text-lg">{currentLang?.flag}</span>
        <span className="text-xs text-gray-300">{currentLang?.nativeName}</span>
        <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 언어 목록 */}
          <div className="absolute right-0 top-full mt-2 w-56 max-h-96 overflow-y-auto rounded-2xl bg-[#1a1a24] border border-white/10 shadow-2xl z-50 py-2">
            {/* 헤더 */}
            <div className="px-4 py-2 border-b border-white/10 mb-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Select Language</p>
            </div>

            {/* 언어 옵션들 */}
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left ${
                  language === lang.code
                    ? 'bg-violet-500/20 border-l-2 border-violet-500'
                    : 'border-l-2 border-transparent'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${language === lang.code ? 'text-violet-400' : 'text-white'}`}>
                    {lang.nativeName}
                  </p>
                  <p className="text-xs text-gray-500">{lang.name}</p>
                </div>
                {language === lang.code && (
                  <i className="fas fa-check text-violet-400 text-sm"></i>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
