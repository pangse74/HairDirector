import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { TranslationType } from '../locales';

interface PolicyViewProps {
    onBack: () => void;
    content: TranslationType['refundPage'];
}

export const RefundView: React.FC<PolicyViewProps> = ({ onBack, content }) => {
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

                    {/* Guarantee Box */}
                    <div className="p-6 bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-2xl mb-8 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-money-bill-wave text-violet-400 text-xl"></i>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">{T.guaranteeTitle}</h3>
                            <p className="text-gray-300 text-sm leading-relaxed">{T.guaranteeContent}</p>
                        </div>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-violet-400">{T.section1Title}</h2>

                        <div className="overflow-x-auto rounded-lg border border-white/10">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 min-w-[100px]">{T.tableCategory}</th>
                                        <th className="px-4 py-3 min-w-[100px]">{T.tableRefundable}</th>
                                        <th className="px-4 py-3">{T.tableNote}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <tr>
                                        <td className="px-4 py-3 text-white">{T.beforeAnalysis}</td>
                                        <td className="px-4 py-3 text-green-400 font-bold">{T.possible}</td>
                                        <td className="px-4 py-3 text-gray-400">{T.beforeNote}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-white">{T.afterAnalysis}</td>
                                        <td className="px-4 py-3 text-red-400 font-bold">{T.notPossible}</td>
                                        <td className="px-4 py-3 text-gray-400">{T.afterNote}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-white">{T.systemError}</td>
                                        <td className="px-4 py-3 text-green-400 font-bold">{T.possible}</td>
                                        <td className="px-4 py-3 text-gray-400">{T.errorNote}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-violet-400">{T.section2Title}</h2>
                        <p className="text-gray-400 mb-4">{T.section2Intro}</p>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold">1</div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">{T.step1Title}</h3>
                                    <p className="text-gray-400 text-sm">
                                        <a href="mailto:1974mds@naver.com" className="text-violet-400 hover:underline font-bold">1974mds@naver.com</a>
                                        {T.step1Content}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold">2</div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">{T.step2Title}</h3>
                                    <p className="text-gray-400 text-sm mb-2">{T.step2Content}</p>
                                    <ul className="list-disc list-inside text-sm text-gray-500 ml-1">
                                        <li>{T.step2Item1}</li>
                                        <li>{T.step2Item2}</li>
                                        <li>{T.step2Item3}</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold">3</div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">{T.step3Title}</h3>
                                    <p className="text-gray-400 text-sm">{T.step3Content}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold">4</div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">{T.step4Title}</h3>
                                    <p className="text-gray-400 text-sm">{T.step4Content}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-violet-400">{T.section3Title}</h2>

                        <div className="overflow-x-auto rounded-lg border border-white/10">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">{T.paymentMethod}</th>
                                        <th className="px-4 py-3">{T.processingTime}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <tr>
                                        <td className="px-4 py-3 text-white">{T.creditCard}</td>
                                        <td className="px-4 py-3 text-gray-400">{T.creditCardTime}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-white">{T.paypal}</td>
                                        <td className="px-4 py-3 text-gray-400">{T.paypalTime}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{T.processingNote}</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section4Title}</h2>
                        <p className="text-gray-400">{T.digitalIntro}</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.digital1}</li>
                            <li>{T.digital2}</li>
                            <li>{T.digital3}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section5Title}</h2>
                        <p className="text-gray-400">{T.section5Intro}</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.noRefund1}</li>
                            <li>{T.noRefund2}</li>
                            <li>{T.noRefund3}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section6Title}</h2>
                        <p className="text-gray-400">{T.polarIntro}</p>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-gray-300 font-bold mb-2">{T.polarNotice}</p>
                            <p className="text-gray-400 text-sm leading-relaxed mb-2">{T.polarContent}</p>
                            <a href="https://polar.sh" target="_blank" rel="noopener noreferrer" className="text-violet-400 text-sm hover:underline">{T.polarLink}</a>
                        </div>
                    </section>

                    <section className="space-y-4 pb-8">
                        <h2 className="text-xl font-bold text-violet-400">{T.section7Title}</h2>
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <p className="text-gray-300 mb-2">
                                <strong>{t.policy.contactEmail}:</strong>{' '}
                                <a href="mailto:1974mds@naver.com" className="text-violet-400 hover:text-violet-300">1974mds@naver.com</a>
                            </p>
                            <p className="text-sm text-gray-400 mb-4">{T.contactIntro}</p>

                            <div className="flex items-center gap-2 text-sm text-gray-500 border-t border-white/10 pt-4">
                                <i className="fas fa-clock"></i>
                                <span>{T.responseTime}: {T.responseValue}</span>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3 pb-8">
                        <h2 className="text-xl font-bold text-violet-400">{T.section8Title}</h2>
                        <p className="text-gray-400">{T.policyChange}</p>
                    </section>
                </div>
            </div>
        </div>
    );
};
