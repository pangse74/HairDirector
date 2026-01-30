import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { TranslationType } from '../locales';

interface PolicyViewProps {
    onBack: () => void;
    content: TranslationType['termsPage'];
}

export const TermsView: React.FC<PolicyViewProps> = ({ onBack, content }) => {
    const { t } = useLanguage();
    const T = content;

    return (
        <div className="w-full h-full flex flex-col bg-[#0a0a0f] text-gray-300 overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-[#0a0a0f]/90 backdrop-blur-md z-10 relative">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors z-10"
                >
                    <i className="fas fa-arrow-left"></i>
                    <span>{t.common.back}</span>
                </button>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white font-bold text-lg">{T.title}</span>
                </div>
                <div className="z-10">
                    <LanguageSelector />
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="max-w-3xl mx-auto space-y-8">

                    {/* AI Notice */}
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl mb-8">
                        <h3 className="text-yellow-500 font-bold mb-2 flex items-center gap-2">
                            <i className="fas fa-exclamation-triangle"></i>
                            {T.aiNoticeTitle}
                        </h3>
                        <ul className="list-disc list-inside text-sm text-yellow-500/80 space-y-1">
                            <li>{T.aiNotice1}</li>
                            <li>{T.aiNotice2}</li>
                            <li>{T.aiNotice3}</li>
                        </ul>
                    </div>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section1Title}</h2>
                        <p className="text-gray-400 leading-relaxed">{T.section1Content}</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section2Title}</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.def1}</li>
                            <li>{T.def2}</li>
                            <li>{T.def3}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section3Title}</h2>
                        <p className="text-gray-400">{T.section3Intro}</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.service1}</li>
                            <li>{T.service2}</li>
                            <li>{T.service3}</li>
                            <li>{T.service4}</li>
                        </ul>
                        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-400">
                            {T.serviceWarning}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section4Title}</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.ai1}</li>
                            <li>{T.ai2}</li>
                            <li>{T.ai3}</li>
                            <li>{T.ai4}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section5Title}</h2>
                        <p className="text-gray-400">{T.section5Intro}</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.duty1}</li>
                            <li>{T.duty2}</li>
                            <li>{T.duty3}</li>
                            <li>{T.duty4}</li>
                            <li>{T.duty5}</li>
                            <li>{T.duty6}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section6Title}</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.limit1}</li>
                            <li>{T.limit2}</li>
                            <li>{T.limit3}</li>
                            <li>{T.limit4}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section7Title}</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.pay1}</li>
                            <li>{T.pay2}</li>
                            <li>{T.pay3}</li>
                            <li>{T.pay4}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section8Title}</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.report1}</li>
                            <li>{T.report2}</li>
                            <li>{T.report3}</li>
                            <li>{T.report4}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section9Title}</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.ip1}</li>
                            <li>{T.ip2}</li>
                            <li>{T.ip3}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section10Title}</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.change1}</li>
                            <li>{T.change2}</li>
                            <li>{T.change3}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section11Title}</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.dispute1}</li>
                            <li>{T.dispute2}</li>
                            <li>{T.dispute3}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section12Title}</h2>
                        <p className="text-gray-400">{T.termsChange}</p>
                    </section>

                    <section className="space-y-3 pb-8">
                        <h2 className="text-xl font-bold text-violet-400">{T.section13Title}</h2>
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <p className="text-gray-300 mb-2">
                                <strong>{t.policy.contactEmail}:</strong>{' '}
                                <a href="mailto:1974mds@naver.com" className="text-violet-400 hover:text-violet-300">1974mds@naver.com</a>
                            </p>
                            <p className="text-sm text-gray-500">{T.contactNotice}</p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};
