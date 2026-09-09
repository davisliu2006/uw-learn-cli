import { APP_NAME, HOST } from "../config.js";
import type { AuthSession, StoredCookie } from "../auth/types.js";
import { clearSession } from "../auth/store.js";

/**
 * Build a cookie request header from stored session cookies.
 */
function cookieHeader(cookies: StoredCookie[]): string {
    return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

/**
 * Authenticated HTTP client for Brightspace APIs.
 */
export class BrightspaceClient {
    constructor(
        private readonly session: AuthSession
    ) {}

    /**
     * Attach outgoing request headers.
     */
    private headers(extra?: HeadersInit): Headers {
        const headers = new Headers(extra);
        headers.set("Cookie", cookieHeader(this.session.cookies));
        headers.set("Accept", "application/json");
        return headers;
    }

    /**
     * Perform a fetch against LEARN. Relative paths are resolved against HOST.
     * On 401, clears the local session and throws.
     */
    async request(path: string, init: RequestInit = {}): Promise<Response> {
        const url = path.startsWith("http") ? path : `${HOST}${path}`;
        const headers = this.headers(init.headers);
        const res = await fetch(url, { ...init, headers });

        if (res.status === 401) {
            await clearSession();
            throw new Error(`Session expired. Run: ${APP_NAME} login`);
        }

        return res;
    }

    /**
     * GET JSON from a Valence route; throws if the response is not OK.
     */
    async json<T>(path: string, init?: RequestInit): Promise<T> {
        const res = await this.request(path, init);
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(`API ${res.status} for ${path}${body ? `: ${body.slice(0, 200)}` : ""}`);
        }
        return (await res.json()) as T;
    }

    /**
     * GET a binary/stream response (e.g. topic files); throws if not OK.
     */
    async stream(path: string): Promise<Response> {
        const res = await this.request(path);
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(`API ${res.status} for ${path}${body ? `: ${body.slice(0, 200)}` : ""}`);
        }
        return res;
    }
}
