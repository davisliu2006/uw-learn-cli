/**
 * Nested in MyOrgUnitInfo.
 */
export type OrgUnitInfo = {
    Id: number;
    Name: string;
    Code: string | null;
    Type: {
        Id: number;
        Code: string;
        Name: string;
    };
};

/**
 * Returned by (/d2l/api/lp/{version}/enrollments/myenrollments/).
 */
export type MyOrgUnitInfo = {
    OrgUnit: OrgUnitInfo;
    Access?: {
        StartDate: string | null;
        EndDate: string | null;
    };
};

/**
 * Returned by (/d2l/api/lp/{version}/enrollments/myenrollments/) and other paged Valence lists.
 */
export type PagedResult<T> = {
    PagingInfo: {
        Bookmark: string | null;
        HasMoreItems: boolean;
    };
    Items: T[];
};

/**
 * Nested in TocModule (from /content/toc).
 * Note: ToC topics use TypeIdentifier/ActivityType, not ContentObject TopicType.
 */
export type TOCTopic = {
    TopicId: number;
    Title: string;
    TypeIdentifier?: string;
    ActivityType?: number;
    Url?: string | null;
};

/**
 * Nested in TableOfContents.
 */
export type TOCModule = {
    ModuleId: number;
    Title: string;
    Modules?: TOCModule[];
    Topics?: TOCTopic[];
};

/**
 * Returned by (/d2l/api/le/{version}/{orgUnitId}/content/toc).
 */
export type TableOfContents = {
    Modules: TOCModule[];
};
