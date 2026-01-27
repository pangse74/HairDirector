/// <reference types="@cloudflare/workers-types" />

// Cloudflare Pages Functions 타입 정의
export interface Env {
    GEMINI_API_KEY: string;
}

// PagesFunction 타입 (Cloudflare에서 제공)
declare global {
    type PagesFunction<E = unknown> = (context: EventContext<E, string, unknown>) => Response | Promise<Response>;

    interface EventContext<E, P extends string, D> {
        request: Request;
        env: E;
        params: Record<P, string>;
        data: D;
        next: () => Promise<Response>;
        waitUntil: (promise: Promise<unknown>) => void;
        passThroughOnException: () => void;
    }
}
