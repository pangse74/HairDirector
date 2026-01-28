// Cloudflare Pages Functions - Face Analysis API
// 이 함수는 /api/analyze 경로에서 실행됩니다.
// gemini-2.0-flash 모델을 사용하여 빠른 얼굴 분석 수행

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
                text?: string;
            }>;
        };
    }>;
}

// CORS 헤더
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// 분석 프롬프트 (강화된 맞춤형 분석)
const ANALYSIS_PROMPT = `You are an expert AI hairstylist and face analyst with 20+ years of experience. Analyze the face in this image and provide PERSONALIZED styling recommendations.

IMPORTANT: Return ONLY valid JSON, no other text. The response must be parseable JSON.

🔍 ANALYSIS TASKS:
1. Face shape classification (oval, round, square, oblong, heart, diamond)
2. Skin tone analysis (fair, medium, tan, dark)
3. Face proportions measurement (upper/middle/lower thirds as percentages, must sum to 100)
4. Notable facial features detection (at least 3-5 features with impact assessment)
5. Overall impression analysis (professional assessment of the face's characteristics)
6. PERSONALIZED styling tips (3 specific tips tailored ONLY for THIS face - NOT generic advice)
7. Recommend exactly 9 Korean male hairstyles best suited for THIS specific face
8. List 2-3 styles to avoid for this face

⚠️ CRITICAL: "stylingTips" must be PERSONALIZED advice for THIS specific person.
- DO NOT use generic tips like "정수리에 볼륨을 주세요"
- Instead, analyze THIS face and write specific advice like "당신의 넓은 이마를 커버하기 위해 앞머리를 6cm 정도 내리는 것을 추천합니다"
- Each tip should reference specific features visible in the photo

Return JSON in this exact format:
{
  "faceShape": "oval|round|square|oblong|heart|diamond",
  "faceShapeKo": "계란형|둥근형|사각형|긴형|하트형|다이아몬드형",
  "skinTone": "fair|medium|tan|dark",
  "skinToneKo": "밝은 톤|중간 톤|웜톤|어두운 톤",
  "upperRatio": 33,
  "middleRatio": 34,
  "lowerRatio": 33,
  "overallImpression": "이 얼굴의 전체적인 인상 분석 (한글, 2-3문장)",
  "features": [
    {"name": "feature_name", "nameKo": "특징 한글명", "impact": "positive|neutral|consideration"}
  ],
  "stylingTips": [
    "이 얼굴만을 위한 구체적인 스타일링 팁 1 (한글)",
    "이 얼굴만을 위한 구체적인 스타일링 팁 2 (한글)",
    "이 얼굴만을 위한 구체적인 스타일링 팁 3 (한글)"
  ],
  "recommendations": [
    {"id": "style_id", "name": "스타일명", "reason": "이 얼굴에 맞는 구체적인 추천 이유", "score": 95, "priority": 1}
  ],
  "avoidStyles": [
    {"name": "스타일명", "reason": "이 얼굴에서 피해야 할 구체적인 이유"}
  ]
}

📋 Korean male hairstyle IDs:
- pomade: 포마드컷 | leaf: 리프컷 | dandy: 댄디컷 | regent: 리젠트컷
- shadow: 쉐도우펌 | ivy: 아이비리그컷 | ez: 애즈펌 | slick: 슬릭백
- twoblock: 투블럭컷 | comma: 가르마펌 | layered: 레이어드컷 | crop: 크롭컷
- textured: 텍스쳐드펌 | mohican: 모히칸컷 | undercut: 언더컷

✅ Output requirements:
- Recommendations: top 9 most suitable styles with scores (0-100)
- Priority: 1 = best match, 9 = lowest among recommendations
- All text in "stylingTips", "overallImpression", "reason" fields must be in Korean
- Tips must be SPECIFIC to THIS face, not generic advice`;

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

        // Gemini API 호출 (gemini-2.0-flash - 빠르고 저렴)
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
                            { text: ANALYSIS_PROMPT },
                        ],
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        topK: 40,
                        topP: 0.8,
                        maxOutputTokens: 2048,
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

        // 텍스트 응답 추출
        const textPart = geminiData.candidates?.[0]?.content?.parts?.find(p => p.text);
        if (!textPart?.text) {
            return new Response(
                JSON.stringify({ error: 'No analysis result from AI' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // JSON 파싱 시도
        let analysisResult;
        try {
            // 마크다운 코드 블록 제거
            let jsonText = textPart.text.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.slice(7);
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.slice(3);
            }
            if (jsonText.endsWith('```')) {
                jsonText = jsonText.slice(0, -3);
            }
            jsonText = jsonText.trim();

            analysisResult = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Raw text:', textPart.text);
            return new Response(
                JSON.stringify({
                    error: 'Failed to parse AI response',
                    rawResponse: textPart.text.substring(0, 500)
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 필수 필드 검증
        if (!analysisResult.faceShape || !analysisResult.recommendations) {
            return new Response(
                JSON.stringify({ error: 'Invalid analysis result structure' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                analysis: analysisResult
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
