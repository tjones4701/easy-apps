import { Tool } from "./tool.js";
import { z } from "zod";
import fs from "fs/promises";
import { makePathSafe } from "./_common.js";

const InputSchema = z.object({
  appId: z.string().describe("ID of the app"),
  filePath: z.string().describe("Relative path to the file to delete"),
});

type InputSchemaType = z.infer<typeof InputSchema>;

export const deleteFileTool: Tool<InputSchemaType> = {
  name: "delete_app_file",
  description: "Delete a file in an app's directory",
  inputSchema: InputSchema,
  execute: async ({ appId, filePath }) => {
    const safeFilePath = makePathSafe(`${appId}/${filePath}`);
    await fs.rm(safeFilePath, { force: true });
    return { content: [{ type: "text", text: `Deleted: ${filePath}` }] };
  },
};
