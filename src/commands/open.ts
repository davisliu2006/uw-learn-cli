import { requireSession } from "../lib/auth/store.js";
import { BrightspaceClient } from "../lib/brightspace/client.js";
import { getTOC } from "../lib/brightspace/content.js";
import { openInBrowser } from "../lib/browser.js";
import { HOST } from "../lib/config.js";
import type { ShellState } from "../lib/shell-state.js";
import { flattenToc, topicType } from "../lib/toc.js";
import type { FlatTOCRow } from "../lib/toc.js";
import type { TOCTopic } from "../lib/brightspace/types.js";

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
 * Look up a TOC row by its display line number.
 */
function rowAtIndex(rows: FlatTOCRow[], index: number): FlatTOCRow {
    if (rows.length === 0) {
        throw new Error("Course has no content.");
    }
    const last = rows[rows.length - 1].index;
    if (index < 1 || index > last) {
        throw new Error(`Line ${index} is out of range (1-${last}).`);
    }
    const row = rows.find((r) => r.index === index);
    if (!row) {
        throw new Error(`No content at line ${index}.`);
    }
    return row;
}

/**
 * Resolve the browser URL for a content topic.
 */
function topicUrl(orgUnitId: number, topic: TOCTopic): string {
    if (topicType(topic) === "link" && topic.Url) {
        if (/^https?:\/\//i.test(topic.Url)) {
            return topic.Url;
        }
        if (topic.Url.startsWith("/")) {
            return `${HOST}${topic.Url}`;
        }
    }
    return `${HOST}/d2l/le/content/${orgUnitId}/viewContent/${topic.TopicId}/View`;
}

/**
 * Course content table-of-contents page.
 */
function contentHomeUrl(orgUnitId: number): string {
    return `${HOST}/d2l/le/content/${orgUnitId}/Home`;
}

/**
 * Open a content line from the shell's current course in the default browser.
 */
export default async function openCommand(
    lineArg: string,
    state: ShellState,
): Promise<void> {
    const line = parseLineIndex(lineArg, "Line");
    const course = state.requireCurrentCourse();
    const session = await requireSession();
    const client = new BrightspaceClient(session);
    const toc = await getTOC(client, course.id);
    const rows = flattenToc(toc.Modules ?? []);
    const row = rowAtIndex(rows, line);

    const url = row.kind === "module"
        ? contentHomeUrl(course.id)
        : topicUrl(course.id, row.topic);
    console.log(`Opening ${row.title}`);
    console.log(url);
    await openInBrowser(url);
}
