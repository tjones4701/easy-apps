import { Tool } from "./tool.js";
import { z } from "zod";
import { execFile } from "child_process";
import { promisify } from "util";
import { makePathSafe, APPS_BASE_PATH } from "./_common.js";

const execFileAsync = promisify(execFile);

const InputSchema = z.object({
  appId: z.string().describe("ID of the app to search within"),
  pattern: z
    .string()
    .min(1)
    .max(200)
    .describe("The grep pattern (regular expression) to search for"),
  include: z
    .string()
    .optional()
    .describe(
      "Glob pattern to restrict which files are searched (e.g. '*.ts', '*.tsx'). Optional.",
    ),
  caseSensitive: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether the search is case-sensitive. Defaults to true."),
});

type InputSchemaType = z.infer<typeof InputSchema>;

// Validate that the pattern doesn't contain shell metacharacters that could
// be used for injection. We pass args as an array so the shell is never
// invoked, but defence-in-depth is good.
const SAFE_PATTERN = /^[^\x00]*$/; // no null bytes

export const grepTool: Tool<InputSchemaType> = {
  name: "grep_app_files",
  description:
    "Search for a pattern (regex) across files in a specific app's directory. Returns matching lines with file paths and line numbers.",
  inputSchema: InputSchema,
  execute: async ({ appId, pattern, include, caseSensitive }) => {
    if (!SAFE_PATTERN.test(pattern)) {
      throw new Error("Pattern contains invalid characters.");
    }

    // Resolve and validate the search root – this is the security boundary.
    const searchRoot = makePathSafe(appId);

    const args: string[] = [
      "--line-number",
      "--with-filename",
      "--recursive",
      "--extended-regexp",
    ];

    if (!caseSensitive) {
      args.push("--ignore-case");
    }

    if (include) {
      // Validate include glob: only allow safe characters
      if (!/^[\w\-.*?/\\]+$/.test(include)) {
        throw new Error("include pattern contains invalid characters.");
      }
      args.push(`--include=${include}`);
    }

    // Limit output to avoid flooding the context window
    args.push("--max-count=50");

    args.push(pattern, searchRoot);

    let stdout = "";
    let stderr = "";
    try {
      ({ stdout, stderr } = await execFileAsync("grep", args, {
        timeout: 10_000,
        // No shell: true — args are passed directly, avoiding shell injection
      }));
    } catch (err: any) {
      // grep exits with code 1 when there are no matches — that's not an error
      if (err.code === 1) {
        return { content: [{ type: "text", text: "No matches found." }] };
      }
      // grep exits with code 2 on real errors
      const msg = err.stderr ?? err.message ?? "grep failed";
      throw new Error(`grep error: ${msg}`);
    }

    if (stderr) {
      throw new Error(`grep stderr: ${stderr}`);
    }

    // Strip the absolute base path from output so paths are app-relative
    const relative = stdout.replaceAll(
      searchRoot + (searchRoot.endsWith("\\") ? "" : "\\"),
      "",
    );

    return {
      content: [{ type: "text", text: relative || "No matches found." }],
    };
  },
};
