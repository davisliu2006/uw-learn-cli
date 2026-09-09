/**
 * Browser cookie persisted for LEARN API requests.
 */
export type StoredCookie = {
    name: string;
    value: string;
    domain: string;
    path: string;
    secure: boolean;
    httpOnly: boolean;
    expires: number;
};

/**
 * Returned by (/d2l/api/lp/{version}/users/whoami).
 */
export type WhoAmIUser = {
    Identifier: string;
    FirstName: string;
    LastName: string;
    UniqueName: string;
    ProfileIdentifier?: string;
};

/**
 * Local session written to session.json after login.
 */
export type AuthSession = {
    host: string;
    cookies: StoredCookie[];
    user: {
        identifier: string;
        displayName: string;
        uniqueName: string;
    };
    savedAt: string;
};
