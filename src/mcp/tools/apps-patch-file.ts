import { Tool } from "./tool.js";
import { z } from "zod";
import fs from "fs/promises";
import { makePathSafe } from "./_common.js";

const LineReplacement = z.object({
  startLine: z
    .number()
    .int()
    .min(1)
    .describe("1-based line number where the replacement starts (inclusive)"),
  endLine: z
    .number()
    .int()
    .min(1)
    .describe("1-based line number where the replacement ends (inclusive)"),
  newContent: z
    .string()
    .describe(
      "Text to replace the specified line range with. May span multiple lines.",
    ),
});

const InputSchema = z.object({
  appId: z.string().describe("ID of the app"),
  filePath: z.string().describe("Relative path to the file to patch"),
  replacements: z
    .array(LineReplacement)
    .min(1)
    .describe(
      "One or more line-range replacements to apply. Ranges must not overlap. " +
        "Use read_app_file first to see line numbers.",
    ),
});

type InputSchemaType = z.infer<typeof InputSchema>;

export const patchFileTool: Tool<InputSchemaType> = {
  name: "patch_app_file",
  description:
    "Replace one or more line ranges within a file. " +
    "Use read_app_file first to obtain the current content with line numbers, " +
    "then specify startLine/endLine (1-based, inclusive) and newContent for each replacement. " +
    "Replacements are applied from bottom to top so line numbers stay stable.",
  inputSchema: InputSchema,
  execute: async ({ appId, filePath, replacements }) => {
    const safeFilePath = makePathSafe(`${appId}/${filePath}`);
    const content = await fs.readFile(safeFilePath, "utf-8");
    const lines = content.split("\n");
    const totalLines = lines.length;

    // Validate ranges
    for (const r of replacements) {
      if (r.startLine > r.endLine) {
        return {
          content: [
            {
              type: "text",
              text: `Error: startLine (${r.startLine}) must be <= endLine (${r.endLine})`,
            },
          ],
        };
      }
      if (r.endLine > totalLines) {
        return {
          content: [
            {
              type: "text",
              text: `Error: endLine (${r.endLine}) exceeds file length (${totalLines} lines)`,
            },
          ],
        };
      }
    }

    // Sort descending so later replacements don't shift earlier line numbers
    const sorted = [...replacements].sort((a, b) => b.startLine - a.startLine);

    // Check for overlaps after sorting
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1].endLine >= sorted[i].startLine) {
        return {
          content: [
            { type: "text", text: "Error: replacement ranges overlap" },
          ],
        };
      }
    }

    const result = [...lines];
    for (const r of sorted) {
      const newLines = r.newContent.split("\n");
      result.splice(r.startLine - 1, r.endLine - r.startLine + 1, ...newLines);
    }

    await fs.writeFile(safeFilePath, result.join("\n"), "utf-8");
    return {
      content: [
        {
          type: "text",
          text: `Patched ${filePath}: applied ${replacements.length} replacement(s)`,
        },
      ],
    };
  },
};
