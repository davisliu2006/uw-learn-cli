import { Command } from "commander";
import { APP_NAME } from "./lib/config.js";
import { ShellState } from "./lib/shell-state.js";
import loginCommand from "./commands/login.js";
import logoutCommand from "./commands/logout.js";
import whoamiCommand from "./commands/whoami.js";
import listCoursesCommand from "./commands/list-courses.js";
import getCourseCommand from "./commands/get-course.js";
import downloadCommand from "./commands/download.js";

/**
 * Wire subcommands using Commander.
 */
export default function buildCLI(state: ShellState): Command {
    const program = new Command();

    program
        .name(APP_NAME)
        .description("CLI for University of Waterloo LEARN")
        .version("0.1.0");

    program
        .command("login")
        .description("Open a browser, sign in to LEARN, and save the session")
        .action(loginCommand);

    program
        .command("logout")
        .description("Clear the saved LEARN session")
        .action(logoutCommand);

    program
        .command("whoami")
        .description("Show the current LEARN user")
        .action(whoamiCommand);

    program
        .command("list-courses")
        .alias("list")
        .description("List enrolled course offerings")
        .action(listCoursesCommand);

    program
        .command("get-course")
        .alias("get")
        .description("Select a course for this shell and show its numbered content tree")
        .argument("<course>", "Course id, code, or name")
        .action((course: string) => getCourseCommand(course, state));

    program
        .command("download")
        .description("Download file topics for the course selected by get")
        .argument("<start>", "Start content line number (inclusive, from get)")
        .argument("[end]", "End content line number (inclusive); defaults to start")
        .option("-o, --outdir <dir>", "Parent directory for the course folder (default: cwd)")
        .option("--dry-run", "List files that would be downloaded without writing")
        .action((
            start: string,
            end: string | undefined,
            opts: { dryRun?: boolean; outdir?: string },
        ) => downloadCommand(start, end, opts, state));

    return program;
}
