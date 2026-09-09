import { z } from 'zod';


export const createTodoSchema = z.object({
	title: z.string().min(1, 'Title cannot be empty').max(255).trim(),
	description: z.string().max(5000).optional(),
	priority: z.number().int().min(1).max(5).default(3),
	due_date: z.coerce.date().optional()
});

export const updateTodoSchema = createTodoSchema.partial();

export const idParamSchema = z.object({
	id: z.uuid('Invalid id format')
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;