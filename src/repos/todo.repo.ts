import { and, eq, isNull, desc } from 'drizzle-orm';

import { db } from '@/db/client';
import { todos, type Todo, type TodoInsert } from '@/db/schema';

export const todoRepo = {
	async create(data: TodoInsert): Promise<Todo> {
		const [row] = await db.insert(todos).values(data).returning();
		return row;
	},

	async findById(id: string): Promise<Todo | null> {
		const [row] = await db
			.select()
			.from(todos)
			.where(and(eq(todos.id, id), isNull(todos.deleted_at)))
			.limit(1);

		return row ?? null;
	},

	async findAll(): Promise<Todo[]> {
		return db
			.select()
			.from(todos)
			.where(isNull(todos.deleted_at))
			.orderBy(desc(todos.created_at));
	}
};