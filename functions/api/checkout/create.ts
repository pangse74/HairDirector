// Cloudflare Pages Functions - Polar.sh 체크아웃 세션 생성 API
// 이 함수는 /api/checkout/create 경로에서 실행됩니다.

interface Env {
    POLAR_ACCESS_TOKEN: string;
    POLAR_PRODUCT_ID: string;
    POLAR_ENV?: string;
}

interface RequestBody {
    email?: string;
    successUrl: string;
    cancelUrl: string;
}

// CORS 및 캐시 방지 헤더
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // POST 외의 메서드 거부
    if (request.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        // 환경변수 확인
        const accessToken = env.POLAR_ACCESS_TOKEN?.trim();
        const productId = env.POLAR_PRODUCT_ID?.trim();

        if (!accessToken || !productId) {
            console.error('Missing Polar.sh configuration');
            return new Response(
                JSON.stringify({ error: 'Payment service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 요청 본문 파싱
        const body = await request.json() as RequestBody;
        const { email, successUrl, cancelUrl } = body;

        if (!successUrl || !cancelUrl) {
            return new Response(
                JSON.stringify({ error: 'Success and cancel URLs are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Polar.sh 체크아웃 세션 생성
        // API 문서: https://polar.sh/docs/api-reference/checkouts/create-session
        // Polar.sh API 엔드포인트 설정
        // 기본값은 프로덕션(api.polar.sh)입니다.
        // 샌드박스 토큰(polar_sand_...)을 사용하는 경우 자동으로 샌드박스 URL로 전환하거나
        // 환경변수 POLAR_ENV=sandbox 로 명시할 수 있습니다.
        const isSandbox = accessToken.startsWith('polar_est_') || env.POLAR_ENV === 'sandbox';
        const polarApiUrl = isSandbox
            ? 'https://sandbox-api.polar.sh/v1/checkouts/'
            : 'https://api.polar.sh/v1/checkouts/';

        console.log(`Using Polar API: ${polarApiUrl} (Token prefix: ${accessToken.substring(0, 10)}...)`);

        const polarResponse = await fetch(polarApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                products: [productId],
                success_url: successUrl,
                ...(email && { customer_email: email }),
                metadata: {
                    source: 'hairdirector_web',
                    timestamp: new Date().toISOString(),
                },
            }),
        });

        if (!polarResponse.ok) {
            const errorText = await polarResponse.text();
            console.error('Polar.sh API Error:', errorText);
            return new Response(
                JSON.stringify({ error: 'Failed to create checkout session', details: errorText }),
                { status: polarResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const checkoutData = await polarResponse.json() as { id: string; url: string };

        return new Response(
            JSON.stringify({
                id: checkoutData.id,
                url: checkoutData.url,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Checkout creation error:', error);
        return new Response(
            JSON.stringify({ error: 'Server error', message: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
};
