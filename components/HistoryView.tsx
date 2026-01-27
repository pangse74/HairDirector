import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../types';
import { getHistory, deleteHistoryItem, toggleHistoryLike, formatDate, formatDateFull, clearHistory } from '../services/storageService';

interface HistoryViewProps {
    onSelectItem?: (item: HistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectItem }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = () => {
        setHistory(getHistory());
    };

    const handleLike = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toggleHistoryLike(id);
        loadHistory();
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteHistoryItem(id);
        loadHistory();
        if (selectedItem?.id === id) setSelectedItem(null);
    };

    const handleClearAll = () => {
        clearHistory();
        loadHistory();
        setShowDeleteConfirm(false);
    };

    // 상세 보기 모달
    if (selectedItem) {
        return (
            <div className="w-full max-w-md mx-auto animate-fadeIn">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setSelectedItem(null)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <i className="fas fa-arrow-left"></i>
                        <span>뒤로</span>
                    </button>
                    <span className="text-gray-500 text-sm">{formatDateFull(selectedItem.date)}</span>
                </div>

                {/* AI 진단 리포트 */}
                <div className="glass-card-dark p-5 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <i className="fas fa-brain text-violet-400"></i>
                        </div>
                        <h3 className="text-white font-bold">AI 얼굴형 분석 리포트</h3>
                    </div>

                    {selectedItem.faceAnalysis ? (
                        <>
                            {/* 얼굴형 */}
                            <div className="mb-4">
                                <span className="text-gray-400 text-sm">얼굴형</span>
                                <p className="text-white text-lg font-bold">{selectedItem.faceAnalysis.faceShape}</p>
                            </div>

                            {/* 비율 분석 */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="text-center p-3 rounded-xl bg-white/5">
                                    <span className="text-gray-500 text-xs block mb-1">상안부</span>
                                    <span className="text-violet-400 font-bold">{selectedItem.faceAnalysis.upperRatio}%</span>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-white/5">
                                    <span className="text-gray-500 text-xs block mb-1">중안부</span>
                                    <span className="text-blue-400 font-bold">{selectedItem.faceAnalysis.middleRatio}%</span>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-white/5">
                                    <span className="text-gray-500 text-xs block mb-1">하안부</span>
                                    <span className="text-pink-400 font-bold">{selectedItem.faceAnalysis.lowerRatio}%</span>
                                </div>
                            </div>

                            {/* 골격 특징 */}
                            <div>
                                <span className="text-gray-400 text-sm block mb-2">골격 특징</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedItem.faceAnalysis.features.map((feature, idx) => (
                                        <span key={idx} className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-sm">
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500 text-sm">상세 분석 데이터가 없습니다.</p>
                    )}
                </div>

                {/* 시뮬레이션 결과 */}
                <div className="glass-card-dark p-5 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <i className="fas fa-images text-blue-400"></i>
                        </div>
                        <h3 className="text-white font-bold">시뮬레이션 결과</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="text-gray-500 text-xs block mb-2">원본</span>
                            <img
                                src={selectedItem.originalImage}
                                alt="원본"
                                className="w-full rounded-xl object-cover aspect-square"
                            />
                        </div>
                        <div>
                            <span className="text-gray-500 text-xs block mb-2">추천 스타일</span>
                            <img
                                src={selectedItem.resultImage}
                                alt="결과"
                                className="w-full rounded-xl object-cover aspect-square"
                            />
                        </div>
                    </div>
                </div>

                {/* 추천 스타일 태그 */}
                {selectedItem.recommendedStyles.length > 0 && (
                    <div className="glass-card-dark p-5 mb-4">
                        <span className="text-gray-400 text-sm block mb-3">추천된 스타일</span>
                        <div className="flex flex-wrap gap-2">
                            {selectedItem.recommendedStyles.map((style, idx) => (
                                <span key={idx} className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-600/30 to-purple-600/30 text-violet-300 text-sm border border-violet-500/30">
                                    {style}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 액션 버튼들 */}
                <div className="grid grid-cols-2 gap-3">
                    <button className="p-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        <i className="fas fa-download"></i>
                        <span>다운로드</span>
                    </button>
                    <button className="p-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
                        <i className="fas fa-crown"></i>
                        <span>PRO 업그레이드</span>
                    </button>
                </div>
            </div>
        );
    }

    // 리스트 뷰
    return (
        <div className="w-full max-w-md mx-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-bold text-xl">히스토리</h2>
                    <p className="text-gray-500 text-sm mt-1">나의 AI 스타일 진단 기록장</p>
                </div>
                {history.length > 0 && (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-gray-500 hover:text-red-400 transition-colors text-sm"
                    >
                        <i className="fas fa-trash-alt mr-1"></i>
                        전체 삭제
                    </button>
                )}
            </div>

            {/* 전체 삭제 확인 모달 */}
            {showDeleteConfirm && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <p className="text-red-300 text-sm mb-3">정말 모든 히스토리를 삭제하시겠어요?</p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleClearAll}
                            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 transition-all"
                        >
                            삭제
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-all"
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}

            {/* 히스토리 리스트 */}
            {history.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-clock-rotate-left text-3xl text-gray-600"></i>
                    </div>
                    <h3 className="text-gray-400 font-medium mb-2">아직 기록이 없어요</h3>
                    <p className="text-gray-600 text-sm">AI 스타일 진단을 시작해 보세요!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="glass-card-dark p-4 cursor-pointer hover:bg-white/10 transition-all group"
                        >
                            <div className="flex gap-4">
                                {/* 썸네일 */}
                                <div className="relative">
                                    <img
                                        src={item.resultImage}
                                        alt="결과"
                                        className="w-20 h-20 rounded-xl object-cover"
                                    />
                                    {item.liked && (
                                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                                            <i className="fas fa-heart text-white text-xs"></i>
                                        </div>
                                    )}
                                </div>

                                {/* 정보 */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-gray-400 text-xs">{formatDate(item.date)}</span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleLike(item.id, e)}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${item.liked ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-gray-500 hover:text-pink-400'
                                                    }`}
                                            >
                                                <i className={`${item.liked ? 'fas' : 'far'} fa-heart text-sm`}></i>
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(item.id, e)}
                                                className="w-8 h-8 rounded-full bg-white/5 text-gray-500 hover:text-red-400 flex items-center justify-center transition-colors"
                                            >
                                                <i className="fas fa-trash-alt text-sm"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <h4 className="text-white font-medium mb-2">
                                        {item.faceAnalysis?.faceShape || 'AI 스타일 분석'}
                                    </h4>

                                    {/* 추천 스타일 태그 */}
                                    <div className="flex gap-1 flex-wrap">
                                        {item.recommendedStyles.slice(0, 3).map((style, idx) => (
                                            <span key={idx} className="px-2 py-0.5 rounded bg-white/5 text-gray-500 text-xs">
                                                {style}
                                            </span>
                                        ))}
                                        {item.recommendedStyles.length > 3 && (
                                            <span className="text-gray-600 text-xs">+{item.recommendedStyles.length - 3}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 변화 트래킹 안내 */}
            {history.length >= 2 && (
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-violet-600/10 to-purple-600/10 border border-violet-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                            <i className="fas fa-chart-line text-violet-400"></i>
                        </div>
                        <div>
                            <h4 className="text-white font-medium text-sm">변화 트래킹 가능!</h4>
                            <p className="text-gray-500 text-xs">이전 기록과 비교하여 최적의 스타일을 찾아보세요</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
