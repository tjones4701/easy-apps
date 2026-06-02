import { Tool } from "./tool.js";
import { z } from "zod";
import fs from "fs/promises";
import { makePathSafe } from "./_common.js";

const InputSchema = z.object({
  appId: z.string().describe("ID of the app"),
  filePath: z
    .string()
    .describe(
      "Relative path to the file within the app directory (e.g. frontend/src/App.tsx)",
    ),
  startLine: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("1-based line number to start reading from (inclusive)"),
  endLine: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("1-based line number to stop reading at (inclusive)"),
});

type InputSchemaType = z.infer<typeof InputSchema>;

export const readTool: Tool<InputSchemaType> = {
  name: "read_app_file",
  description:
    "Read the contents of a file in an app's directory. Optionally specify startLine and endLine (1-based, inclusive) to read only a portion of the file.",
  inputSchema: InputSchema,
  execute: async ({ appId, filePath, startLine, endLine }) => {
    const safeFilePath = makePathSafe(`${appId}/${filePath}`);
    const content = await fs.readFile(safeFilePath, "utf-8");
    const lines = content.split("\n");
    const start = startLine ?? 1;
    const end = endLine ?? lines.length;
    const slice = lines.slice(start - 1, end);
    const numbered = slice
      .map((line, i) => `${String(start + i).padStart(4, " ")} | ${line}`)
      .join("\n");
    return { content: [{ type: "text", text: numbered }] };
  },
};
