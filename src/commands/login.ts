import { captureLoginCookies, sessionFromWhoAmI } from "../lib/auth/session.js";
import { saveSession } from "../lib/auth/store.js";
import { BrightspaceClient } from "../lib/brightspace/client.js";
import { whoAmI } from "../lib/brightspace/users.js";

/**
 * Login through browser window and save session locally.
 */
export default async function loginCommand(): Promise<void> {
    const cookies = await captureLoginCookies();
    const provisional = sessionFromWhoAmI(cookies, {
        Identifier: "",
        FirstName: "",
        LastName: "",
        UniqueName: "",
    });
    const client = new BrightspaceClient(provisional);
    const user = await whoAmI(client);
    const session = sessionFromWhoAmI(cookies, user);
    await saveSession(session);
    console.log(`Logged in as ${session.user.displayName} (${session.user.uniqueName})`);
}
