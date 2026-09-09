import { requireSession } from "../lib/auth/store.js";
import { BrightspaceClient } from "../lib/brightspace/client.js";
import { getTOC } from "../lib/brightspace/content.js";
import { listMyCourses } from "../lib/brightspace/enrollments.js";
import { resolveCourse } from "../lib/resolve.js";
import type { TOCModule, TOCTopic } from "../lib/brightspace/types.js";

/**
 * Map a TOC topic type to a label for display.
 */
function topicTypeStr(topic: TOCTopic): string {
    const type = topic.TopicType ?? topic.Type;
    if (type === 1) return "file";
    if (type === 3) return "link";
    return "other";
}

/**
 * Recursively print the TOC and its children as a tree.
 */
function printTOC(mod: TOCModule, prefix: string, isLast: boolean): void {
    const branch = isLast ? "└── " : "├── ";
    console.log(`${prefix}${branch}${mod.Title}`);
    const childPrefix = prefix + (isLast ? "    " : "│   ");

    const modules = mod.Modules ?? [];
    const topics = mod.Topics ?? [];
    const total = modules.length + topics.length;
    let i = 0;

    for (const child of modules) {
        i += 1;
        printTOC(child, childPrefix, i === total);
    }

    for (const topic of topics) {
        i += 1;
        const tBranch = (i === total ? "└── " : "├── ");
        const typeStr = topicTypeStr(topic);
        const extra = (typeStr === "link" && topic.Url ? `  ${topic.Url}` : "");
        console.log(`${childPrefix}${tBranch}${topic.Title}  ${typeStr}${extra}`);
    }
}

/**
 * Resolve a course and print its TOC as a tree.
 */
export default async function contentCommand(courseQuery: string): Promise<void> {
    const session = await requireSession();
    const client = new BrightspaceClient(session);
    const courses = await listMyCourses(client);
    const course = resolveCourse(courses, courseQuery);
    const toc = await getTOC(client, course.OrgUnit.Id);

    console.log(course.OrgUnit.Code ?? course.OrgUnit.Name);
    const modules = toc.Modules ?? [];
    modules.forEach((mod, idx) => printTOC(mod, "", idx === modules.length - 1));
}
