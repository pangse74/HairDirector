import React, { useState, useEffect } from 'react';
import { SavedStyle, StyleCategory, categoryLabels } from '../types';
import { getSavedStyles, deleteSavedStyle, updateSavedStyleCategory, updateSavedStyleNotes, formatDate, clearSaved } from '../services/storageService';

interface SavedViewProps {
    onCompare?: (items: SavedStyle[]) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({ onCompare }) => {
    const [savedStyles, setSavedStyles] = useState<SavedStyle[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<StyleCategory>('all');
    const [selectedItem, setSelectedItem] = useState<SavedStyle | null>(null);
    const [compareMode, setCompareMode] = useState(false);
    const [compareItems, setCompareItems] = useState<string[]>([]);
    const [editNotes, setEditNotes] = useState<string>('');
    const [showNoteEditor, setShowNoteEditor] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const categories: StyleCategory[] = ['all', 'cut', 'perm', 'color'];

    useEffect(() => {
        loadSaved();
    }, []);

    const loadSaved = () => {
        setSavedStyles(getSavedStyles());
    };

    const filteredStyles = selectedCategory === 'all'
        ? savedStyles
        : savedStyles.filter(s => s.category === selectedCategory);

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        deleteSavedStyle(id);
        loadSaved();
        if (selectedItem?.id === id) setSelectedItem(null);
    };

    const handleCategoryChange = (id: string, category: StyleCategory) => {
        updateSavedStyleCategory(id, category);
        loadSaved();
    };

    const handleSaveNotes = () => {
        if (selectedItem) {
            updateSavedStyleNotes(selectedItem.id, editNotes);
            loadSaved();
            setShowNoteEditor(false);
            setSelectedItem({ ...selectedItem, notes: editNotes });
        }
    };

    const toggleCompareItem = (id: string) => {
        if (compareItems.includes(id)) {
            setCompareItems(compareItems.filter(i => i !== id));
        } else if (compareItems.length < 4) {
            setCompareItems([...compareItems, id]);
        }
    };

    // Base64를 Blob으로 변환하는 유틸리티 함수
    const base64ToBlob = (base64: string): Blob => {
        try {
            const parts = base64.split(';base64,');
            const contentType = parts[0].split(':')[1] || 'image/png';
            const raw = window.atob(parts[1]);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);

            for (let i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }

            return new Blob([uInt8Array], { type: contentType });
        } catch (e) {
            console.error('Base64 변환 오류:', e);
            throw e;
        }
    };

    // 이미지 다운로드 함수
    const handleDownloadImage = async (item: SavedStyle) => {
        try {
            setIsDownloading(true);

            const imageUrl = item.thumbnail;

            // 이미지가 없는 경우
            if (!imageUrl) {
                alert('저장할 이미지가 없습니다.');
                setIsDownloading(false);
                return;
            }

            const fileName = `${item.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${Date.now()}`;

            // Base64 이미지인 경우 Blob으로 변환하여 다운로드
            if (imageUrl.startsWith('data:')) {
                try {
                    const blob = base64ToBlob(imageUrl);
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${fileName}.png`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();

                    // cleanup
                    setTimeout(() => {
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    }, 200);

                    alert('이미지가 저장되었습니다! 📥');
                } catch (e) {
                    console.error('Blob 변환 실패, 직접 다운로드 시도:', e);
                    // 폴백: 직접 a 태그로 다운로드
                    const link = document.createElement('a');
                    link.href = imageUrl;
                    link.download = `${fileName}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    alert('이미지가 저장되었습니다! 📥');
                }
                setIsDownloading(false);
                return;
            }

            // URL 이미지인 경우
            try {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${fileName}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                alert('이미지가 저장되었습니다! 📥');
            } catch {
                window.open(imageUrl, '_blank');
                alert('새 탭에서 이미지가 열렸습니다. 마우스 오른쪽 버튼 → 다른 이름으로 이미지 저장을 선택하세요.');
            }

            setIsDownloading(false);
        } catch (error) {
            console.error('다운로드 실패:', error);
            alert('이미지 다운로드에 실패했습니다. 다시 시도해주세요.');
            setIsDownloading(false);
        }
    };

