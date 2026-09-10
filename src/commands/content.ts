import { requireSession } from "../lib/auth/store.js";
import { BrightspaceClient } from "../lib/brightspace/client.js";
import { getTOC } from "../lib/brightspace/content.js";
import { listMyCourses } from "../lib/brightspace/enrollments.js";
import { blue, green, yellow } from "../lib/fonts.js";
import { resolveCourse } from "../lib/resolve.js";
import { flattenToc, topicType } from "../lib/toc.js";
import type { TOCModule } from "../lib/brightspace/types.js";

/**
 * Recursively print the TOC and its children as a numbered tree.
 * Numbering order matches flattenToc / download ranges.
 */
function printTOC(
    module: TOCModule,
    indent: string,
    isLast: boolean,
    indexRef: { n: number },
    indexWidth: number,
): void {
    indexRef.n += 1;
    const label = yellow(String(indexRef.n).padStart(indexWidth));
    const branch = isLast ? "└── " : "├── ";
    console.log(`${label} ${indent}${branch}${module.Title}`);
    const childIndent = indent + (isLast ? "    " : "│   ");

    const modules = module.Modules ?? [];
    const topics = module.Topics ?? [];
    const total = modules.length + topics.length;
    let i = 0;

    for (const child of modules) {
        i += 1;
        printTOC(child, childIndent, i === total, indexRef, indexWidth);
    }

    for (const topic of topics) {
        i += 1;
        indexRef.n += 1;
        const tNum = yellow(String(indexRef.n).padStart(indexWidth));
        const tBranch = i === total ? "└── " : "├── ";
        const typeStr = topicType(topic);
        const extra = typeStr === "link" && topic.Url ? `  ${blue(topic.Url)}` : "";
        console.log(
            `${tNum} ${childIndent}${tBranch}${topic.Title}  ${green(typeStr)}${extra}`
        );
    }
}

/**
 * Resolve a course and print its TOC as a numbered tree.
 */
export default async function contentCommand(courseQuery: string): Promise<void> {
    const session = await requireSession();
    const client = new BrightspaceClient(session);
    const courses = await listMyCourses(client);
    const course = resolveCourse(courses, courseQuery);
    const toc = await getTOC(client, course.OrgUnit.Id);

    const modules = toc.Modules ?? [];
    const rows = flattenToc(modules);
    const width = String(rows.length || 1).length;

    console.log(course.OrgUnit.Code ?? course.OrgUnit.Name);
    const counter = { n: 0 };
    modules.forEach((mod, idx) => printTOC(mod, "", idx === modules.length - 1, counter, width));
}
