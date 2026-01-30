import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { TranslationType } from '../locales';

interface PolicyViewProps {
    onBack: () => void;
    content: TranslationType['privacyPage'];
}

export const PrivacyView: React.FC<PolicyViewProps> = ({ onBack, content }) => {
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
                    <p className="text-gray-400 leading-relaxed border-b border-white/5 pb-6">
                        {T.intro}
                    </p>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-violet-400">{T.section1Title}</h2>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">{T.section1_1Title}</h3>
                            <div className="overflow-x-auto rounded-lg border border-white/10">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white/5 text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3">{T.tableItem}</th>
                                            <th className="px-4 py-3">{T.tablePurpose}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <tr>
                                            <td className="px-4 py-3 text-white">{T.faceImage}</td>
                                            <td className="px-4 py-3 text-gray-400">{T.faceImagePurpose}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 text-white">{T.analysisData}</td>
                                            <td className="px-4 py-3 text-gray-400">{T.analysisDataPurpose}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">{T.section1_2Title}</h3>
                            <div className="overflow-x-auto rounded-lg border border-white/10">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white/5 text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3">{T.tableItem}</th>
                                            <th className="px-4 py-3">{T.tablePurpose}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <tr>
                                            <td className="px-4 py-3 text-white">{T.emailAddress}</td>
                                            <td className="px-4 py-3 text-gray-400">{T.emailPurpose}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 text-white">{T.paymentInfo}</td>
                                            <td className="px-4 py-3 text-gray-400">{T.paymentPurpose}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3 p-3 bg-violet-500/10 border-l-2 border-violet-500 rounded-r text-sm text-violet-300">
                                {T.paymentNote}
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section2Title}</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.purpose1}</li>
                            <li>{T.purpose2}</li>
                            <li>{T.purpose3}</li>
                            <li>{T.purpose4}</li>
                            <li>{T.purpose5}</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-violet-400">{T.section3Title}</h2>
                        <p className="text-gray-400">{T.section3Intro}</p>

                        <div className="overflow-x-auto rounded-lg border border-white/10">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">{T.tableRecipient}</th>
                                        <th className="px-4 py-3">{T.tableProvidePurpose}</th>
                                        <th className="px-4 py-3">{T.tableItems}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <tr>
                                        <td className="px-4 py-3 text-white">{T.googleGemini}</td>
                                        <td className="px-4 py-3 text-gray-400">{T.aiAnalysis}</td>
                                        <td className="px-4 py-3 text-gray-400">{T.faceImage}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-white">{T.polarsh}</td>
                                        <td className="px-4 py-3 text-gray-400">{T.paymentProcessing}</td>
                                        <td className="px-4 py-3 text-gray-400">{T.emailPaymentInfo}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="p-3 bg-red-500/10 border-l-2 border-red-500 rounded-r text-sm text-red-300">
                            {T.imageDeleteNote}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-violet-400">{T.section4Title}</h2>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">{T.section4_1Title}</h3>
                            <div className="overflow-x-auto rounded-lg border border-white/10">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white/5 text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3">{T.tableItem}</th>
                                            <th className="px-4 py-3">{T.tableRetention}</th>
                                            <th className="px-4 py-3">{T.tableStorage}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <tr>
                                            <td className="px-4 py-3 text-white">{T.faceImage}</td>
                                            <td className="px-4 py-3 text-gray-400">{T.immediateDelete}</td>
                                            <td className="px-4 py-3 text-gray-400">{T.tempMemory}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 text-white">{T.analysisResult}</td>
                                            <td className="px-4 py-3 text-gray-400">{T.untilUserDelete}</td>
                                            <td className="px-4 py-3 text-gray-400">{T.userBrowser}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 text-white">{T.paymentInfo}</td>
                                            <td className="px-4 py-3 text-gray-400">{T.accordingToLaw}</td>
                                            <td className="px-4 py-3 text-gray-400">{T.polarServer}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">{T.section4_2Title}</h3>
                            <p className="text-gray-400">{T.deleteMethod}</p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section5Title}</h2>
                        <p className="text-gray-400">{T.rightsIntro}</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.rightAccess}</li>
                            <li>{T.rightCorrect}</li>
                            <li>{T.rightDelete}</li>
                            <li>{T.rightSuspend}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section6Title}</h2>
                        <p className="text-gray-400">{T.cookieIntro}</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.cookie1}</li>
                            <li>{T.cookie2}</li>
                            <li>{T.cookie3}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section7Title}</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li>{T.security1}</li>
                            <li>{T.security2}</li>
                            <li>{T.security3}</li>
                            <li>{T.security4}</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-violet-400">{T.section8Title}</h2>
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <p className="text-gray-300 mb-2">
                                <strong>{t.policy.contactEmail}:</strong>{' '}
                                <a href="mailto:1974mds@naver.com" className="text-violet-400 hover:text-violet-300">1974mds@naver.com</a>
                            </p>
                            <p className="text-sm text-gray-500">{T.contactIntro}</p>
                        </div>
                    </section>

                    <section className="space-y-3 pb-8">
                        <h2 className="text-xl font-bold text-violet-400">{T.section9Title}</h2>
                        <p className="text-gray-400">{T.changeNotice}</p>
                    </section>
                </div>
            </div>
        </div>
    );
};
