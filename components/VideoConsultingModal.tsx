
import React from 'react';

interface VideoConsultingModalProps {
    videoId: string;
    title: string;
    onClose: () => void;
    isPremium?: boolean;
    onPaymentClick?: () => void;
}

export const VideoConsultingModal: React.FC<VideoConsultingModalProps> = ({
    videoId,
    title,
    onClose,
    isPremium = false,
    onPaymentClick
}) => {

    const handlePaymentClick = () => {
        if (onPaymentClick) {
            onPaymentClick();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 배경 오버레이 */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fadeIn"
                onClick={onClose}
            ></div>

            {/* 모달 컨텐츠 */}
            <div className="relative w-full max-w-lg bg-[#1a1a24] rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-scaleUp">

                {/* 헤더 */}
                <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                        Premium
                    </span>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* 유튜브 영상 (메인) */}
                <div className="aspect-video w-full bg-black">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&controls=1`}
                        title={title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                {/* 컨텐츠 하단부 */}
                <div className="p-6 bg-[#1a1a24]">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            AI가 분석한 스타일링 꿀팁과 <br />
                            내 얼굴형에 맞는 커스터마이징 가이드를 확인해보세요.
                        </p>
                    </div>

                    {/* 혜택 강조 박스 */}
                    <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
                        <h3 className="text-violet-400 font-bold text-sm mb-3 flex items-center gap-2">
                            <i className="fas fa-crown"></i>
                            프리미엄 멤버십 혜택
                        </h3>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-gray-300 text-xs">
                                <i className="fas fa-check text-green-400"></i>
                                <span>AI 정밀 얼굴형 분석 리포트</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-300 text-xs">
                                <i className="fas fa-check text-green-400"></i>
                                <span>맞춤형 헤어스타일 추천 (9종)</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-300 text-xs">
                                <i className="fas fa-check text-green-400"></i>
                                <span>스타일링 팁 & 미용실 가이드</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-300 text-xs">
                                <i className="fas fa-check text-green-400"></i>
                                <span>워터마크 없는 고화질 이미지</span>
                            </li>
                        </ul>
                    </div>

                    {/* 결제 유도 버튼 (프리미엄이 아닌 경우만) */}
                    {!isPremium ? (
                        <>
                            <button
                                onClick={handlePaymentClick}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-violet-500/20 glow-button flex items-center justify-center gap-2 group"
                            >
                                <span>스캔 시작</span>
                                <i className="fas fa-expand group-hover:scale-110 transition-transform"></i>
                            </button>

                            <p className="text-center text-gray-500 text-[10px] mt-3">
                                커피 한 잔 값($5.99)으로 평생의 인생 머리를 찾아보세요.
                            </p>
                        </>
                    ) : (
                        <div className="text-center py-2">
                            <span className="inline-flex items-center gap-2 text-green-400 text-sm font-medium">
                                <i className="fas fa-check-circle"></i>
                                프리미엄 회원입니다
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
