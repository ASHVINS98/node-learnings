import {
	pgTable,
	uuid,
	varchar,
	text,
	boolean,
	integer,
	timestamp,
	index
} from 'drizzle-orm/pg-core';

import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const todos = pgTable(
    'todos',
    {
        id: uuid('id').primaryKey().defaultRandom(),

		title: varchar('title', { length: 255 }).notNull(),
		description: text('description'),

		is_completed: boolean('is_completed').notNull().default(false),
		completed_at: timestamp('completed_at', { withTimezone: true }),

		priority: integer('priority').notNull().default(3),
		due_date: timestamp('due_date', { withTimezone: true }),

		created_at: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updated_at: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		deleted_at: timestamp('deleted_at', { withTimezone: true })
    },
    (table) => [
		index('idx_todos_created_at').on(table.created_at),
		index('idx_todos_is_completed').on(table.is_completed)
	]

)


export type Todo = InferSelectModel<typeof todos>;
export type TodoInsert = InferInsertModel<typeof todos>;