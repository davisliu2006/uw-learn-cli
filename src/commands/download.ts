import { cwd } from "process";
import { join, relative } from "path";
import { requireSession } from "../lib/auth/store.js";
import { BrightspaceClient } from "../lib/brightspace/client.js";
import { getTOC, getTopicFile } from "../lib/brightspace/content.js";
import {
    filenameFromDisposition,
    pathExists,
    resolvePath,
    sanitizeName,
    writeResponseToFile,
} from "../lib/fs.js";
import type { ShellState } from "../lib/shell-state.js";
import { filesForRange, flattenToc } from "../lib/toc.js";

export type DownloadOptions = {
    dryRun?: boolean;
    outdir?: string;
};

/**
 * Parse a required line-number argument.
 */
function parseLineIndex(value: string, label: string): number {
    if (!/^\d+$/.test(value)) {
        throw new Error(`${label} must be a positive integer.`);
    }
    return Number(value);
}

/**
 * Download file topics for the shell's current course into <outdir>/{CourseCode}/.
 * start/end are inclusive content line numbers from `get` (end defaults to start).
 * outdir defaults to the current working directory.
 */
export default async function downloadCommand(
    startArg: string,
    endArg: string | undefined,
    options: DownloadOptions,
    state: ShellState,
): Promise<void> {
    const start = parseLineIndex(startArg, "Start");
    const end = endArg !== undefined ? parseLineIndex(endArg, "End") : start;

    const course = state.requireCurrentCourse();
    const session = await requireSession();
    const client = new BrightspaceClient(session);
    const toc = await getTOC(client, course.id);

    const rootName = sanitizeName(course.code ?? String(course.id));
    const outParent = options.outdir ? resolvePath(options.outdir) : cwd();
    const outRoot = join(outParent, rootName);
    const displayRoot = relative(cwd(), outRoot) || outRoot;
    const rows = flattenToc(toc.Modules ?? []);
    const { files, unsupported } = filesForRange(rows, start, end);

    const dryRun = Boolean(options.dryRun);
    console.log(
        `${dryRun ? "Dry run: would download" : "Downloading"} ${files.length} file(s) to ${outRoot} (lines ${start}-${end})`,
    );

    if (dryRun) {
        for (const item of files) {
            const name = sanitizeName(item.topic.Title || `topic-${item.topic.TopicId}`);
            console.log(`would ${join(displayRoot, item.relDir, name)}`);
        }
        console.log(`\nDone. would=${files.length} unsupported=${unsupported}`);
        return;
    }

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of files) {
        const fallbackName = item.topic.Title || `topic-${item.topic.TopicId}`;
        let destPath = join(outRoot, item.relDir, sanitizeName(fallbackName));

        try {
            if (await pathExists(destPath)) {
                console.log(`skip  ${join(displayRoot, item.relDir, sanitizeName(fallbackName))}`);
                skipped += 1;
                continue;
            }

            const res = await getTopicFile(client, course.id, item.topic.TopicId);
            const filename = filenameFromDisposition(
                res.headers.get("content-disposition"),
                fallbackName,
            );
            destPath = join(outRoot, item.relDir, filename);

            if (await pathExists(destPath)) {
                console.log(`skip  ${join(displayRoot, item.relDir, filename)}`);
                skipped += 1;
                continue;
            }

            await writeResponseToFile(res, destPath);
            console.log(`ok    ${join(displayRoot, item.relDir, filename)}`);
            downloaded += 1;
        } catch (err) {
            failed += 1;
            console.error(`fail  ${item.topic.Title}: ${(err as Error).message}`);
        }
    }

    console.log(
        `\nDone. downloaded=${downloaded} skipped=${skipped} unsupported=${unsupported} failed=${failed}`,
    );
    if (failed > 0) {
        throw new Error(`Download finished with ${failed} failure(s).`);
    }
}
