import { requireSession } from "../lib/auth/store.js";
import { BrightspaceClient } from "../lib/brightspace/client.js";
import { listMyCourses } from "../lib/brightspace/enrollments.js";
import { yellow } from "../lib/fonts.js";

/**
 * Format ISO date.
 */
function formatDate(iso: string | null | undefined): string {
    if (!iso) {return "(no date)";}
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {return "(no date)";}
    return d.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/**
 * List enrolled courses.
 */
export default async function listCoursesCommand(): Promise<void> {
    const session = await requireSession();
    const client = new BrightspaceClient(session);
    const courses = await listMyCourses(client);

    if (courses.length === 0) {
        console.log("No course offerings found.");
        return;
    }

    for (const [i, c] of courses.entries()) {
        const start = formatDate(c.Access?.StartDate);
        const end = formatDate(c.Access?.EndDate);
        if (i > 0) {console.log();}
        console.log(
            `(${yellow(String(c.OrgUnit.Id))}) ${c.OrgUnit.Code ?? "(no code)"}`
        );
        console.log(c.OrgUnit.Name);
        console.log(`${start} - ${end}`);
    }
}
