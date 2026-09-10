import { join } from "path";
import { sanitizeName } from "./fs.js";
import type { TOCModule, TOCTopic } from "./brightspace/types.js";

/**
 * A downloadable file with topic and relative path under the course root.
 */
export type FileItem = {
    topic: TOCTopic;
    relDir: string;
};

/**
 * An indexed row in flattened TOC.
 */
export type FlatTOCRow =
    {
        index: number;
        kind: "module";
        title: string;
        module: TOCModule;
        relParts: string[];
        depth: number;
    } | {
        index: number;
        kind: "topic";
        title: string;
        topic: TOCTopic;
        relParts: string[];
        depth: number;
    };

/**
 * Read the TOC topic kind.
 * Prefer TypeIdentifier ("File", "Link", ...);
 * fall back to ActivityType (File=1, Link=2, ...).
 */
export function topicType(topic: TOCTopic): string {
    if (topic.TypeIdentifier) {
        return topic.TypeIdentifier.toLowerCase();
    }
    switch (topic.ActivityType) {
        case 1:
            return "file";
        case 2:
            return "link";
        default:
            return "other";
    }
}

/**
 * Whether a TOC topic is a downloadable file.
 */
export function isFileTopic(topic: TOCTopic): boolean {
    return topicType(topic) === "file";
}

/**
 * Flatten the TOC into numbered rows. Order matches the content tree:
 * module, then nested modules, then that module's topics.
 */
export function flattenToc(modules: TOCModule[]): FlatTOCRow[] {
    const rows: FlatTOCRow[] = [];
    let index = 0;

    const walk = (mod: TOCModule, parentParts: string[], depth: number): void => {
        const relParts = [...parentParts, sanitizeName(mod.Title)];
        index += 1;
        rows.push({
            index,
            kind: "module",
            title: mod.Title,
            module: mod,
            relParts,
            depth,
        });
        for (const child of mod.Modules ?? []) {
            walk(child, relParts, depth + 1);
        }
        for (const topic of mod.Topics ?? []) {
            index += 1;
            rows.push({
                index,
                kind: "topic",
                title: topic.Title,
                topic,
                relParts,
                depth: depth + 1,
            });
        }
    };

    for (const mod of modules) {
        walk(mod, [], 0);
    }
    return rows;
}

/**
 * Collect file topics under a module (including nested modules).
 */
function collectModuleFiles(mod: TOCModule, relParts: string[], out: Map<number, FileItem>): void {
    for (const topic of mod.Topics ?? []) {
        if (isFileTopic(topic)) {
            out.set(topic.TopicId, { topic, relDir: join(...relParts) });
        }
    }
    for (const child of mod.Modules ?? []) {
        collectModuleFiles(child, [...relParts, sanitizeName(child.Title)], out);
    }
}

/**
 * Count non-file topics under a module subtree.
 */
function countUnsupportedInModule(mod: TOCModule): number {
    let n = 0;
    for (const topic of mod.Topics ?? []) {
        if (!isFileTopic(topic)) {
            n += 1;
        }
    }
    for (const child of mod.Modules ?? []) {
        n += countUnsupportedInModule(child);
    }
    return n;
}

/**
 * Last content line index belonging to a module's subtree (inclusive).
 */
function subtreeEndIndex(rows: FlatTOCRow[], moduleRow: FlatTOCRow & { kind: "module" }): number {
    for (const row of rows) {
        if (row.index <= moduleRow.index) {
            continue;
        }
        if (row.depth <= moduleRow.depth) {
            return row.index - 1;
        }
    }
    return rows[rows.length - 1].index;
}

/**
 * Resolve an inclusive line range to downloadable files (TOC order, deduped).
 * A module row selects its whole subtree; a topic row selects that file only.
 * When end is omitted, only the start line is selected.
 */
export function filesForRange(
    rows: FlatTOCRow[],
    start: number,
    end: number = start,
): { files: FileItem[]; unsupported: number } {
    if (rows.length === 0) {
        return { files: [], unsupported: 0 };
    }

    const lo = start;
    const hi = end;

    if (!Number.isInteger(lo) || !Number.isInteger(hi)) {
        throw new Error("Start and end must be integers.");
    }
    if (lo < 1 || hi < 1) {
        throw new Error("Start and end must be >= 1.");
    }
    if (lo > hi) {
        throw new Error(`Invalid range: start (${lo}) is greater than end (${hi}).`);
    }
    if (hi > rows[rows.length - 1].index) {
        throw new Error(`End (${hi}) is past the last content line (${rows[rows.length - 1].index}).`);
    }

    const selected = rows.filter((r) => r.index >= lo && r.index <= hi);
    const byId = new Map<number, FileItem>();
    const covered = new Set<number>();
    let unsupported = 0;

    for (const row of selected) {
        if (covered.has(row.index)) {
            continue;
        }

        if (row.kind === "module") {
            const endIdx = subtreeEndIndex(rows, row);
            for (const r of rows) {
                if (r.index >= row.index && r.index <= endIdx) {
                    covered.add(r.index);
                }
            }
            collectModuleFiles(row.module, row.relParts, byId);
            unsupported += countUnsupportedInModule(row.module);
        } else if (isFileTopic(row.topic)) {
            covered.add(row.index);
            byId.set(row.topic.TopicId, {
                topic: row.topic,
                relDir: join(...row.relParts),
            });
        } else {
            covered.add(row.index);
            unsupported += 1;
        }
    }

    // Preserve TOC display order.
    const files: FileItem[] = [];
    const seen = new Set<number>();
    for (const row of rows) {
        if (row.kind !== "topic") {
            continue;
        }
        const item = byId.get(row.topic.TopicId);
        if (item && !seen.has(row.topic.TopicId)) {
            seen.add(row.topic.TopicId);
            files.push(item);
        }
    }

    return { files, unsupported };
}
