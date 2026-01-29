
interface Env {
    RESEND_API_KEY: string;
}

interface RequestBody {
    userEmail?: string;
    reason?: string;
    timestamp: string;
    errorDetail?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    // 1. API 키 확인
    if (!env.RESEND_API_KEY) {
        return new Response(JSON.stringify({
            success: false,
            error: '서버 설정 오류: RESEND_API_KEY 누락'
        }), { status: 500 });
    }

    // 2. 요청 데이터 파싱
    let body: RequestBody;
    try {
        body = await request.json() as RequestBody;
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: '잘못된 요청 형식' }), { status: 400 });
    }

    const { userEmail, reason, timestamp, errorDetail } = body;
    const adminEmail = '1974mds@naver.com'; // 관리자 이메일 (환불 요청 수신용)

    // 3. 이메일 본문 생성
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px;">
      <h2 style="color: #e74c3c;">[헤어디렉터] 환불 요청 접수</h2>
      <p><strong>일시:</strong> ${timestamp}</p>
      <p><strong>사용자 이메일:</strong> ${userEmail || '미입력'}</p>
      <hr>
      <h3>요청 사유</h3>
      <p style="background-color: #f9f9f9; padding: 15px;">${reason || '자동 환불 요청 (시스템 오류)'}</p>
      
      <h3>에러 상세 정보</h3>
      <pre style="background-color: #333; color: #fff; padding: 15px; overflow-x: auto;">
${errorDetail || '상세 에러 내용 없음'}
      </pre>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        본 메일은 시스템에서 자동으로 발송되었습니다.
      </p>
    </div>
  `;

    // 4. 이메일 발송 (fetch 사용)
    try {
        console.log(`[Email] 환불 요청 메일 발송 시작 -> Admin: ${adminEmail}`);

        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Hair Director Refund <onboarding@resend.dev>',
                to: [adminEmail],
                // 사용자가 이메일을 입력했다면 cc나 reply_to로 설정 가능하지만, 여기선 본문에 포함
                reply_to: userEmail && userEmail.includes('@') ? userEmail : undefined,
                subject: `[환불요청] 헤어디렉터 분석 실패 건 (${userEmail || 'Unknown User'})`,
                html: htmlContent,
            })
        });

        const responseData = await resendResponse.json() as { id?: string; error?: any };

        if (!resendResponse.ok) {
            console.error('Resend API Error (Refund):', responseData);
            return new Response(JSON.stringify({
                success: false,
                error: `전송 실패: ${responseData.error?.message || JSON.stringify(responseData)}`
            }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true, messageId: responseData.id }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Fetch Error (Refund):', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || '네트워크 오류 발생'
        }), { status: 500 });
    }
};
