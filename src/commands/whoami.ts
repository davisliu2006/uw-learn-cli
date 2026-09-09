import { requireSession } from "../lib/auth/store.js";
import { BrightspaceClient } from "../lib/brightspace/client.js";
import { whoAmI } from "../lib/brightspace/users.js";

/**
 * Validate and print the saved login session.
 */
export default async function whoamiCommand(): Promise<void> {
    const session = await requireSession();
    const client = new BrightspaceClient(session);
    const user = await whoAmI(client);
    console.log(`${user.FirstName} ${user.LastName}`.trim());
    console.log(`Username: ${user.UniqueName}`);
    console.log(`Id: ${user.Identifier}`);
}
