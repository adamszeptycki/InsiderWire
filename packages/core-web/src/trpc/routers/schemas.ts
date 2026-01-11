import { z } from "zod";

export const PaginationSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
});

export const PaginatedResponseSchema = z.object({
    data: z.array(z.any()),
    pagination: PaginationSchema,
});