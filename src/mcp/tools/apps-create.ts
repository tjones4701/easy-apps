import { Tool } from "./tool.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { APPS_BASE_PATH } from "./_common.js";

const InputSchema = z.object({});

type InputSchemaType = z.infer<typeof InputSchema>;

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".html",
  ".css",
  ".scss",
  ".json",
  ".md",
  ".txt",
]);

async function copyDir(
  src: string,
  dest: string,
  appId: string,
): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, appId);
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      const content = await fs.readFile(srcPath, "utf-8");
      await fs.writeFile(
        destPath,
        content.replaceAll("{{app_id}}", appId),
        "utf-8",
      );
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export const createAppTool: Tool<InputSchemaType> = {
  name: "create_app",
  description:
    "Create a new app by copying the template folder with a randomly generated ID",
  inputSchema: InputSchema,
  execute: async () => {
    const appId = randomBytes(4).toString("hex");
    const templatePath = path.join(APPS_BASE_PATH, "template");
    const destPath = path.join(APPS_BASE_PATH, appId);

    await copyDir(templatePath, destPath, appId);

    return {
      content: [{ type: "text", text: `Created app with id: ${appId}` }],
    };
  },
};
