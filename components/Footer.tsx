import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full py-6 px-4 border-t border-white/5 bg-[#0a0a0f]/80 backdrop-blur-sm">
            <div className="max-w-md mx-auto">
                {/* 법적 문서 링크 */}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mb-4">
                    <a
                        href="/privacy-policy.html"
                        className="hover:text-violet-400 transition-colors"
                    >
                        개인정보처리방침
                    </a>
                    <span className="text-gray-700">|</span>
                    <a
                        href="/terms.html"
                        className="hover:text-violet-400 transition-colors"
                    >
                        이용약관
                    </a>
                    <span className="text-gray-700">|</span>
                    <a
                        href="/refund-policy.html"
                        className="hover:text-violet-400 transition-colors"
                    >
                        환불정책
                    </a>
                </div>

                {/* 결제 안전 고지 */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 mb-3">
                    <i className="fas fa-lock text-green-500/70"></i>
                    <span>결제는 Polar.sh를 통해 안전하게 처리됩니다</span>
                </div>

                {/* 저작권 */}
                <div className="text-center text-[10px] text-gray-600">
                    <p>&copy; 2025 헤어디렉터 (Hair Director). All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};
