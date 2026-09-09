import { createWriteStream } from "fs";
import { mkdir, rename, rm, stat } from "fs/promises";
import { dirname } from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const UNSAFE = /[<>:"/\\|?*\u0000-\u001f]/g;

/**
 * Make a string safe for use as a Windows/macOS/Linux path segment.
 */
export function sanitizeName(name: string): string {
    const cleaned = name.replace(UNSAFE, "_").replace(/\s+/g, " ").trim();
    if (!cleaned || cleaned === "." || cleaned === "..") return "_";
    return cleaned.slice(0, 120);
}

/**
 * Prefer Content-Disposition filename when present; otherwise sanitize fallback.
 */
export function filenameFromDisposition(header: string | null, fallback: string): string {
    if (!header) return sanitizeName(fallback);

    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
    if (utf8?.[1]) {
        try {
            return sanitizeName(decodeURIComponent(utf8[1]));
        } catch {
            // fall through
        }
    }

    const plain = /filename="?([^";]+)"?/i.exec(header);
    if (plain?.[1]) return sanitizeName(plain[1]);

    return sanitizeName(fallback);
}

/**
 * Return whether a filesystem path already exists.
 */
export async function pathExists(path: string): Promise<boolean> {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
}

/**
 * Stream a Response body to destPath via a temporary .part file, then rename.
 */
export async function writeResponseToFile(res: Response, destPath: string): Promise<void> {
    await mkdir(dirname(destPath), { recursive: true });
    const partPath = `${destPath}.part`;
    try {
        if (!res.body) throw new Error("Empty response body");
        const nodeStream = Readable.fromWeb(res.body as import("stream/web").ReadableStream);
        await pipeline(nodeStream, createWriteStream(partPath));
        await rename(partPath, destPath);
    } catch (err) {
        await rm(partPath, { force: true }).catch(() => undefined);
        throw err;
    }
}
