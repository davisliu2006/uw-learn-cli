#!/usr/bin/env node

import { CLI_NAME } from "./lib/config.js";
import runShell from "./shell.js";

/**
 * CLI entrypoint. Always opens the interactive shell.
 * One-shot subcommands are disabled so shell state (e.g. current course) stays in-process.
 */
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        console.error(
            `One-shot commands are disabled. Run \`${CLI_NAME}\` to open the interactive shell.`,
        );
        process.exit(1);
    }

    await runShell();
}

main().catch((err: Error) => {
    console.error(err.message);
    process.exit(1);
});