    // 비교 모드 UI
    const renderCompareView = () => {
        const items = savedStyles.filter(s => compareItems.includes(s.id));
        return (
            <div className="w-full max-w-md mx-auto animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => { setCompareMode(false); setCompareItems([]); }}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <i className="fas fa-arrow-left"></i>
                        <span>비교 종료</span>
                    </button>
                    <span className="text-violet-400 text-sm">{compareItems.length}개 선택됨</span>
                </div>

                <h3 className="text-white font-bold text-lg mb-4">스타일 비교</h3>

                <div className={`grid gap-3 ${items.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    {items.map((item) => (
                        <div key={item.id} className="glass-card-dark p-3">
                            {item.type === 'video' && item.videoId ? (
                                <div className="aspect-[9/16] rounded-xl overflow-hidden bg-black mb-2">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${item.videoId}`}
                                        title={item.title}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="w-full aspect-square rounded-xl object-cover mb-2"
                                />
                            )}
                            <p className="text-white text-sm font-medium truncate">{item.title}</p>
                            <span className="text-gray-500 text-xs">{categoryLabels[item.category]}</span>
                        </div>
                    ))}
                </div>

                {items.length >= 2 && (
                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30">
                        <p className="text-center text-gray-300 text-sm">
                            💡 오늘 내 기분에는 어떤 스타일이 더 어울릴까요?
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // 상세 보기
    if (selectedItem) {
        return (
            <div className="w-full max-w-md mx-auto animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setSelectedItem(null)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <i className="fas fa-arrow-left"></i>
                        <span>뒤로</span>
                    </button>
                    <button
                        onClick={(e) => { handleDelete(selectedItem.id, e); setSelectedItem(null); }}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </div>

                {/* 미리보기 */}
                <div className="mb-4">
                    {selectedItem.type === 'video' && selectedItem.videoId ? (
                        <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-black max-h-[400px]">
                            <iframe
                                src={`https://www.youtube.com/embed/${selectedItem.videoId}`}
                                title={selectedItem.title}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    ) : (
                        <img
                            src={selectedItem.thumbnail}
                            alt={selectedItem.title}
                            className="w-full rounded-2xl object-cover"
                        />
                    )}
                </div>

                {/* 정보 */}
                <div className="glass-card-dark p-5 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-bold text-lg">{selectedItem.title}</h3>
                        {selectedItem.isPro && (
                            <span className="px-2 py-1 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold">
                                PRO
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 text-sm mb-4">{formatDate(selectedItem.savedDate)}에 저장됨</p>

                    {/* 카테고리 선택 */}
                    <div className="mb-4">
                        <span className="text-gray-400 text-sm block mb-2">카테고리</span>
                        <div className="flex gap-2">
                            {(['cut', 'perm', 'color'] as StyleCategory[]).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(selectedItem.id, cat)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedItem.category === cat
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {categoryLabels[cat]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 노트 */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">메모</span>
                            <button
                                onClick={() => { setEditNotes(selectedItem.notes || ''); setShowNoteEditor(true); }}
                                className="text-violet-400 text-sm hover:text-violet-300"
                            >
                                <i className="fas fa-edit mr-1"></i>편집
                            </button>
                        </div>
                        {showNoteEditor ? (
                            <div>
                                <textarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    placeholder="미용실 방문 전 메모를 남겨보세요..."
                                    className="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white text-sm resize-none h-24 focus:outline-none focus:border-violet-500"
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={handleSaveNotes}
                                        className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm"
                                    >
                                        저장
                                    </button>
                                    <button
                                        onClick={() => setShowNoteEditor(false)}
                                        className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-sm"
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">
                                {selectedItem.notes || '메모가 없습니다.'}
                            </p>
                        )}
                    </div>
                </div>

                {/* 미용실 상담 카드 (PRO) */}
                {selectedItem.isPro && selectedItem.type === 'blueprint' && (
                    <div className="glass-card-dark p-5 mb-4 border border-amber-500/30">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                                <i className="fas fa-scroll text-white"></i>
                            </div>
                            <div>
                                <h4 className="text-white font-bold">전문 시술 지시서</h4>
                                <p className="text-gray-500 text-xs">미용실에서 보여주세요</p>
                            </div>
                        </div>
                        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold">
                            <i className="fas fa-share-alt mr-2"></i>디자이너에게 공유
                        </button>
                    </div>
                )}

                {/* 액션 버튼 - 비디오가 아닌 경우만 표시 */}
                {selectedItem.type !== 'video' && selectedItem.thumbnail && (
                    <a
                        href={selectedItem.thumbnail}
                        download={`${selectedItem.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${Date.now()}.png`}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-download"></i>
                        <span>이미지 저장</span>
                    </a>
                )}
            </div>
        );
    }

    // 비교 모드
    if (compareMode && compareItems.length > 0) {
        return renderCompareView();
    }

    // 리스트 뷰
    return (
        <div className="w-full max-w-md mx-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-white font-bold text-xl">저장됨</h2>
                    <p className="text-gray-500 text-sm mt-1">나만의 디지털 스타일북</p>
                </div>
                {savedStyles.length >= 2 && (
                    <button
                        onClick={() => setCompareMode(!compareMode)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${compareMode
                            ? 'bg-violet-600 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        <i className="fas fa-columns mr-2"></i>비교
                    </button>
                )}
            </div>

            {/* 카테고리 탭 */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                            ? 'bg-violet-600 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        {categoryLabels[cat]}
                        {cat !== 'all' && (
                            <span className="ml-1 opacity-60">
                                ({savedStyles.filter(s => s.category === cat).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* 저장된 스타일 그리드 */}
            {filteredStyles.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-bookmark text-3xl text-gray-600"></i>
                    </div>
                    <h3 className="text-gray-400 font-medium mb-2">
                        {selectedCategory === 'all' ? '저장된 스타일이 없어요' : `${categoryLabels[selectedCategory]} 스타일이 없어요`}
                    </h3>
                    <p className="text-gray-600 text-sm">마음에 드는 스타일을 저장해 보세요!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {filteredStyles.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => compareMode ? toggleCompareItem(item.id) : setSelectedItem(item)}
                            className={`glass-card-dark p-3 cursor-pointer transition-all group relative ${compareMode && compareItems.includes(item.id)
                                ? 'ring-2 ring-violet-500'
                                : 'hover:bg-white/10'
                                }`}
                        >
                            {/* 비교 체크 */}
                            {compareMode && (
                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10 ${compareItems.includes(item.id)
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-black/50 text-gray-400 border border-white/20'
                                    }`}>
                                    {compareItems.includes(item.id) && <i className="fas fa-check text-xs"></i>}
                                </div>
                            )}

                            {/* 썸네일 */}
                            {item.type === 'video' && item.videoId ? (
                                <div className="aspect-[9/16] rounded-xl overflow-hidden bg-black mb-2 relative">
                                    <img
                                        src={`https://img.youtube.com/vi/${item.videoId}/0.jpg`}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                        <i className="fas fa-play text-white text-2xl"></i>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="w-full aspect-square rounded-xl object-cover mb-2"
                                />
                            )}

                            {/* 정보 */}
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                                    <span className="text-gray-500 text-xs">{categoryLabels[item.category]}</span>
                                </div>
                                {item.isPro && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold">
                                        PRO
                                    </span>
                                )}
                            </div>

                            {/* 삭제 버튼 */}
                            {!compareMode && (
                                <button
                                    onClick={(e) => handleDelete(item.id, e)}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-gray-400 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <i className="fas fa-trash-alt text-xs"></i>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 비교 모드 플로팅 버튼 */}
            {compareMode && compareItems.length >= 2 && (
                <div className="fixed bottom-24 left-0 right-0 px-5 z-30">
                    <button
                        onClick={() => {/* 비교 뷰 표시 */ }}
                        className="w-full max-w-md mx-auto py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-balance-scale"></i>
                        {compareItems.length}개 스타일 비교하기
                    </button>
                </div>
            )}
        </div>
    );
};
