import { Tool } from "./tool.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { makePathSafe, APPS_BASE_PATH } from "./_common.js";
import path from "path";

const execAsync = promisify(exec);

const ROOT_DIR = path.resolve(APPS_BASE_PATH, "..");

async function runTsc(
  label: string,
  cwd: string,
  args: string = "--noEmit",
): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(`npx tsc ${args}`, { cwd });
    const output = [stdout, stderr].filter(Boolean).join("\n");
    return `[${label}] ${output || "No errors"}`;
  } catch (err: any) {
    return `[${label}] Errors:\n${err.stdout || err.message}`;
  }
}

const InputSchema = z.object({
  appId: z.string().describe("ID of the app to check"),
});

type InputSchemaType = z.infer<typeof InputSchema>;

export const buildTool: Tool<InputSchemaType> = {
  name: "check_app",
  description:
    "Run TypeScript type-checking on both the frontend and backend of an app to verify there are no errors.",
  inputSchema: InputSchema,
  execute: async ({ appId }) => {
    const frontendDir = makePathSafe(`${appId}/frontend`);

    const [frontendResult, backendResult] = await Promise.all([
      runTsc("frontend", frontendDir),
      runTsc("backend", ROOT_DIR, `--noEmit apps/${appId}/backend/index.ts`),
    ]);

    const text = [frontendResult, backendResult].join("\n\n");
    return { content: [{ type: "text", text: text }] };
  },
};
