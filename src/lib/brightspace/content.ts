import { LE_VERSION } from "../config.js";
import type { TableOfContents } from "./types.js";
import type { BrightspaceClient } from "./client.js";

/**
 * Fetch the content table of contents for a course offering.
 * Calls /d2l/api/le/{version}/{orgUnitId}/content/toc.
 */
export async function getTOC(client: BrightspaceClient, orgUnitId: number): Promise<TableOfContents> {
    return client.json<TableOfContents>(`/d2l/api/le/${LE_VERSION}/${orgUnitId}/content/toc`);
}

/**
 * Download the underlying file for a file-type content topic.
 * Calls /d2l/api/le/{version}/{orgUnitId}/content/topics/{topicId}/file?stream=true.
 */
export async function getTopicFile(
    client: BrightspaceClient,
    orgUnitId: number,
    topicId: number,
): Promise<Response> {
    return client.stream(
        `/d2l/api/le/${LE_VERSION}/${orgUnitId}/content/topics/${topicId}/file?stream=true`,
    );
}
