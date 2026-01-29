import React, { useState } from 'react';
import { createCheckoutSession } from '../services/polarService';

interface PaymentModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handlePayment = async () => {
        if (!agreedToTerms) {
            setError('이용약관 및 개인정보처리방침에 동의해주세요.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const session = await createCheckoutSession(email || undefined);

            // Polar.sh 체크아웃 페이지로 리다이렉트
            window.location.href = session.url;
        } catch (err) {
            console.error('Payment error:', err);
            setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
            setIsLoading(false);
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
            <div className="relative w-full max-w-md bg-[#1a1a24] rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-scaleUp">
                {/* 헤더 */}
                <div className="relative p-6 pb-4 bg-gradient-to-b from-violet-600/20 to-transparent">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
                    >
                        <i className="fas fa-times"></i>
                    </button>

                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 mb-4">
                            <i className="fas fa-crown text-white text-2xl"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">프리미엄 이용권</h2>
                        <p className="text-gray-400 text-sm">평생 이용 가능한 일회성 결제</p>
                    </div>
                </div>

                {/* 가격 */}
                <div className="px-6 py-4 text-center">
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-black text-white">$5.99</span>
                        <span className="text-gray-500 text-sm">(약 ₩8,500)</span>
                    </div>
                    <p className="text-violet-400 text-sm mt-1">평생 이용권 (일회성 결제)</p>
                </div>

                {/* 혜택 목록 */}
                <div className="px-6 pb-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <h3 className="text-violet-400 font-bold text-sm mb-3 flex items-center gap-2">
                            <i className="fas fa-gift"></i>
                            포함된 혜택
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <i className="fas fa-check-circle text-green-400 flex-shrink-0"></i>
                                <span>AI 얼굴 비율·골격·특징 정밀 분석</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <i className="fas fa-check-circle text-green-400 flex-shrink-0"></i>
                                <span>9가지 맞춤 헤어스타일 추천</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <i className="fas fa-check-circle text-green-400 flex-shrink-0"></i>
                                <span>가상 헤어스타일 시뮬레이션</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <i className="fas fa-check-circle text-green-400 flex-shrink-0"></i>
                                <span>AI 스타일링 정보 제공</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <i className="fas fa-check-circle text-green-400 flex-shrink-0"></i>
                                <span>전체 스타일 가이드 제공</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 이메일 입력 (선택) */}
                <div className="px-6 pb-4">
                    <label className="block text-gray-400 text-xs mb-2">
                        이메일 (선택, 영수증 발송용)
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                </div>

                {/* 약관 동의 */}
                <div className="px-6 pb-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-gray-600 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 bg-transparent"
                        />
                        <span className="text-gray-400 text-xs leading-relaxed">
                            <a href="/terms.html" target="_blank" className="text-violet-400 hover:underline">이용약관</a>,{' '}
                            <a href="/privacy-policy.html" target="_blank" className="text-violet-400 hover:underline">개인정보처리방침</a>,{' '}
                            <a href="/refund-policy.html" target="_blank" className="text-violet-400 hover:underline">환불정책</a>에 동의합니다.
                        </span>
                    </label>
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="px-6 pb-4">
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        </div>
                    </div>
                )}

                {/* 결제 버튼 */}
                <div className="p-6 pt-2">
                    <button
                        onClick={handlePayment}
                        disabled={isLoading}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>처리 중...</span>
                            </>
                        ) : (
                            <>
                                <i className="fas fa-lock"></i>
                                <span>안전하게 결제하기</span>
                            </>
                        )}
                    </button>

                    {/* 결제 안내 */}
                    <div className="mt-4 text-center">
                        <p className="text-gray-500 text-[10px] flex items-center justify-center gap-1">
                            <i className="fas fa-shield-alt text-green-500/70"></i>
                            결제는 Polar.sh를 통해 안전하게 처리됩니다
                        </p>
                    </div>
                </div>

                {/* AI 서비스 고지 */}
                <div className="px-6 pb-6">
                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-yellow-500/80 text-[10px] text-center leading-relaxed">
                            본 서비스는 AI 기반 헤어스타일 추천 서비스입니다.<br />
                            전문 헤어 디자이너의 직접 서비스가 아닙니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
