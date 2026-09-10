/**
 * Course selected via `get` for the current interactive shell process.
 */
export type CurrentCourse = {
    id: number;
    code: string | null;
    name: string;
};

/**
 * In-memory state for one interactive shell process.
 * Cleared when the process exits.
 */
export class ShellState {
    private currentCourse: CurrentCourse | null = null;

    /**
     * Return the course selected by the last `get`, or null.
     */
    getCurrentCourse(): CurrentCourse | null {
        return this.currentCourse;
    }

    /**
     * Remember the course from a successful `get`.
     */
    setCurrentCourse(course: CurrentCourse): void {
        this.currentCourse = course;
    }

    /**
     * Return the current course or throw if none is selected.
     */
    requireCurrentCourse(): CurrentCourse {
        if (!this.currentCourse) {
            throw new Error("No course selected. Run: get <course>");
        }
        return this.currentCourse;
    }
}
