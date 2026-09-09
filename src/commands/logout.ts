import { clearSession, loadSession } from "../lib/auth/store.js";

/**
 * Clear the saved login session.
 */
export default async function logoutCommand(): Promise<void> {
    const existing = await loadSession();
    await clearSession();
    if (existing) {
        console.log("Logged out.");
    } else {
        console.log("No session to clear.");
    }
}
