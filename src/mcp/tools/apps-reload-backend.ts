import { Tool } from "./tool.js";
import { z } from "zod";
import { markDirty } from "../../backend-registry.js";

const InputSchema = z.object({
  appId: z.string().describe("ID of the app whose backend should be reloaded"),
});

type InputSchemaType = z.infer<typeof InputSchema>;

export const reloadBackendTool: Tool<InputSchemaType> = {
  name: "reload_app_backend",
  description:
    "Mark an app's backend as dirty so it is reloaded on the next HTTP request. Use this after writing or patching backend files.",
  inputSchema: InputSchema,
  execute: async ({ appId }) => {
    markDirty(appId);
    return {
      content: [
        {
          type: "text",
          text: `Backend for app "${appId}" marked for reload. It will be re-imported on the next request to /apps/${appId}/api/.`,
        },
      ],
    };
  },
};
