import { Command } from "commander";
import { APP_NAME } from "./lib/config.js";
import loginCommand from "./commands/login.js";
import logoutCommand from "./commands/logout.js";
import whoamiCommand from "./commands/whoami.js";
import coursesCommand from "./commands/courses.js";
import contentCommand from "./commands/content.js";
import downloadCommand from "./commands/download.js";

/**
 * Wire subcommands using Commander.
 */
export default function buildCLI(): Command {
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
        .command("courses")
        .description("List enrolled course offerings")
        .action(coursesCommand);

    program
        .command("content")
        .description("Show the content tree for a course")
        .argument("<course>", "Course id, code, or name")
        .action(contentCommand);

    program
        .command("download")
        .description("Download file topics for a course into ./{CourseCode}/")
        .argument("<course>", "Course id, code, or name")
        .action(downloadCommand);

    return program;
}
