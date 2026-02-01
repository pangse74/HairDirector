import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    text: string;
    url: string;
    imageUrl?: string;
}

// 이미지를 압축하여 Blob으로 변환
const compressImage = (imageSrc: string, maxWidth: number = 800, quality: number = 0.7): Promise<Blob | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        if (!imageSrc.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(null);
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => resolve(blob),
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => resolve(null);
        img.src = imageSrc;
    });
};

// 이미지 URL을 File 객체로 변환
const imageUrlToFile = async (imageUrl: string, fileName: string = 'hairstyle-result.jpg'): Promise<File | null> => {
    try {
        if (imageUrl.startsWith('data:')) {
            const blob = await compressImage(imageUrl);
            if (blob) {
                return new File([blob], fileName, { type: 'image/jpeg' });
            }
            const response = await fetch(imageUrl);
            const originalBlob = await response.blob();
            return new File([originalBlob], fileName, { type: originalBlob.type || 'image/png' });
        }

        const fullUrl = imageUrl.startsWith('/') ? window.location.origin + imageUrl : imageUrl;
        const response = await fetch(fullUrl, { mode: 'cors' });
        if (!response.ok) return null;

        const blob = await response.blob();
        return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
    } catch (error) {
        console.error('이미지 변환 실패:', error);
        return null;
    }
};

// 네이티브 파일 공유 지원 여부 확인
const canShareFiles = (): boolean => {
    if (!navigator.canShare) return false;
    try {
        const testFile = new File(['test'], 'test.png', { type: 'image/png' });
        return navigator.canShare({ files: [testFile] });
    } catch {
        return false;
    }
};

export const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    title,
    text,
    url,
    imageUrl
}) => {
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [supportsNativeShare, setSupportsNativeShare] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSupportsNativeShare(canShareFiles());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const fullText = `${title}\n\n${text}\n\n${url}`;

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2500);
    };

    // 네이티브 공유
    const handleNativeShare = async () => {
        if (isSharing) return;
        setIsSharing(true);

        try {
            if (navigator.share) {
                // 이미지 공유 시도
                if (imageUrl && supportsNativeShare) {
                    const file = await imageUrlToFile(imageUrl, 'hairdirector-result.jpg');

                    if (file && file.size > 0 && file.size < 5 * 1024 * 1024) {
                        try {
                            if (navigator.canShare({ files: [file] })) {
                                await navigator.share({
                                    title: title,
                                    text: text,
                                    files: [file]
                                });
                                onClose();
                                return;
                            }
                        } catch (fileShareError) {
                            console.log('이미지 공유 실패, URL 공유로 폴백');
                        }
                    }
                }

                // URL 공유
                await navigator.share({ title, text, url });
                onClose();
                return;
            }

            // 네이티브 공유 미지원 시
            await navigator.clipboard.writeText(fullText);
            showToast('클립보드에 복사되었습니다!');
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                await navigator.clipboard.writeText(fullText);
                showToast('클립보드에 복사되었습니다!');
            }
        } finally {
            setIsSharing(false);
        }
    };

    // 링크 복사
    const handleCopy = async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        showToast('링크가 복사되었습니다!');
        setTimeout(() => setCopied(false), 2000);
    };

    const modal = (
        <>
            {/* 오버레이 */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    zIndex: 99998,
                }}
            />

            {/* 모달 */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#1a1a24',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    zIndex: 99999,
                    padding: '20px',
                    maxWidth: '500px',
                    margin: '0 auto',
                }}
            >
                {/* 핸들 바 */}
                <div style={{
                    width: '40px',
                    height: '4px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '2px',
                    margin: '0 auto 20px'
                }} />

                {/* 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px', margin: 0 }}>공유하기</h3>
                    <button
                        onClick={onClose}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#999',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* 안내 메시지 */}
                {supportsNativeShare && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        border: '1px solid rgba(124, 58, 237, 0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-image" style={{ color: '#a855f7' }}></i>
                            <span style={{ color: '#ccc', fontSize: '13px' }}>
                                이미지와 함께 공유할 수 있어요!
                            </span>
                        </div>
                    </div>
                )}

                {/* 공유 버튼 */}
                <button
                    onClick={handleNativeShare}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        handleNativeShare();
                    }}
                    disabled={isSharing}
                    style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: isSharing ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginBottom: '16px',
                        opacity: isSharing ? 0.7 : 1,
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                    }}
                >
                    {isSharing ? (
                        <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                        <i className="fas fa-share-from-square"></i>
                    )}
                    {isSharing ? '공유 중...' : '공유하기'}
                </button>

                {/* URL 복사 */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                    }}
                >
                    <input
                        type="text"
                        value={url}
                        readOnly
                        style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ccc',
                            fontSize: '14px',
                            outline: 'none',
                        }}
                    />
                    <button
                        onClick={handleCopy}
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            handleCopy();
                        }}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            backgroundColor: copied ? '#22c55e' : '#7c3aed',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '500',
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                        }}
                    >
                        {copied ? '복사됨!' : '복사'}
                    </button>
                </div>
            </div>

            {/* 토스트 */}
            {toast && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '150px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#333',
                        color: '#fff',
                        padding: '12px 24px',
                        borderRadius: '999px',
                        zIndex: 100000,
                    }}
                >
                    {toast}
                </div>
            )}
        </>
    );

    return createPortal(modal, document.body);
};
