import { LP_VERSION } from "../config.js";
import type { WhoAmIUser } from "../auth/types.js";
import type { BrightspaceClient } from "./client.js";

/**
 * Return the user for the current session.
 * Calls /d2l/api/lp/{version}/users/whoami.
 */
export async function whoAmI(client: BrightspaceClient): Promise<WhoAmIUser> {
    return client.json<WhoAmIUser>(`/d2l/api/lp/${LP_VERSION}/users/whoami`);
}
