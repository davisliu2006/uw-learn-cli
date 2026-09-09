import { mkdir } from "fs/promises";
import { join } from "path";
import { chromium, type Cookie } from "playwright";
import { HOST, configDir } from "../config.js";
import type { AuthSession, StoredCookie, WhoAmIUser } from "./types.js";

/**
 * Get the Playwright user data directory.
 */
function profileDir(): string {
    return join(configDir(), "browser-profile");
}

/**
 * Map a Playwright cookie into what we store.
 */
function toStoredCookie(cookie: Cookie): StoredCookie {
    return {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        expires: cookie.expires,
    };
}

/**
 * True when LEARN session cookies are present.
 */
function hasLearnSession(cookies: Cookie[]): boolean {
    return cookies.some(
        (c) =>
            c.name === "d2lSessionVal" &&
            (c.domain.includes("learn.uwaterloo.ca") || c.domain.includes("uwaterloo.ca")),
    );
}

/**
 * Open browser for login and export cookies.
 */
export async function captureLoginCookies(): Promise<StoredCookie[]> {
    const userDataDir = profileDir();
    await mkdir(userDataDir, { recursive: true });

    console.log("Opening browser. Sign in with WatIAM + Duo...");

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: { width: 1200, height: 900 },
    });

    try {
        const page = context.pages()[0] ?? (await context.newPage());
        await page.goto(HOST, { waitUntil: "domcontentloaded" });

        await page.waitForFunction(
            () => {
                const href = location.href;
                return href.includes("/d2l/home") || href.includes("/d2l/lp/homepage");
            },
            undefined,
            { timeout: 10*60*1000 },
        );

        // Give LEARN a moment to set session cookies after redirect.
        await new Promise((r) => setTimeout(r, 1500));

        let cookies = await context.cookies();
        const deadline = Date.now() + 30_000;
        while (!hasLearnSession(cookies) && Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 500));
            cookies = await context.cookies();
        }

        if (!hasLearnSession(cookies)) {
            throw new Error("Login finished but no d2lSessionVal cookie was found.");
        }

        const relevant = cookies.filter(
            (c) =>
                c.domain.includes("uwaterloo.ca") ||
                c.domain.includes("brightspace.com") ||
                c.domain.includes("desire2learn.com"),
        );

        return relevant.map(toStoredCookie);
    } finally {
        await context.close();
    }
}

/**
 * Build an AuthSession from cookies and a WhoAmIUser.
 */
export function sessionFromWhoAmI(
    cookies: StoredCookie[],
    user: WhoAmIUser,
): AuthSession {
    return {
        host: HOST,
        cookies,
        user: {
            identifier: user.Identifier,
            displayName: `${user.FirstName} ${user.LastName}`.trim(),
            uniqueName: user.UniqueName,
        },
        savedAt: new Date().toISOString(),
    };
}
