import type { MyOrgUnitInfo } from "./brightspace/types.js";

/**
 * Match a user course argument (id, code, or name substring) to one enrollment.
 * Prefers an exact code match when several courses match; otherwise exits if ambiguous or missing.
 */
export function resolveCourse(courses: MyOrgUnitInfo[], query: string): MyOrgUnitInfo {
    const q = query.trim().toLowerCase();
    if (!q) {
        console.error("Course argument is required.");
        process.exit(1);
    }

    const matches = courses.filter((c) => {
        const id = String(c.OrgUnit.Id);
        const code = (c.OrgUnit.Code ?? "").toLowerCase();
        const name = c.OrgUnit.Name.toLowerCase();
        return id === q || code === q || code.includes(q) || name.includes(q);
    });

    if (matches.length === 0) {
        console.error(`No course matched "${query}".`);
        process.exit(1);
    }

    if (matches.length > 1) {
        // Prefer exact code match when ambiguous.
        const exact = matches.filter((c) => (c.OrgUnit.Code ?? "").toLowerCase() === q);
        if (exact.length === 1) return exact[0];

        console.error(`Multiple courses matched "${query}":`);
        for (const m of matches) {
            console.error(`  ${m.OrgUnit.Id}\t${m.OrgUnit.Code ?? "-"}\t${m.OrgUnit.Name}`);
        }
        process.exit(1);
    }

    return matches[0];
}
