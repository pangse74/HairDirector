// Cloudflare Pages Functions - Polar.sh 체크아웃 정보 조회 API
// 이 함수는 /api/checkout/details 경로에서 실행됩니다.

interface Env {
    POLAR_ACCESS_TOKEN: string;
}

interface RequestBody {
    checkoutId: string;
}

// CORS 헤더
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
        const accessToken = env.POLAR_ACCESS_TOKEN?.trim();
        if (!accessToken) {
            console.error('Missing Polar.sh configuration');
            return new Response(
                JSON.stringify({ error: 'Payment service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const body = await request.json() as RequestBody;
        const { checkoutId } = body;

        if (!checkoutId) {
            return new Response(
                JSON.stringify({ error: 'Checkout ID is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Polar.sh 체크아웃 정보 조회
        // Production API URL 사용
        const polarResponse = await fetch(`https://api.polar.sh/v1/checkouts/custom/${checkoutId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        // 만약 custom endpoint가 아니면 standard endpoint 시도
        let responseData;

        if (!polarResponse.ok) {
            // Retry with standard checkout endpoint if custom fails
            const standardResponse = await fetch(`https://api.polar.sh/v1/checkouts/${checkoutId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!standardResponse.ok) {
                const errorText = await standardResponse.text();
                // console.error('Polar.sh API Error:', errorText); // 로그 노이즈 방지
                return new Response(
                    JSON.stringify({ error: 'Failed to fetch checkout details', details: errorText }),
                    { status: standardResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            responseData = await standardResponse.json();
        } else {
            responseData = await polarResponse.json();
        }

        // 데이터 구조에서 이메일 추출 (구조는 API 버전에 따라 다를 수 있음, 안전하게 접근)
        // 보통 customer_email 또는 customer_details.email 등에 위치함
        const anyData = responseData as any;
        const email = anyData.customer_email || anyData.customer?.email || anyData.user?.email || null;
        const status = anyData.status || 'unknown';

        return new Response(
            JSON.stringify({
                email,
                status,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Checkout details fetch error:', error);
        return new Response(
            JSON.stringify({ error: 'Server error', message: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
};
