import React from 'react';
import { HairstyleDetail } from '../services/hairstyleData';

interface StyleDetailPanelProps {
    style: HairstyleDetail;
    onClose: () => void;
}

export const StyleDetailPanel: React.FC<StyleDetailPanelProps> = ({ style, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex justify-start">
            {/* 배경 오버레이 */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            ></div>

            {/* 패널 컨테이너 (왼쪽 사이드바) */}
            <div className="relative w-[85vw] max-w-sm h-full bg-[#1a1a24] border-r border-white/10 md:bg-black/90 md:backdrop-blur-xl flex flex-col shadow-2xl animate-slideInLeft"
                style={{ animation: 'slideInLeft 0.3s ease-out forwards' }}
            >
                <style>{`
                    @keyframes slideInLeft {
                        from { transform: translateX(-100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `}</style>


                {/* 헤더 */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{style.name}</h2>
                        <div className="flex flex-wrap gap-2">
                            {style.tags.map((tag, idx) => (
                                <span key={idx} className="text-xs font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                {/* 스크롤 영역 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">

                    {/* 디렉터 코멘트 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <i className="fas fa-quote-left text-violet-500 text-lg"></i>
                            <h3 className="text-lg font-bold text-gray-200">Director's Pick</h3>
                        </div>
                        <p className="text-gray-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                            {style.description}
                        </p>
                    </section>

                    {/* 추천 얼굴형 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <i className="fas fa-smile text-yellow-500"></i>
                            <h3 className="text-md font-bold text-gray-200">이런 분께 추천해요</h3>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-1 h-full min-h-[24px] bg-yellow-500/50 rounded-full"></div>
                            <p className="text-gray-400 text-sm leading-relaxed">{style.faceShape}</p>
                        </div>
                    </section>

                    {/* 손질 팁 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <i className="fas fa-wand-magic-sparkles text-pink-500"></i>
                            <h3 className="text-md font-bold text-gray-200">손질 꿀팁</h3>
                        </div>
                        <div className="glass-card p-4 rounded-2xl">
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {style.stylingTip}
                            </p>
                        </div>
                    </section>

                    {/* 시술 정보 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <i className="fas fa-info-circle text-blue-400"></i>
                            <h3 className="text-md font-bold text-gray-200">시술 정보</h3>
                        </div>
                        <p className="text-blue-300 text-sm font-medium bg-blue-500/10 px-4 py-3 rounded-xl border border-blue-500/20 inline-block">
                            {style.info}
                        </p>
                    </section>

                </div>

                {/* 하단 버튼 */}
                <div className="p-6 border-t border-white/5">
                    <button
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                        onClick={onClose}
                    >
                        <span>확인 완료</span>
                        <i className="fas fa-check"></i>
                    </button>
                </div>

            </div>
        </div>
    );
};
