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
                successUrl: `${window.location.origin}?checkout=success`,
                cancelUrl: `${window.location.origin}?checkout=cancel`,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
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
export function savePremiumStatus(email?: string): void {
    try {
        const status = {
            isPremium: true,
            purchaseDate: new Date().toISOString(),
            email,
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
export function checkPaymentCallback(): 'success' | 'cancel' | null {
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutStatus = urlParams.get('checkout');

    if (checkoutStatus === 'success' || checkoutStatus === 'cancel') {
        // URL에서 쿼리 파라미터 제거
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        return checkoutStatus;
    }

    return null;
}
