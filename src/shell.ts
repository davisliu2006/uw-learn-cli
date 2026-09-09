import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import buildCLI from "./cli.js";
import { APP_NAME } from "./lib/config.js";

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
    const program = buildCLI();
    program.exitOverride();
    program.addHelpCommand("help [command]", "display help for a command");

    const rl = createInterface({ input, output, terminal: true });

    console.log(`${APP_NAME} interactive shell. Type help or exit.`);

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

            if (!line) continue;
            if (line === "exit" || line === "quit") break;

            const args = tokenize(line);
            try {
                await program.parseAsync(args, { from: "user" });
            } catch (err) {
                const code = (err as { code?: string }).code;
                if (
                    code === "commander.helpDisplayed" ||
                    code === "commander.help" ||
                    code === "commander.version"
                ) {
                    continue;
                }
                const message = (err as Error).message;
                if (message) console.error(message);
            }
        }
    } finally {
        rl.close();
    }
}
