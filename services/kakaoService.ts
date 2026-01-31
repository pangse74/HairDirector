// Kakao SDK 타입 선언
declare global {
    interface Window {
        Kakao: {
            init: (appKey: string) => void;
            isInitialized: () => boolean;
            Share: {
                sendDefault: (settings: KakaoShareSettings) => void;
            };
        };
    }
}

interface KakaoShareSettings {
    objectType: 'feed' | 'list' | 'location' | 'commerce' | 'text';
    content: {
        title: string;
        description: string;
        imageUrl: string;
        link: {
            mobileWebUrl: string;
            webUrl: string;
        };
    };
    buttons?: Array<{
        title: string;
        link: {
            mobileWebUrl: string;
            webUrl: string;
        };
    }>;
}

// 카카오 JavaScript 앱 키 (Kakao Developers에서 발급)
const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY || '';

let isInitialized = false;
let isLoading = false;

// 디버그 로그
console.log('🔑 카카오 앱 키 로드:', KAKAO_APP_KEY ? `${KAKAO_APP_KEY.substring(0, 8)}...` : '없음');

// 카카오 SDK 동적 로드
const loadKakaoSDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
        // 이미 로드됨
        if (typeof window !== 'undefined' && window.Kakao) {
            console.log('✅ 카카오 SDK 이미 로드됨');
            resolve(true);
            return;
        }

        // 이미 로딩 중
        if (isLoading) {
            // 로딩 완료 대기
            const checkInterval = setInterval(() => {
                if (window.Kakao) {
                    clearInterval(checkInterval);
                    resolve(true);
                }
            }, 100);
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve(false);
            }, 10000);
            return;
        }

        isLoading = true;
        console.log('📦 카카오 SDK 동적 로드 시작...');

        const script = document.createElement('script');
        script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js';
        script.async = true;

        script.onload = () => {
            console.log('✅ 카카오 SDK 로드 완료');
            isLoading = false;
            resolve(true);
        };

        script.onerror = (error) => {
            console.error('❌ 카카오 SDK 로드 실패:', error);
            isLoading = false;
            resolve(false);
        };

        document.head.appendChild(script);
    });
};

// 카카오 SDK 초기화 (비동기)
export const initKakao = async (): Promise<boolean> => {
    console.log('🚀 initKakao 호출됨');

    if (isInitialized) {
        console.log('  ✅ 이미 초기화됨');
        return true;
    }

    if (!KAKAO_APP_KEY) {
        console.warn('⚠️ 카카오 앱 키가 설정되지 않았습니다.');
        return false;
    }

    // SDK 동적 로드
    const sdkLoaded = await loadKakaoSDK();
    if (!sdkLoaded) {
        console.error('❌ 카카오 SDK 로드 실패');
        return false;
    }

    try {
        if (!window.Kakao.isInitialized()) {
            window.Kakao.init(KAKAO_APP_KEY);
            console.log('✅ 카카오 SDK 초기화 완료');
        } else {
            console.log('✅ 카카오 SDK 이미 초기화되어 있음');
        }
        isInitialized = true;
        return true;
    } catch (error) {
        console.error('❌ 카카오 SDK 초기화 실패:', error);
        return false;
    }
};

// 카카오톡 공유하기
export const shareKakao = async (options: {
    title: string;
    description: string;
    imageUrl?: string;
    url: string;
    buttonTitle?: string;
}): Promise<boolean> => {
    const { title, description, imageUrl, url, buttonTitle = '자세히 보기' } = options;

    console.log('🔄 shareKakao 호출됨:', { title, url });

    // SDK 초기화 시도 (비동기 대기)
    const initialized = await initKakao();
    if (!initialized) {
        console.error('❌ 카카오 SDK 초기화 실패');
        return false;
    }

    if (!window.Kakao || !window.Kakao.Share) {
        console.error('❌ 카카오 Share API를 사용할 수 없습니다.');
        return false;
    }

    // 이미지 URL 없이 테스트
    console.log('📤 카카오 공유 시도 (이미지 없음):', { title, description, url });

    try {
        // Kakao SDK v2는 Promise를 반환
        const response = await (window.Kakao.Share.sendDefault as (settings: KakaoShareSettings) => Promise<unknown>)({
            objectType: 'feed',
            content: {
                title,
                description,
                imageUrl: 'https://hairdirector.site/og-image.png',
                link: {
                    mobileWebUrl: url,
                    webUrl: url,
                },
            },
        });
        console.log('✅ 카카오 공유 응답:', response);
        return true;
    } catch (error: unknown) {
        // 상세 에러 정보 출력
        console.error('❌ 카카오톡 공유 실패:', error);
        if (error && typeof error === 'object') {
            console.error('❌ 에러 상세:', JSON.stringify(error, null, 2));
        }

        // 에러 메시지를 alert로 표시 (디버깅용)
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        alert(`카카오 공유 에러: ${errorMsg}`);

        return false;
    }
};

// 카카오 SDK 초기화 여부 확인
export const isKakaoReady = (): boolean => {
    return isInitialized && typeof window !== 'undefined' && window.Kakao?.isInitialized();
};
