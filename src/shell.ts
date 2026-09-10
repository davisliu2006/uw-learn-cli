import { createInterface } from "readline/promises";
import { stdin, stdout } from "process";
import buildCLI from "./cli.js";
import { CLI_NAME } from "./lib/config.js";
import { ShellState } from "./lib/shell-state.js";

/**
 * Split a shell line into argv tokens, respecting simple single/double quotes.
 */
function tokenize(line: string): string[] {
    const tokens: string[] = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(line)) !== null) {
        tokens.push(match[1] ?? match[2] ?? match[3]);
    }
    return tokens;
}

/**
 * Run an interactive REPL that parses each line with Commander.
 */
export default async function runShell(): Promise<void> {
    const state = new ShellState();
    const program = buildCLI(state);
    program.addHelpCommand("help [command]", "display help for a command");
    // Prevent Commander from killing the process on help / usage errors.
    program.exitOverride();
    for (const cmd of program.commands) {
        cmd.exitOverride();
    }

    const rl = createInterface({
        input: stdin,
        output: stdout,
        terminal: true,
    });
    console.log(`${CLI_NAME} interactive shell. Type 'help' for a list of commands or 'exit' to exit shell.`);

    try {
        while (true) {
            let line: string;
            try {
                line = (await rl.question("> ")).trim();
            } catch {
                // EOF (Ctrl+D)
                console.log();
                break;
            }
            if (!line) {continue;}

            const args = tokenize(line);
            if (args.length >= 1 && args[0] === "exit") {
                break;
            }

            try {
                await program.parseAsync(args, { from: "user" });
            } catch (err) {
                const code = (err as { code?: string }).code;
                // Commander already wrote help / usage errors to stderr.
                if (typeof code === "string" && code.startsWith("commander.")) {
                    continue;
                }
                const message = (err as Error).message;
                if (message) {
                    console.error(message);
                }
            }
        }
    } finally {
        rl.close();
    }
}
