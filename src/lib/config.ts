import { homedir } from "os";
import { join } from "path";

/**
 * CLI binary name.
 */
export const CLI_NAME = "uw-learn";

/**
 * The name of the app used for config files.
 */
export const APP_NAME = "uw-learn-cli";

/**
 * LEARN Brightspace host.
 */
export const HOST = "https://learn.uwaterloo.ca";

/**
 * Hardcoded LEARN API version.
 */
export const LP_VERSION = "1.53";

/**
 * Hardcoded LEARN API version.
 */
export const LE_VERSION = "1.82";

/**
 * Org unit type id for Course Offering.
 */
export const COURSE_OFFERING_TYPE_ID = 3;

/**
 * User config directory for this CLI (session.json, browser profile).
 * Windows: %APPDATA%/<APP_NAME>, macOS: Application Support, Linux: ~/.config.
 */
export function configDir(): string {
    if (process.platform === "win32") {
        return join(process.env.APPDATA ?? join(homedir(), "AppData", "Roaming"), APP_NAME);
    }
    if (process.platform === "darwin") {
        return join(homedir(), "Library", "Application Support", APP_NAME);
    }
    return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), APP_NAME);
}
