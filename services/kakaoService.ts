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

    // imageUrl이 base64인 경우 기본 OG 이미지 사용
    const finalImageUrl = imageUrl && !imageUrl.startsWith('data:')
        ? imageUrl
        : 'https://hairdirector.site/og-image.png';

    console.log('📤 카카오 공유 시도:', { title, description, finalImageUrl, url });

    try {
        window.Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title,
                description,
                imageUrl: finalImageUrl,
                link: {
                    mobileWebUrl: url,
                    webUrl: url,
                },
            },
            buttons: [
                {
                    title: buttonTitle,
                    link: {
                        mobileWebUrl: url,
                        webUrl: url,
                    },
                },
            ],
            serverCallbackArgs: {
                key: 'value'
            },
            installTalk: true,
            callback: () => {
                console.log('✅ 카카오 공유 콜백 - 성공');
            },
            fail: (error: unknown) => {
                console.error('❌ 카카오 공유 콜백 - 실패:', error);
            }
        } as KakaoShareSettings & { serverCallbackArgs?: object; installTalk?: boolean; callback?: () => void; fail?: (error: unknown) => void });
        console.log('✅ 카카오 공유 요청 완료');
        return true;
    } catch (error) {
        console.error('❌ 카카오톡 공유 실패:', error);
        return false;
    }
};

// 카카오 SDK 초기화 여부 확인
export const isKakaoReady = (): boolean => {
    return isInitialized && typeof window !== 'undefined' && window.Kakao?.isInitialized();
};
