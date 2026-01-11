import { z } from 'zod'

/**
 * Example schema - replace with your actual schemas
 */
export const exampleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.date()
})

export type Example = z.infer<typeof exampleSchema>

