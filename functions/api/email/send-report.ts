
import { Resend } from 'resend';
import { Buffer } from 'node:buffer'; // Cloudflare Workers Node.js compatibility layer

interface Env {
    RESEND_API_KEY: string;
}

interface RequestBody {
    email: string;
    analysisResult: {
        faceShapeKo: string;
        skinToneKo: string;
        features: { nameKo: string }[];
        recommendations: { name: string }[];
        stylingTips?: string[];
    };
    resultImage?: string; // Base64 string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    // 1. API 키 확인
    if (!env.RESEND_API_KEY) {
        return new Response(JSON.stringify({
            success: false,
            error: '이메일 서버 설정 오류: RESEND_API_KEY가 없습니다.'
        }), { status: 500 });
    }

    // 2. 요청 데이터 파싱
    let body: RequestBody;
    try {
        body = await request.json() as RequestBody;
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: '잘못된 요청 형식입니다.' }), { status: 400 });
    }

    const { email, analysisResult, resultImage } = body;

    if (!email || !analysisResult) {
        return new Response(JSON.stringify({ success: false, error: '이메일 주소와 분석 결과는 필수입니다.' }), { status: 400 });
    }

    const resend = new Resend(env.RESEND_API_KEY);

    // 3. 이메일 템플릿 (HTML) 생성
    const bestStyles = analysisResult.recommendations.slice(0, 5).map(r => r.name).join(', ');
    const features = analysisResult.features.map(f => f.nameKo).join(', ');

    const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #1a1a2e; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Hair Director</h1>
        <p style="color: #a0a0b0; font-size: 14px; margin-top: 5px;">AI 얼굴형 분석 리포트</p>
      </div>
      
      <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #4a4a4a; font-size: 20px; border-bottom: 2px solid #6c5ce7; padding-bottom: 10px;">
          고객님의 얼굴형 분석 결과
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px; font-weight: bold; width: 120px; background-color: #f8f9fa;">얼굴형</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${analysisResult.faceShapeKo}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; background-color: #f8f9fa;">피부톤</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${analysisResult.skinToneKo}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; background-color: #f8f9fa;">주요 특징</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${features}</td>
          </tr>
        </table>
        
        <div style="margin-top: 30px; background-color: #f0f3ff; padding: 20px; border-radius: 8px;">
          <h3 style="color: #6c5ce7; margin-top: 0;">✨ AI 추천 헤어스타일 Best 5</h3>
          <p style="font-size: 16px; font-weight: bold; margin-bottom: 0;">${bestStyles}</p>
        </div>
        
        <div style="margin-top: 30px;">
          <h3 style="color: #333;">💡 맞춤 스타일링 팁</h3>
          <ul style="padding-left: 20px; color: #555;">
            ${(analysisResult.stylingTips || []).map(tip => `<li style="margin-bottom: 8px;">${tip}</li>`).join('')}
          </ul>
        </div>
        
        <p style="margin-top: 40px; font-size: 12px; color: #888; text-align: center;">
          본 메일은 발신 전용입니다. 더 자세한 내용은 <a href="https://hairdirector.site" style="color: #6c5ce7;">Hair Director</a>에서 확인하세요.
        </p>
      </div>
    </div>
  `;

    // 4. 첨부파일 처리
    const attachments: any[] = [];
    if (resultImage) {
        try {
            // Base64 문자열에서 헤더 제거 (data:image/png;base64, 부분)
            const base64Data = resultImage.split(';base64,').pop() || resultImage;
            const buffer = Buffer.from(base64Data, 'base64');

            attachments.push({
                filename: 'hair_analysis_result.jpg',
                content: buffer,
            });
        } catch (e) {
            console.error('이미지 첨부 처리 중 오류:', e);
        }
    }

    // 5. 이메일 발송
    try {
        const data = await resend.emails.send({
            from: 'Hair Director <onboarding@resend.dev>', // 테스트용 기본 도메인 (사용자가 도메인 설정 시 변경 필요)
            to: [email],
            subject: `[Hair Director] ${analysisResult.faceShapeKo} 얼굴형 분석 결과 리포트`,
            html: htmlContent,
            attachments: attachments.length > 0 ? attachments : undefined,
        });

        return new Response(JSON.stringify({ success: true, messageId: data.data?.id }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Resend API Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || '이메일 전송 중 오류가 발생했습니다.'
        }), { status: 500 });
    }
};
