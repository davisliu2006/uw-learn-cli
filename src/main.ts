#!/usr/bin/env node

import buildCLI from "./cli.js";
import runShell from "./shell.js";

/**
 * CLI entrypoint.
 * Command with no arguments starts interactive shell.
 * Otherwise, run a one-shot command.
 */
async function main(): Promise<void> {
    if (process.argv.length <= 2) {
        await runShell();
        return;
    }

    const program = buildCLI();
    await program.parseAsync(process.argv);
}

// print error if program throws
main().catch((err: Error) => {
    console.error(err.message);
    process.exit(1);
});
