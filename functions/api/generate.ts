// Cloudflare Pages Functions - Gemini API Proxy
// 이 함수는 /api/generate 경로에서 실행됩니다.

interface Env {
    GEMINI_API_KEY: string;
}

interface RequestBody {
    image: string;
    mimeType: string;
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

const STYLES = ["포마드컷", "리프컷", "댄디컷", "리젠트컷", "쉐도우펌", "아이비리그컷", "애즈펌", "슬릭백", "투블럭컷"];

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
        const { image, mimeType } = body;

        if (!image) {
            return new Response(
                JSON.stringify({ error: 'Image data is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 프롬프트 생성
        const prompt = `You are an expert Korean hairstylist. This is a 3x3 grid image with 9 copies of the same Korean person's face.

CRITICAL INSTRUCTIONS:
1. DO NOT change the person's face, eyes, nose, mouth, or skin - keep them EXACTLY the same.
2. ONLY modify the HAIR in each cell.
3. Each cell should show a DIFFERENT hairstyle.
4. The output must be a single 3x3 grid image containing all 9 results.

Apply these specific Korean hairstyles to each position (from left to right, top to bottom):
- Cell 1 (1,1): ${STYLES[0]}
- Cell 2 (1,2): ${STYLES[1]}  
- Cell 3 (1,3): ${STYLES[2]}
- Cell 4 (2,1): ${STYLES[3]}
- Cell 5 (2,2): ${STYLES[4]}
- Cell 6 (2,3): ${STYLES[5]}
- Cell 7 (3,1): ${STYLES[6]}
- Cell 8 (3,2): ${STYLES[7]}
- Cell 9 (3,3): ${STYLES[8]}`;

        // Gemini API 호출
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
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
