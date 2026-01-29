// Cloudflare Pages Functions - Polar.sh 웹훅 핸들러
// 이 함수는 /api/webhook/polar 경로에서 실행됩니다.
// Polar.sh에서 결제 완료 시 호출됩니다.

interface Env {
    POLAR_WEBHOOK_SECRET: string;
}

interface PolarWebhookPayload {
    type: string;
    data: {
        id: string;
        status: string;
        customer_email?: string;
        product_id?: string;
        metadata?: Record<string, string>;
        created_at?: string;
    };
}

// CORS 헤더
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Polar-Signature',
};

/**
 * 웹훅 시그니처 검증
 * Polar.sh는 HMAC-SHA256을 사용하여 웹훅을 서명합니다.
 */
async function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): Promise<boolean> {
    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign', 'verify']
        );

        const expectedSignature = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(payload)
        );

        const expectedHex = Array.from(new Uint8Array(expectedSignature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // 타이밍 공격 방지를 위한 상수 시간 비교
        if (signature.length !== expectedHex.length) {
            return false;
        }

        let result = 0;
        for (let i = 0; i < signature.length; i++) {
            result |= signature.charCodeAt(i) ^ expectedHex.charCodeAt(i);
        }
        return result === 0;
    } catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
}

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
        const webhookSecret = env.POLAR_WEBHOOK_SECRET;

        // 웹훅 시크릿이 설정되지 않은 경우 경고 (개발 모드에서는 스킵 가능)
        const signature = request.headers.get('X-Polar-Signature') || '';
        const payload = await request.text();

        // 시그니처 검증 (프로덕션에서는 필수)
        if (webhookSecret && signature) {
            const isValid = await verifyWebhookSignature(payload, signature, webhookSecret);
            if (!isValid) {
                console.error('Invalid webhook signature');
                return new Response(
                    JSON.stringify({ error: 'Invalid signature' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        // 페이로드 파싱
        const webhookData = JSON.parse(payload) as PolarWebhookPayload;
        const { type, data } = webhookData;

        console.log(`[Polar Webhook] Received event: ${type}`, JSON.stringify(data, null, 2));

        // 이벤트 타입별 처리
        switch (type) {
            case 'checkout.created':
                console.log(`[Polar] Checkout created: ${data.id}`);
                break;

            case 'checkout.updated':
                console.log(`[Polar] Checkout updated: ${data.id}, status: ${data.status}`);
                break;

            case 'order.created':
                // 주문 생성 (아직 결제 완료가 아닐 수 있음)
                console.log(`[Polar] Order created: ${data.id}`);
                console.log(`[Polar] Customer email: ${data.customer_email}`);
                break;

            case 'order.paid':
                // 결제 완료 - 프리미엄 권한 부여
                console.log(`[Polar] Order PAID: ${data.id}`);
                console.log(`[Polar] Customer email: ${data.customer_email}`);
                // TODO: 여기서 사용자의 프리미엄 상태를 서버 측에서 관리할 수 있습니다.
                // 현재는 클라이언트 측 localStorage로 관리합니다.
                // 데이터베이스가 있다면 여기서 사용자 상태를 업데이트합니다.
                break;

            case 'order.refunded':
                // 환불 처리
                console.log(`[Polar] Order refunded: ${data.id}`);
                console.log(`[Polar] Customer email: ${data.customer_email}`);
                // TODO: 프리미엄 권한 해제 로직
                break;

            case 'subscription.created':
                // 구독 생성 (일회성 결제에서는 발생하지 않음)
                console.log(`[Polar] Subscription created: ${data.id}`);
                break;

            case 'subscription.updated':
                console.log(`[Polar] Subscription updated: ${data.id}`);
                break;

            case 'subscription.canceled':
                console.log(`[Polar] Subscription canceled: ${data.id}`);
                break;

            default:
                console.log(`[Polar] Unhandled event type: ${type}`);
        }

        // 성공 응답
        return new Response(
            JSON.stringify({ received: true, type }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Webhook processing error:', error);
        return new Response(
            JSON.stringify({ error: 'Webhook processing failed', message: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
};
