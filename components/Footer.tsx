import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const Footer: React.FC = () => {
    const { t } = useLanguage();

    return (
        <footer className="w-full py-6 px-4 border-t border-white/5 bg-[#0a0a0f]/80 backdrop-blur-sm">
            <div className="max-w-md mx-auto">
                {/* 법적 문서 링크 */}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mb-4">
                    <a
                        href="/privacy-policy.html"
                        className="hover:text-violet-400 transition-colors"
                    >
                        {t.footer.privacyPolicy}
                    </a>
                    <span className="text-gray-700">|</span>
                    <a
                        href="/terms.html"
                        className="hover:text-violet-400 transition-colors"
                    >
                        {t.footer.terms}
                    </a>
                    <span className="text-gray-700">|</span>
                    <a
                        href="/refund-policy.html"
                        className="hover:text-violet-400 transition-colors"
                    >
                        {t.footer.refundPolicy}
                    </a>
                </div>

                {/* 결제 안전 고지 */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 mb-3">
                    <i className="fas fa-lock text-green-500/70"></i>
                    <span>{t.payment.safePayment}</span>
                </div>

                {/* 저작권 */}
                <div className="text-center text-[10px] text-gray-600">
                    <p>{t.footer.copyright}</p>
                </div>
            </div>
        </footer>
    );
};
