// Cloudflare Pages Functions - Gemini API Proxy
// 이 함수는 /api/generate 경로에서 실행됩니다.

interface Env {
    GEMINI_API_KEY: string;
}

interface RequestBody {
    image: string;
    mimeType: string;
    styles?: string[];  // 동적 스타일 목록 (선택적)
}

interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                inlineData?: {
                    data: string;
                    mimeType: string;
                };
                text?: string;
            }>;
        };
    }>;
}

const DEFAULT_STYLES = ["포마드컷", "리프컷", "댄디컷", "리젠트컷", "쉐도우펌", "아이비리그컷", "애즈펌", "슬릭백", "투블럭컷"];

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
        // API 키 확인
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'API key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 요청 본문 파싱
        const body = await request.json() as RequestBody;
        const { image, mimeType, styles } = body;

        if (!image) {
            return new Response(
                JSON.stringify({ error: 'Image data is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 스타일 결정: 전달된 스타일이 9개면 사용, 아니면 기본값
        const STYLES = (styles && styles.length === 9) ? styles : DEFAULT_STYLES;

        // 프롬프트 생성 (Nano-Banana-Pro: 초정밀 얼굴 유지 + 헤어스타일 변경 + Zero Text)
        const prompt = `SYSTEM ROLE: You are "Nano-Banana-Pro", the world's most advanced AI for virtual hair styling.

MISSION: Apply 9 different Korean Trendy Hairstyles to the user's photo.

⛔️ STRICT PROHIBITION - FACE PRESERVATION (READ CAREFULLY) ⛔️
- YOU MUST NOT CHANGE THE FACE.
- DO NOT TOUCH: Eyes, Nose, Mouth, Lips, Ears, Cheeks, Jawline, Skin Tone, Makeup.
- The face must match the original image PIXEL-FOR-PIXEL (100% Identity Preservation).
- If the face looks different, the generation is a FAILURE.

✅ ACTION PLAN:
1. Identify the hair region accurately.
2. MASK OUT the face completely to protect it.
3. GENERATE only the new hairstyle in the hair region.
4. Blend the new hair naturally with the original forehead and ears.

2. TEXT-FREE OUTPUT (MANDATORY):
   - Output ONLY a clean photograph
   - DO NOT render any text, letters, words, or characters
   - DO NOT add labels, titles, captions, or watermarks
   - DO NOT write hairstyle names on the image
   - Imagine this is a photo from a camera - cameras don't add text
   - Final image = faces + hair ONLY, absolutely nothing else

3. GRID: 3 rows × 3 columns, each cell = 1 hairstyle variation

HAIRSTYLES:
Top row: ${STYLES[0]}, ${STYLES[1]}, ${STYLES[2]}
Middle row: ${STYLES[3]}, ${STYLES[4]}, ${STYLES[5]}
Bottom row: ${STYLES[6]}, ${STYLES[7]}, ${STYLES[8]}

OUTPUT: Clean 3x3 photo grid with NO TEXT anywhere.`;

        // Gemini API 호출 (Nano Banana Pro = gemini-3-pro-image-preview)
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                inlineData: {
                                    mimeType: mimeType || 'image/png',
                                    data: image,
                                },
                            },
                            { text: prompt },
                        ],
                    }],
                    generationConfig: {
                        responseModalities: ["image", "text"],
                    },
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API Error:', errorText);

            // 429 Rate Limit 에러 처리
            if (geminiResponse.status === 429) {
                let retryAfter = 60; // 기본 60초
                try {
                    const errorJson = JSON.parse(errorText);
                    // RetryInfo에서 대기 시간 추출
                    const retryInfo = errorJson.error?.details?.find(
                        (d: any) => d['@type']?.includes('RetryInfo')
                    );
                    if (retryInfo?.retryDelay) {
                        const match = retryInfo.retryDelay.match(/(\d+)/);
                        if (match) retryAfter = parseInt(match[1], 10);
                    }
                } catch (e) {
                    // JSON 파싱 실패 시 기본값 사용
                }

                return new Response(
                    JSON.stringify({
                        error: 'RATE_LIMIT_EXCEEDED',
                        message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
                        retryAfter: retryAfter
                    }),
                    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            return new Response(
                JSON.stringify({ error: 'Gemini API error', details: errorText }),
                { status: geminiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const geminiData = await geminiResponse.json() as GeminiResponse;

        // 이미지 데이터 추출
        const parts = geminiData.candidates?.[0]?.content?.parts;
        if (!parts) {
            return new Response(
                JSON.stringify({ error: 'Invalid response format' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        for (const part of parts) {
            if (part.inlineData) {
                return new Response(
                    JSON.stringify({
                        success: true,
                        image: part.inlineData.data,
                        mimeType: part.inlineData.mimeType || 'image/png'
                    }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        return new Response(
            JSON.stringify({ error: 'No image generated' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Function error:', error);
        return new Response(
            JSON.stringify({ error: 'Server error', message: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
};
