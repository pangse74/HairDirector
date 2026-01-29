// Polar.sh 결제 서비스
// https://polar.sh - Merchant of Record 서비스

export interface CheckoutSession {
    url: string;
    id: string;
}

export interface PremiumStatus {
    isPremium: boolean;
    purchaseDate?: string;
    email?: string;
    checkoutId?: string; // 환불용 주문 ID
}

const PREMIUM_STORAGE_KEY = 'hairfit_premium_status';

/**
 * Polar.sh 체크아웃 세션 생성
 */
export async function createCheckoutSession(email?: string): Promise<CheckoutSession> {
    try {
        const response = await fetch('/api/checkout/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                successUrl: `${window.location.origin}?checkout=success&checkout_id={CHECKOUT_ID}`, // {CHECKOUT_ID}는 Polar가 치환해줌 (지원 시)
                cancelUrl: `${window.location.origin}?checkout=cancel`,
            }),
        });

        if (!response.ok) {
            const error = await response.json() as { details?: string; message?: string };
            console.error('Polar API Error Details:', error);
            throw new Error(error.details || error.message || '결제 세션 생성에 실패했습니다.');
        }

        return await response.json();
    } catch (error) {
        console.error('Checkout session creation failed:', error);
        throw error;
    }
}

/**
 * 프리미엄 상태 확인 (로컬 스토리지 기반)
 */
export function getPremiumStatus(): PremiumStatus {
    try {
        const stored = localStorage.getItem(PREMIUM_STORAGE_KEY);
        if (stored) {
            const status = JSON.parse(stored);
            return {
                isPremium: true,
                purchaseDate: status.purchaseDate,
                email: status.email,
                checkoutId: status.checkoutId,
            };
        }
    } catch (error) {
        console.error('Failed to get premium status:', error);
    }

    return { isPremium: false };
}

/**
 * 프리미엄 상태 저장
 */
export function savePremiumStatus(email?: string, checkoutId?: string): void {
    try {
        const status: PremiumStatus = {
            isPremium: true,
            purchaseDate: new Date().toISOString(),
            email,
            checkoutId,
        };
        localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(status));
    } catch (error) {
        console.error('Failed to save premium status:', error);
    }
}

/**
 * 프리미엄 상태 제거 (테스트/디버깅용)
 */
export function clearPremiumStatus(): void {
    try {
        localStorage.removeItem(PREMIUM_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear premium status:', error);
    }
}

/**
 * URL 쿼리 파라미터에서 결제 상태 확인
 */
export function checkPaymentCallback(): { status: 'success', checkoutId?: string } | { status: 'cancel' } | null {
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutStatus = urlParams.get('checkout');

    // 중복 처리 방지 (새로고침 시 등)
    const SESSION_KEY = 'hairfit_checkout_processed';
    const isProcessed = sessionStorage.getItem(SESSION_KEY);

    if (checkoutStatus === 'success') {
        if (isProcessed) {
            // 이미 처리된 결제 건이면 URL만 정리하고 무시
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            return null;
        }

        // URL에서 checkout_id 추출 (Polar가 보통 반환해줌, 없으면 null)
        // 실제로는 Polar 리다이렉트 시 checkout_id 파라미터가 있을 수 있음
        const checkoutId = urlParams.get('checkout_id') || undefined;

        // 처리 완료 플래그 설정
        sessionStorage.setItem(SESSION_KEY, 'true');

        // URL 정리
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        // checkoutId도 반환하여 저장할 수 있게 함
        return { status: 'success', checkoutId };
    } else if (checkoutStatus === 'cancel') {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        return { status: 'cancel' };
    }

    return null;
}
