
import React from 'react';

interface VideoConsultingModalProps {
    videoId: string;
    title: string;
    onClose: () => void;
}

export const VideoConsultingModal: React.FC<VideoConsultingModalProps> = ({ videoId, title, onClose }) => {

    const handlePaymentClick = () => {
        // 결제 유도 로직 (예: 알림 또는 실제 결제 모듈 연동 예정)
        const confirmPayment = window.confirm("전문가 1:1 컨설팅과 전체 영상을 확인하시겠습니까?\n(프리미엄 멤버십 $2.99 결제 페이지로 이동합니다)");
        if (confirmPayment) {
            alert("결제 페이지가 준비 중입니다.");
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
                            전문 헤어 디렉터가 제안하는 스타일링 꿀팁과 <br />
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
                                <span>전체 길이 풀영상 시청 무제한</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-300 text-xs">
                                <i className="fas fa-check text-green-400"></i>
                                <span>전문가 1:1 스타일링 Q&A 우선권</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-300 text-xs">
                                <i className="fas fa-check text-green-400"></i>
                                <span>매월 업데이트되는 트렌드북 제공</span>
                            </li>
                        </ul>
                    </div>

                    {/* 결제 유도 버튼 */}
                    <button
                        onClick={handlePaymentClick}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-violet-500/20 glow-button flex items-center justify-center gap-2 group"
                    >
                        <span>전체 영상 잠금 해제</span>
                        <i className="fas fa-lock-open group-hover:rotate-12 transition-transform"></i>
                    </button>

                    <p className="text-center text-gray-500 text-[10px] mt-3">
                        커피 한 잔 값($2.99)으로 평생의 인생 머리를 찾아보세요.
                    </p>
                </div>
            </div>
        </div>
    );
};
