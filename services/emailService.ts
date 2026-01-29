// 이메일 전송 서비스
// Resend API를 통해 분석 결과를 이메일로 전송

import { FaceAnalysisResult } from '../types';

export interface SendReportResponse {
    success: boolean;
    messageId?: string;
    message?: string;
    error?: string;
}

interface ApiResponse {
    success?: boolean;
    messageId?: string;
    message?: string;
    error?: string;
}

/**
 * 분석 결과 리포트를 이메일로 전송
 */
export async function sendAnalysisReport(
    email: string,
    analysisResult: FaceAnalysisResult
): Promise<SendReportResponse> {
    try {
        const response = await fetch('/api/email/send-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                analysisResult,
            }),
        });

        const data = await response.json() as ApiResponse;

        if (!response.ok) {
            console.error('Email send failed:', data);
            return {
                success: false,
                error: data.error || data.message || '이메일 전송에 실패했습니다.',
            };
        }

        return {
            success: true,
            messageId: data.messageId,
            message: data.message || '이메일이 전송되었습니다.',
        };
    } catch (error) {
        console.error('Email send error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '이메일 전송 중 오류가 발생했습니다.',
        };
    }
}

/**
 * 이메일 유효성 검사
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
