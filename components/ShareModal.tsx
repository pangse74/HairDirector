import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { initKakao, shareKakao } from '../services/kakaoService';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    text: string;
    url: string;
    imageUrl?: string;
}

interface ShareOption {
    id: string;
    name: string;
    icon: string;
    color: string;
    bgColor: string;
}

// 이미지를 압축하여 Blob으로 변환 (카카오톡 등에서 공유 가능하도록)
const compressImage = (imageSrc: string, maxWidth: number = 800, quality: number = 0.7): Promise<Blob | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        // base64는 crossOrigin 불필요, URL만 필요
        if (!imageSrc.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // 최대 너비로 리사이즈
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
                (blob) => {
                    console.log('✅ 이미지 압축 완료:', blob?.size, 'bytes');
                    resolve(blob);
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => {
            console.error('❌ 이미지 로드 실패');
            resolve(null);
        };

        img.src = imageSrc;
    });
};

// 이미지 URL(base64 포함)을 File 객체로 변환
const imageUrlToFile = async (imageUrl: string, fileName: string = 'hairstyle-result.jpg'): Promise<File | null> => {
    try {
        console.log('📸 이미지 변환 시작:', imageUrl.substring(0, 50) + '...');

        // base64 데이터인 경우 - 압축 후 변환
        if (imageUrl.startsWith('data:')) {
            const blob = await compressImage(imageUrl);
            if (blob) {
                console.log('✅ Base64 이미지 압축 변환 성공, 크기:', blob.size);
                return new File([blob], fileName, { type: 'image/jpeg' });
            }

            // 압축 실패 시 원본 사용
            const response = await fetch(imageUrl);
            const originalBlob = await response.blob();
            console.log('⚠️ 압축 실패, 원본 사용:', originalBlob.size);
            return new File([originalBlob], fileName, { type: originalBlob.type || 'image/png' });
        }

        // 일반 URL인 경우 - 절대 경로로 변환
        const fullUrl = imageUrl.startsWith('/') ? window.location.origin + imageUrl : imageUrl;
        console.log('🔗 Fetch URL:', fullUrl);

        const response = await fetch(fullUrl, { mode: 'cors' });
        if (!response.ok) {
            console.error('❌ 이미지 fetch 실패:', response.status);
            return null;
        }

        const blob = await response.blob();
        console.log('✅ URL 이미지 변환 성공, 크기:', blob.size, '타입:', blob.type);

        // blob 타입이 없으면 JPEG로 설정
        const mimeType = blob.type || 'image/jpeg';
        return new File([blob], fileName, { type: mimeType });
    } catch (error) {
        console.error('❌ 이미지 변환 실패:', error);
        return null;
    }
};

