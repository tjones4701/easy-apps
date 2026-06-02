import { z } from "zod";
export type Tool<INPUT, OUTPUT = any> = {
  name: string;
  description?: string;
  inputSchema?: z.ZodType<INPUT>; // Replace 'INPUT' with the actual type of your schema
  outputSchema?: z.ZodType<OUTPUT>; // Replace 'OUTPUT' with the actual type of your schema
  execute: (input: INPUT) => Promise<OUTPUT>;
};
