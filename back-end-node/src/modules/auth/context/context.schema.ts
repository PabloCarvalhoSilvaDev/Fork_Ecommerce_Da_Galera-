import { z } from "zod";

export const contextSelectionSchema = z
  .object({
    context: z.enum(["STORE", "ADMIN"]),
  })
  .strict();
