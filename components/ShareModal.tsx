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

const SHARE_OPTIONS: ShareOption[] = [
    { id: 'kakao', name: '카카오톡', icon: 'fas fa-comment', color: '#3C1E1E', bgColor: '#FEE500' },
    { id: 'facebook', name: '페이스북', icon: 'fab fa-facebook-f', color: '#fff', bgColor: '#1877F2' },
    { id: 'twitter', name: 'X', icon: 'fab fa-x-twitter', color: '#fff', bgColor: '#000000' },
    { id: 'instagram', name: '인스타그램', icon: 'fab fa-instagram', color: '#fff', bgColor: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)' },
    { id: 'telegram', name: '텔레그램', icon: 'fab fa-telegram', color: '#fff', bgColor: '#0088CC' },
    { id: 'tiktok', name: '틱톡', icon: 'fab fa-tiktok', color: '#fff', bgColor: '#000000' },
    { id: 'copy', name: '링크 복사', icon: 'fas fa-link', color: '#fff', bgColor: '#6B7280' },
    { id: 'more', name: '더보기', icon: 'fas fa-share-nodes', color: '#fff', bgColor: '#374151' },
];

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

    useEffect(() => {
        if (isOpen) {
            const init = async () => {
                const result = await initKakao();
                setKakaoReady(result);
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

    const handleShare = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔄 공유 클릭:', id);
        switch (id) {
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
                await navigator.clipboard.writeText(fullText);
                showToast('클립보드에 복사됨!');
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
            case 'more':
                if (navigator.share) {
                    await navigator.share({ title, text, url });
                }
                break;
        }
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
                    padding: '16px',
                    maxWidth: '500px',
                    margin: '0 auto',
                }}
            >
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

                {/* 공유 옵션 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    {SHARE_OPTIONS.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={(e) => handleShare(e, opt.id)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
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
                                }}
                            >
                                <i className={opt.icon} style={{ fontSize: '20px' }}></i>
                            </div>
                            <span style={{ color: '#ccc', fontSize: '12px' }}>{opt.name}</span>
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
