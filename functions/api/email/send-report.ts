// Cloudflare Pages Functions - Resend API를 통한 결과 리포트 이메일 전송
// 이 함수는 /api/email/send-report 경로에서 실행됩니다.

interface Env {
    RESEND_API_KEY: string;
}

interface AnalysisResult {
    faceShape: string;
    faceShapeKo: string;
    skinTone: string;
    skinToneKo: string;
    upperRatio: number;
    middleRatio: number;
    lowerRatio: number;
    overallImpression?: string;
    features: Array<{ name: string; nameKo: string; impact: string }>;
    stylingTips: string[];
    recommendations: Array<{ id: string; name: string; reason: string; score: number; priority: number }>;
    avoidStyles?: Array<{ name: string; reason: string }>;
}

interface RequestBody {
    email: string;
    analysisResult: AnalysisResult;
}

// CORS 헤더
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// 이메일 HTML 템플릿 생성
function generateEmailHTML(analysis: AnalysisResult): string {
    const topRecommendations = analysis.recommendations.slice(0, 5);
    const features = analysis.features.slice(0, 5);

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>헤어디렉터 AI 분석 리포트</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0a0a0f; color: #e5e5e5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- 헤더 -->
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #a78bfa; font-size: 28px; margin-bottom: 10px;">헤어디렉터</h1>
            <p style="color: #888; font-size: 14px;">AI 헤어스타일 분석 리포트</p>
        </div>

        <!-- 얼굴형 분석 -->
        <div style="background: rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #c4b5fd; font-size: 18px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                얼굴 분석 결과
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #888;">얼굴형</td>
                    <td style="padding: 8px 0; color: #fff; text-align: right; font-weight: bold;">${analysis.faceShapeKo}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #888;">피부톤</td>
                    <td style="padding: 8px 0; color: #fff; text-align: right; font-weight: bold;">${analysis.skinToneKo}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #888;">얼굴 비율</td>
                    <td style="padding: 8px 0; color: #fff; text-align: right;">
                        상 ${analysis.upperRatio}% · 중 ${analysis.middleRatio}% · 하 ${analysis.lowerRatio}%
                    </td>
                </tr>
            </table>
        </div>

        <!-- 전체 인상 -->
        ${analysis.overallImpression ? `
        <div style="background: rgba(167, 139, 250, 0.1); border-left: 3px solid #a78bfa; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
            <p style="color: #ddd; font-size: 14px; line-height: 1.6; margin: 0;">
                ${analysis.overallImpression}
            </p>
        </div>
        ` : ''}

        <!-- 얼굴 특징 -->
        <div style="background: rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #c4b5fd; font-size: 18px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                주요 얼굴 특징
            </h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
                ${features.map(f => `
                <li style="padding: 8px 0; color: #ccc; display: flex; align-items: center;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${f.impact === 'positive' ? '#4ade80' : f.impact === 'consideration' ? '#fbbf24' : '#888'}; margin-right: 12px;"></span>
                    ${f.nameKo}
                </li>
                `).join('')}
            </ul>
        </div>

        <!-- 추천 헤어스타일 -->
        <div style="background: rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #c4b5fd; font-size: 18px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                추천 헤어스타일 TOP 5
            </h2>
            ${topRecommendations.map((rec, idx) => `
            <div style="padding: 12px 0; ${idx < topRecommendations.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.05);' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="color: #fff; font-weight: bold;">
                        <span style="color: #a78bfa; margin-right: 8px;">#${idx + 1}</span>
                        ${rec.name}
                    </span>
                    <span style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                        ${rec.score}점
                    </span>
                </div>
                <p style="color: #888; font-size: 13px; margin: 4px 0 0 0; line-height: 1.5;">
                    ${rec.reason}
                </p>
            </div>
            `).join('')}
        </div>

        <!-- 스타일링 팁 -->
        ${analysis.stylingTips && analysis.stylingTips.length > 0 ? `
        <div style="background: rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #c4b5fd; font-size: 18px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                맞춤 스타일링 팁
            </h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
                ${analysis.stylingTips.map(tip => `
                <li style="padding: 10px 0; color: #ccc; font-size: 14px; line-height: 1.6; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    💡 ${tip}
                </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        <!-- 피해야 할 스타일 -->
        ${analysis.avoidStyles && analysis.avoidStyles.length > 0 ? `
        <div style="background: rgba(239, 68, 68, 0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #f87171; font-size: 18px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                피하면 좋은 스타일
            </h2>
            ${analysis.avoidStyles.map(style => `
            <div style="padding: 8px 0;">
                <span style="color: #fca5a5; font-weight: bold;">❌ ${style.name}</span>
                <p style="color: #888; font-size: 13px; margin: 4px 0 0 0;">${style.reason}</p>
            </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- 푸터 -->
        <div style="text-align: center; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1);">
            <p style="color: #666; font-size: 12px; margin-bottom: 8px;">
                본 리포트는 AI 분석 결과이며, 참고용으로만 활용해주세요.
            </p>
            <p style="color: #888; font-size: 14px;">
                <a href="https://hairdirector.site" style="color: #a78bfa; text-decoration: none;">헤어디렉터</a>
                에서 더 많은 스타일을 경험해보세요!
            </p>
            <p style="color: #555; font-size: 11px; margin-top: 20px;">
                &copy; 2025 헤어디렉터 (Hair Director). All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
`;
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
        // API 키 확인
        const apiKey = env.RESEND_API_KEY;
        if (!apiKey) {
            console.error('RESEND_API_KEY not configured');
            return new Response(
                JSON.stringify({ error: 'Email service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 요청 본문 파싱
        const body = await request.json() as RequestBody;
        const { email, analysisResult } = body;

        if (!email || !analysisResult) {
            return new Response(
                JSON.stringify({ error: 'Email and analysis result are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 이메일 유효성 검사
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(
                JSON.stringify({ error: 'Invalid email address' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 이메일 HTML 생성
        const htmlContent = generateEmailHTML(analysisResult);

        // 첨부 파일 제거 (텍스트 리포트만 전송)

        // Resend API 호출
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: '헤어디렉터 <noreply@hairdirector.site>',
                to: [email],
                subject: `[헤어디렉터] AI 헤어스타일 분석 리포트 - ${analysisResult.faceShapeKo}`,
                html: htmlContent,
            }),
        });

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.error('Resend API Error:', errorText);
            return new Response(
                JSON.stringify({ error: 'Failed to send email', details: errorText }),
                { status: resendResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const resendData = await resendResponse.json() as { id: string };

        return new Response(
            JSON.stringify({
                success: true,
                messageId: resendData.id,
                message: '이메일이 성공적으로 전송되었습니다.'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Email send error:', error);
        return new Response(
            JSON.stringify({ error: 'Server error', message: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
};
