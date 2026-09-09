import { cwd } from "process";
import { join } from "path";
import { requireSession } from "../lib/auth/store.js";
import { BrightspaceClient } from "../lib/brightspace/client.js";
import { getTOC, getTopicFile } from "../lib/brightspace/content.js";
import { listMyCourses } from "../lib/brightspace/enrollments.js";
import {
    filenameFromDisposition,
    pathExists,
    sanitizeName,
    writeResponseToFile,
} from "../lib/fs.js";
import { resolveCourse } from "../lib/resolve.js";
import type { TOCModule, TOCTopic } from "../lib/brightspace/types.js";

/**
 * A downloadable file with topic and relative path.
 */
type FileItem = {
    topic: TOCTopic;
    relDir: string;
};

/**
 * Read topic type from a TOC topic (with fallbacks).
 */
function topicType(topic: TOCTopic): number | undefined {
    return topic.TopicType ?? topic.Type;
}

/**
 * Traverse TOC and collect downloadable files.
 */
function collectFiles(modules: TOCModule[], parentParts: string[], out: FileItem[]): void {
    for (const mod of modules) {
        const parts = [...parentParts, sanitizeName(mod.Title)];
        for (const topic of mod.Topics ?? []) {
            if (topicType(topic) === 1) {
                out.push({ topic, relDir: join(...parts) });
            }
        }
        collectFiles(mod.Modules ?? [], parts, out);
    }
}

/**
 * Download all file topics for a course into ./{CourseCode}/, skipping existing files.
 */
export default async function downloadCommand(courseQuery: string): Promise<void> {
    const session = await requireSession();
    const client = new BrightspaceClient(session);
    const courses = await listMyCourses(client);
    const course = resolveCourse(courses, courseQuery);
    const toc = await getTOC(client, course.OrgUnit.Id);

    const rootName = sanitizeName(course.OrgUnit.Code ?? String(course.OrgUnit.Id));
    const outRoot = join(cwd(), rootName);
    const files: FileItem[] = [];
    collectFiles(toc.Modules ?? [], [], files);

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;
    let unsupported = 0;

    /**
     * Count non-file topics for the end-of-run summary.
     */
    const countUnsupported = (modules: TOCModule[]): void => {
        for (const mod of modules) {
            for (const topic of mod.Topics ?? []) {
                if (topicType(topic) !== 1) unsupported += 1;
            }
            countUnsupported(mod.Modules ?? []);
        }
    };
    countUnsupported(toc.Modules ?? []);

    console.log(`Downloading ${files.length} file(s) to ${outRoot}`);

    for (const item of files) {
        const fallbackName = item.topic.Title || `topic-${item.topic.TopicId}`;
        let destPath = join(outRoot, item.relDir, sanitizeName(fallbackName));

        try {
            if (await pathExists(destPath)) {
                console.log(`skip  ${join(rootName, item.relDir, sanitizeName(fallbackName))}`);
                skipped += 1;
                continue;
            }

            const res = await getTopicFile(client, course.OrgUnit.Id, item.topic.TopicId);
            const filename = filenameFromDisposition(
                res.headers.get("content-disposition"),
                fallbackName,
            );
            destPath = join(outRoot, item.relDir, filename);

            if (await pathExists(destPath)) {
                console.log(`skip  ${join(rootName, item.relDir, filename)}`);
                skipped += 1;
                continue;
            }

            await writeResponseToFile(res, destPath);
            console.log(`ok    ${join(rootName, item.relDir, filename)}`);
            downloaded += 1;
        } catch (err) {
            failed += 1;
            console.error(`fail  ${item.topic.Title}: ${(err as Error).message}`);
        }
    }

    console.log(
        `\nDone. downloaded=${downloaded} skipped=${skipped} unsupported=${unsupported} failed=${failed}`,
    );
    if (failed > 0) process.exit(1);
}
