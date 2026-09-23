import { z } from "zod";

/** HH:MM time string (first five chars of ISO-ish inputs accepted). */
export const hhmm = z
  .string()
  .transform((value) => value.slice(0, 5))
  .refine((value) => /^\d{2}:\d{2}$/.test(value));
