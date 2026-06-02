import { Tool } from "./tool.js";
import { z } from "zod";
import fs from "fs/promises";
import { makePathSafe, ensureDir } from "./_common.js";

const InputSchema = z.object({
  appId: z.string().describe("ID of the app"),
  filePath: z
    .string()
    .describe("Relative path to the file within the app directory"),
  content: z.string().describe("Full content to write to the file"),
});

type InputSchemaType = z.infer<typeof InputSchema>;

export const writeTool: Tool<InputSchemaType> = {
  name: "write_app_file",
  description: "Write (create or overwrite) a file in an app's directory",
  inputSchema: InputSchema,
  execute: async ({ appId, filePath, content }) => {
    const safeFilePath = makePathSafe(`${appId}/${filePath}`);
    await ensureDir(safeFilePath);
    await fs.writeFile(safeFilePath, content, "utf-8");
    return { content: [{ type: "text", text: `Written: ${filePath}` }] };
  },
};
