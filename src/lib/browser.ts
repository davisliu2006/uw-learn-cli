import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Open a URL in the system default browser.
 */
export async function openInBrowser(url: string): Promise<void> {
    if (process.platform === "win32") {
        await execFileAsync("cmd", ["/c", "start", "", url]);
        return;
    }
    if (process.platform === "darwin") {
        await execFileAsync("open", [url]);
        return;
    }
    await execFileAsync("xdg-open", [url]);
}
