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

        // 프롬프트 생성 (gemini-3-pro-image-preview: 초정밀 얼굴 유지 + 헤어스타일 변경 + Zero Text)
        const prompt = `SYSTEM ROLE: You are "gemini-3-pro-image-preview", the world's most advanced AI for virtual hair styling.

🔒🔒🔒 초정밀 얼굴 유지 (ULTRA-PRECISE FACE PRESERVATION) - 최우선 규칙 🔒🔒🔒

MISSION: Create a SQUARE image containing EXACTLY 9 photos arranged in a 3x3 grid (3 rows, 3 columns).

⚠️ 핵심 원칙: 얼굴은 절대 변형하지 마세요. 머리카락만 변경하세요. ⚠️

🔒 초정밀 얼굴 유지 - ABSOLUTE FACE PRESERVATION 🔒
- 원본 사진의 얼굴을 **픽셀 단위로 완벽하게 동일하게** 유지하세요.
- 얼굴을 새로 생성하거나 재해석하지 마세요. **원본 얼굴을 그대로 복사**하세요.
- The person's face must be **PIXEL-PERFECT IDENTICAL** in ALL 9 cells.
- **COPY the exact face** from the original photo. Do NOT regenerate or reimagine.
- PRESERVE EXACTLY:
  • Eye shape, eye size, eye position, eye color, eyelids, eyebrows (눈 모양, 크기, 위치, 색상, 눈썹)
  • Nose shape, nose size, nostril shape (코 모양, 크기)
  • Lip shape, lip thickness, mouth width, teeth (입술 모양, 두께, 치아)
  • Face shape, jawline, chin, cheekbones (얼굴형, 턱선, 광대뼈)
  • Skin tone, skin texture, freckles, moles, wrinkles (피부톤, 피부결, 주근깨, 점, 주름)
  • Ear shape and position (귀 모양과 위치)
  • Facial expression (must be same in all 9 cells) (표정 동일)
- **오직 머리카락만 변경** - 얼굴은 절대 건드리지 마세요.
- **ONLY MODIFY THE HAIR** - nothing else changes.
- Think of it as: "Same photo, different wig" - the face underneath is untouched.
- 얼굴이 조금이라도 달라지면 **완전한 실패**입니다.
- If the face looks even slightly different, the generation is a COMPLETE FAILURE.

⚠️ CRITICAL GRID REQUIREMENTS ⚠️
- OUTPUT MUST BE A **SQUARE IMAGE** (1:1 aspect ratio)
- EXACTLY **3 ROWS** and **3 COLUMNS** = 9 cells total
- Each cell shows the SAME EXACT PERSON with a DIFFERENT hairstyle
- All 9 cells must be EQUAL SIZE
- DO NOT create 2x5, 5x2, 2x4, 4x2 or any other layout. ONLY 3x3.

⛔️⛔️⛔️ ABSOLUTE ZERO TEXT - MOST CRITICAL RULE ⛔️⛔️⛔️
- **NO TEXT WHATSOEVER** - This is NON-NEGOTIABLE.
- NO letters (English, Korean, Chinese, Japanese, or ANY language)
- NO numbers, NO symbols, NO characters of any kind
- NO watermarks, NO signatures, NO logos, NO brand names
- NO labels, NO captions, NO style names, NO titles
- NO text ON the face, ON the hair, ON the background, or ANYWHERE
- DO NOT write hairstyle names on the image
- DO NOT add any overlay text or graphics
- The image must be **PURE PHOTOGRAPHY** - as if taken by a camera
- Think: "Raw photo from a professional photoshoot" - no post-production text
- **IF ANY TEXT APPEARS ANYWHERE IN THE IMAGE = COMPLETE FAILURE**
- Negative prompt: text, letters, words, writing, typography, caption, label, watermark, signature, logo, number, character, font, headline, title, subtitle

GRID LAYOUT (3 rows × 3 columns):
Row 1: [${STYLES[0]}] [${STYLES[1]}] [${STYLES[2]}]
Row 2: [${STYLES[3]}] [${STYLES[4]}] [${STYLES[5]}]
Row 3: [${STYLES[6]}] [${STYLES[7]}] [${STYLES[8]}]

TECHNIQUE: Use inpainting based method. Keep facial features strictly unchanged.`;

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