// 네이티브 파일 공유 지원 여부 확인
const canShareFiles = (): boolean => {
    if (!navigator.canShare) return false;

    // 테스트용 더미 파일로 확인
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
    const [kakaoReady, setKakaoReady] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [supportsNativeShare, setSupportsNativeShare] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const init = async () => {
                const result = await initKakao();
                setKakaoReady(result);
                setSupportsNativeShare(canShareFiles());
            };
            init();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const shareText = `${title}\n\n${text}`;
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(url);
    const fullText = `${shareText}\n\n${url}`;

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2500);
    };

    // 네이티브 이미지 공유 (핵심 기능)
    const handleNativeShare = async () => {
        if (isSharing) return;
        setIsSharing(true);

        // 디버그 정보 수집
        const debugInfo = {
            hasNavigatorShare: !!navigator.share,
            hasNavigatorCanShare: !!navigator.canShare,
            supportsNativeShare,
            imageUrlType: imageUrl ? (imageUrl.startsWith('data:') ? 'base64' : 'url') : 'none',
        };
        console.log('🚀 네이티브 공유 시작:', debugInfo);

        try {
            // 먼저 URL만 공유 시도 (가장 안정적)
            if (navigator.share) {
                console.log('🔗 URL 공유 시도...');

                // 이미지가 있고 파일 공유 가능한 경우 - 이미지 포함
                if (imageUrl && supportsNativeShare) {
                    console.log('📸 이미지 파일 변환 시도...');
                    const file = await imageUrlToFile(imageUrl, 'hairdirector-result.jpg');

                    if (file && file.size > 0 && file.size < 5 * 1024 * 1024) { // 5MB 이하만
                        console.log('📁 파일 생성됨:', file.name, file.size, 'bytes');

                        try {
                            if (navigator.canShare({ files: [file] })) {
                                await navigator.share({
                                    title: title,
                                    text: text,
                                    files: [file]
                                });
                                console.log('✅ 이미지 공유 성공');
                                onClose();
                                return;
                            }
                        } catch (fileShareError) {
                            console.log('⚠️ 이미지 공유 실패, URL 공유로 폴백:', fileShareError);
                        }
                    }
                }

                // 이미지 공유 실패 시 URL만 공유
                await navigator.share({ title, text, url });
                console.log('✅ URL 공유 성공');
                onClose();
                return;
            }

            // navigator.share 미지원 시 - 클립보드 복사
            console.log('📋 navigator.share 미지원, 클립보드 복사');
            await navigator.clipboard.writeText(fullText);
            showToast('클립보드에 복사되었습니다!');
        } catch (error: any) {
            // 사용자가 공유 취소한 경우
            if (error.name === 'AbortError') {
                console.log('👤 사용자가 공유를 취소했습니다.');
            } else {
                console.error('❌ 공유 실패:', error);
                // 폴백: 클립보드 복사
                try {
                    await navigator.clipboard.writeText(fullText);
                    showToast('클립보드에 복사되었습니다!');
                } catch (clipboardError) {
                    console.error('클립보드 복사도 실패:', clipboardError);
                    showToast('공유에 실패했습니다.');
                }
            }
        } finally {
            setIsSharing(false);
        }
    };

    const handleShare = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔄 공유 클릭:', id);

        switch (id) {
            case 'native':
                await handleNativeShare();
                break;
            case 'kakao':
                if (kakaoReady) {
                    console.log('🔄 카카오 공유 시도...');
                    const success = await shareKakao({ title, description: text, imageUrl, url, buttonTitle: '나도 분석받기' });
                    if (!success) {
                        console.log('❌ 카카오 공유 실패, 클립보드로 대체');
                        await navigator.clipboard.writeText(fullText);
                        showToast('카카오 공유 실패. 클립보드에 복사됨!');
                    }
                } else {
                    console.log('⚠️ 카카오 SDK 준비 안됨, 클립보드 복사');
                    await navigator.clipboard.writeText(fullText);
                    showToast('클립보드에 복사됨!');
                }
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
                break;
            case 'instagram':
            case 'tiktok':
                // 인스타/틱톡은 네이티브 공유로 유도
                await handleNativeShare();
                break;
            case 'telegram':
                window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank');
                break;
            case 'copy':
                await navigator.clipboard.writeText(fullText);
                setCopied(true);
                showToast('링크가 복사되었습니다!');
                setTimeout(() => setCopied(false), 2000);
                break;
        }
    };

    // 공유 옵션 목록 (네이티브 공유를 첫 번째로)
    const SHARE_OPTIONS: ShareOption[] = [
        { id: 'native', name: '공유하기', icon: 'fas fa-share-from-square', color: '#fff', bgColor: 'linear-gradient(135deg, #7c3aed, #a855f7)' },
        { id: 'kakao', name: '카카오톡', icon: 'fas fa-comment', color: '#3C1E1E', bgColor: '#FEE500' },
        { id: 'instagram', name: '인스타그램', icon: 'fab fa-instagram', color: '#fff', bgColor: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)' },
        { id: 'facebook', name: '페이스북', icon: 'fab fa-facebook-f', color: '#fff', bgColor: '#1877F2' },
        { id: 'twitter', name: 'X', icon: 'fab fa-x-twitter', color: '#fff', bgColor: '#000000' },
        { id: 'telegram', name: '텔레그램', icon: 'fab fa-telegram', color: '#fff', bgColor: '#0088CC' },
        { id: 'tiktok', name: '틱톡', icon: 'fab fa-tiktok', color: '#fff', bgColor: '#000000' },
        { id: 'copy', name: '링크 복사', icon: 'fas fa-link', color: '#fff', bgColor: '#6B7280' },
    ];

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
                    padding: '16px',
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
                    margin: '0 auto 16px'
                }} />

                {/* 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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

                {/* 네이티브 공유 지원 안내 */}
                {supportsNativeShare && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        borderRadius: '12px',
                        marginBottom: '16px',
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

                {/* 공유 옵션 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    {SHARE_OPTIONS.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={(e) => handleShare(e, opt.id)}
                            disabled={isSharing && opt.id === 'native'}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: isSharing && opt.id === 'native' ? 'wait' : 'pointer',
                                opacity: isSharing && opt.id === 'native' ? 0.6 : 1,
                            }}
                        >
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: opt.bgColor,
                                    color: opt.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: opt.id === 'native' ? '0 4px 12px rgba(124, 58, 237, 0.4)' : 'none',
                                }}
                            >
                                {isSharing && opt.id === 'native' ? (
                                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px' }}></i>
                                ) : (
                                    <i className={opt.icon} style={{ fontSize: '20px' }}></i>
                                )}
                            </div>
                            <span style={{
                                color: opt.id === 'native' ? '#a855f7' : '#ccc',
                                fontSize: '12px',
                                fontWeight: opt.id === 'native' ? 'bold' : 'normal'
                            }}>
                                {opt.name}
                            </span>
                        </button>
                    ))}
                </div>

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
                        onClick={(e) => handleShare(e, 'copy')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            backgroundColor: copied ? '#22c55e' : '#7c3aed',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '500',
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
                        bottom: '200px',
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

    // Portal로 body에 렌더링
    return createPortal(modal, document.body);
};
