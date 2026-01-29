import { HistoryItem, SavedStyle, StyleCategory } from '../types';

const HISTORY_KEY = 'hairfit_history';
const SAVED_KEY = 'hairfit_saved';
const MAX_HISTORY_ITEMS = 5; // 최대 히스토리 개수 제한 (고해상도 저장으로 인해 줄임)
const IMAGE_MAX_SIZE = 1200; // 이미지 최대 크기 (픽셀) - 고해상도 유지
const THUMBNAIL_SIZE = 300; // 리스트용 썸네일 크기

// ==================== 이미지 압축 유틸리티 ====================

// 이미지 압축 (고품질 유지)
export const compressImage = (base64Image: string, maxSize: number = IMAGE_MAX_SIZE, quality: number = 0.92): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;

            // 비율 계산
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // PNG로 저장하여 품질 손실 방지 (또는 고품질 JPEG)
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            // 오류 시 원본 반환
            resolve(base64Image);
        };
        img.src = base64Image;
    });
};

// 썸네일 생성 (리스트용)
export const createThumbnail = (base64Image: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;

            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > THUMBNAIL_SIZE) {
                    height = Math.round((height * THUMBNAIL_SIZE) / width);
                    width = THUMBNAIL_SIZE;
                }
            } else {
                if (height > THUMBNAIL_SIZE) {
                    width = Math.round((width * THUMBNAIL_SIZE) / height);
                    height = THUMBNAIL_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => resolve(base64Image);
        img.src = base64Image;
    });
};

// ==================== 히스토리 관련 함수 ====================

// 히스토리 전체 조회
export const getHistory = (): HistoryItem[] => {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

// 히스토리 아이템 추가 (고해상도 이미지 + 썸네일)
export const addHistoryItem = async (item: Omit<HistoryItem, 'id' | 'date'>): Promise<HistoryItem> => {
    try {
        // 고해상도 이미지 유지 (약간의 압축만)
        const highQualityOriginal = await compressImage(item.originalImage, IMAGE_MAX_SIZE);
        const highQualityResult = await compressImage(item.resultImage, IMAGE_MAX_SIZE);

        // 리스트용 썸네일 생성
        const originalThumbnail = await createThumbnail(item.originalImage);
        const resultThumbnail = await createThumbnail(item.resultImage);

        let history = getHistory(); // const에서 let으로 변경하여 재할당 가능하게 함
        const newItem: HistoryItem = {
            ...item,
            originalImage: highQualityOriginal,
            resultImage: highQualityResult,
            originalThumbnail,
            resultThumbnail,
            id: generateId(),
            date: new Date().toISOString(),
        };

        history.unshift(newItem);

        // 최대 개수 제한 (고해상도라 개수 줄임)
        let limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);

        // [FIFO] 용량 확보를 위한 반복 저장 시도
        // 최대 5번까지 오래된 항목을 하나씩 지우며 저장을 시도함
        for (let i = 0; i < 5; i++) {
            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
                // 저장 성공 시 반복문 탈출
                return newItem;
            } catch (e) {
                if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
                    console.warn(`⚠️ 저장 용량 부족 (시도 ${i + 1}/5). 가장 오래된 기록을 삭제하고 다시 시도합니다.`);

                    // 현재 저장하려는 목록에서 가장 오래된 것(마지막) 삭제 (단, 1개는 유지)
                    if (limitedHistory.length > 1) {
                        limitedHistory.pop();
                    } else {
                        // 1개도 저장이 안 되면 포기 (매우 큰 이미지 등)
                        console.error('❌ 용량 부족으로 히스토리 저장 실패 (단일 항목 용량 초과)');
                        throw e;
                    }
                } else {
                    // 용량 문제가 아닌 다른 에러면 즉시 throw
                    throw e;
                }
            }
        }

        return newItem;

    } catch (error) {
        console.error('Failed to add history item:', error);
        throw error;
    }
};

// 히스토리 아이템 삭제
export const deleteHistoryItem = (id: string): void => {
    const history = getHistory().filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

// 히스토리 좋아요 토글
export const toggleHistoryLike = (id: string): void => {
    const history = getHistory().map(item =>
        item.id === id ? { ...item, liked: !item.liked } : item
    );
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

// 히스토리 전체 삭제
export const clearHistory = (): void => {
    localStorage.removeItem(HISTORY_KEY);
};

// ==================== 저장됨 관련 함수 ====================

// 저장된 스타일 전체 조회
export const getSavedStyles = (): SavedStyle[] => {
    try {
        const data = localStorage.getItem(SAVED_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

// 카테고리별 저장된 스타일 조회
export const getSavedStylesByCategory = (category: StyleCategory): SavedStyle[] => {
    const saved = getSavedStyles();
    if (category === 'all') return saved;
    return saved.filter(item => item.category === category);
};

// 스타일 저장
export const saveStyle = (item: Omit<SavedStyle, 'id' | 'savedDate'>): SavedStyle => {
    const saved = getSavedStyles();

    // 중복 체크 (같은 videoId가 있으면 저장하지 않음)
    if (item.videoId && saved.some(s => s.videoId === item.videoId)) {
        const existing = saved.find(s => s.videoId === item.videoId)!;
        return existing;
    }

    const newItem: SavedStyle = {
        ...item,
        id: generateId(),
        savedDate: new Date().toISOString(),
    };
    saved.unshift(newItem);

    // 최대 20개 제한
    const limitedSaved = saved.slice(0, 20);

    try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(limitedSaved));
    } catch (e) {
        console.warn('Storage quota exceeded for saved styles');
        const reducedSaved = limitedSaved.slice(0, 10);
        localStorage.setItem(SAVED_KEY, JSON.stringify(reducedSaved));
    }

    return newItem;
};

// 저장된 스타일 삭제
export const deleteSavedStyle = (id: string): void => {
    const saved = getSavedStyles().filter(item => item.id !== id);
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
};

// 저장된 스타일 노트 업데이트
export const updateSavedStyleNotes = (id: string, notes: string): void => {
    const saved = getSavedStyles().map(item =>
        item.id === id ? { ...item, notes } : item
    );
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
};

// 저장된 스타일 카테고리 변경
export const updateSavedStyleCategory = (id: string, category: StyleCategory): void => {
    const saved = getSavedStyles().map(item =>
        item.id === id ? { ...item, category } : item
    );
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
};

// 저장 전체 삭제
export const clearSaved = (): void => {
    localStorage.removeItem(SAVED_KEY);
};

// ==================== 유틸리티 함수 ====================

// 고유 ID 생성
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 날짜 포맷팅 (한국어)
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
};

// 상세 날짜 포맷팅
export const formatDateFull = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    });
};

// localStorage 용량 확인 (디버깅용)
export const getStorageUsage = (): { used: string; available: string } => {
    let total = 0;
    for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage.getItem(key)?.length || 0;
        }
    }
    const usedMB = (total / (1024 * 1024)).toFixed(2);
    return {
        used: `${usedMB} MB`,
        available: '~5 MB'
    };
};
