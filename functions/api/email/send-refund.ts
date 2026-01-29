
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

    // 3. 관리자용 이메일 본문 생성
    const adminHtmlContent = `
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

    // 4. 사용자용 환불 알림 이메일 본문 생성
    const userHtmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 3px; border-radius: 16px;">
      <div style="background: #ffffff; border-radius: 14px; padding: 40px 30px;">
        <!-- 로고/헤더 -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px 25px; border-radius: 12px;">
            <span style="color: #ffffff; font-size: 24px; font-weight: bold;">헤어디렉터</span>
          </div>
        </div>

        <!-- 메인 콘텐츠 -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: #d4edda; border-radius: 50%; padding: 20px; margin-bottom: 20px;">
            <span style="font-size: 40px;">✓</span>
          </div>
          <h1 style="color: #28a745; font-size: 28px; margin: 0 0 10px 0;">환불이 완료되었습니다</h1>
          <p style="color: #666; font-size: 16px; margin: 0;">결제하신 금액이 전액 환불 처리되었습니다.</p>
        </div>

        <!-- 환불 정보 박스 -->
        <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
          <h3 style="color: #333; font-size: 16px; margin: 0 0 15px 0; border-bottom: 1px solid #e9ecef; padding-bottom: 10px;">환불 상세 내역</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">환불 일시</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 500;">${timestamp}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">환불 금액</td>
              <td style="padding: 8px 0; color: #28a745; font-size: 14px; text-align: right; font-weight: bold;">$5.99 (전액)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">환불 사유</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">시스템 오류로 인한 자동 환불</td>
            </tr>
          </table>
        </div>

        <!-- 안내 메시지 -->
        <div style="background: #e8f4fd; border-left: 4px solid #2196F3; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
          <p style="color: #1565C0; font-size: 14px; margin: 0; line-height: 1.6;">
            <strong>안내:</strong> 환불 금액은 결제 수단에 따라 3-5 영업일 이내에 원래 결제 수단으로 환불됩니다.
            문의사항이 있으시면 언제든지 연락해 주세요.
          </p>
        </div>

        <!-- 재시도 버튼 -->
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="https://hairdirector.pages.dev" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
            다시 이용하기
          </a>
        </div>

        <!-- 푸터 -->
        <div style="text-align: center; border-top: 1px solid #e9ecef; padding-top: 20px;">
          <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">본 메일은 자동으로 발송되었습니다.</p>
          <p style="color: #999; font-size: 12px; margin: 0;">© 2024 헤어디렉터. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

    // 5. 이메일 발송 (fetch 사용)
    try {
        console.log(`[Email] 환불 알림 메일 발송 시작 -> Admin: ${adminEmail}, User: ${userEmail || 'N/A'}`);

        // 관리자에게 환불 요청 내역 발송
        const adminResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Hair Director <noreply@hairdirector.site>',
                to: [adminEmail],
                reply_to: userEmail && userEmail.includes('@') ? userEmail : undefined,
                subject: `[환불완료] 헤어디렉터 자동 환불 처리 (${userEmail || 'Unknown User'})`,
                html: adminHtmlContent,
            })
        });

        const adminData = await adminResponse.json() as { id?: string; error?: any };
        if (!adminResponse.ok) {
            console.error('Resend API Error (Admin):', adminData);
        }

        // 사용자에게 환불 완료 알림 발송 (유효한 이메일인 경우에만)
        let userMessageId: string | null = null;
        if (userEmail && userEmail.includes('@') && userEmail !== 'unknown@user.com') {
            const userResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Hair Director <noreply@hairdirector.site>',
                    to: [userEmail],
                    subject: '[헤어디렉터] 환불이 완료되었습니다',
                    html: userHtmlContent,
                })
            });

            const userData = await userResponse.json() as { id?: string; error?: any };
            if (userResponse.ok) {
                userMessageId = userData.id || null;
                console.log(`[Email] 사용자 환불 알림 발송 완료: ${userEmail}`);
            } else {
                console.error('Resend API Error (User):', userData);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            adminMessageId: adminData.id,
            userMessageId: userMessageId,
            userNotified: !!userMessageId
        }), {
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
