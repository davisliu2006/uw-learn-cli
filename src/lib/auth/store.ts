import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { join } from "path";
import { CLI_NAME, configDir } from "../config.js";
import type { AuthSession } from "./types.js";

/**
 * Path to the saved session file.
 */
export function sessionPath(): string {
    return join(configDir(), "session.json");
}

/**
 * Load the saved session, or null if none exists.
 */
export async function loadSession(): Promise<AuthSession | null> {
    try {
        const raw = await readFile(sessionPath(), "utf8");
        return JSON.parse(raw) as AuthSession;
    } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === "ENOENT") {return null;}
        throw err;
    }
}

/**
 * Save a session to session.json.
 */
export async function saveSession(session: AuthSession): Promise<void> {
    const dir = configDir();
    await mkdir(dir, { recursive: true });
    await writeFile(sessionPath(), `${JSON.stringify(session, null, 4)}\n`, "utf8");
}

/**
 * Delete the local session file if present.
 */
export async function clearSession(): Promise<void> {
    try {
        await rm(sessionPath(), { force: true });
    } catch {
        // ignore
    }
}

/**
 * Load the session or throw with a prompt to run login.
 */
export async function requireSession(): Promise<AuthSession> {
    const session = await loadSession();
    if (!session) {
        throw new Error(`Not logged in. Run: ${CLI_NAME} login`);
    }
    return session;
}
