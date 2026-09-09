import { COURSE_OFFERING_TYPE_ID, LP_VERSION } from "../config.js";
import type { MyOrgUnitInfo, PagedResult } from "./types.js";
import type { BrightspaceClient } from "./client.js";

/**
 * List all course offerings the current user is enrolled in.
 * Calls /d2l/api/lp/{version}/enrollments/myenrollments/?orgUnitTypeId=3.
 */
export async function listMyCourses(client: BrightspaceClient): Promise<MyOrgUnitInfo[]> {
    const items: MyOrgUnitInfo[] = [];
    let bookmark: string | null = null;

    for (;;) {
        const params = new URLSearchParams({
            orgUnitTypeId: String(COURSE_OFFERING_TYPE_ID),
        });
        if (bookmark) {
            params.set("bookmark", bookmark);
        }

        const page = await client.json<PagedResult<MyOrgUnitInfo>>(
            `/d2l/api/lp/${LP_VERSION}/enrollments/myenrollments/?${params}`,
        );

        items.push(...page.Items);
        if (!page.PagingInfo.HasMoreItems) {break;}
        bookmark = page.PagingInfo.Bookmark;
        if (!bookmark) {break;}
    }

    return items;
}
