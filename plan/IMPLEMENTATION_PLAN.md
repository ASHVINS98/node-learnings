# Todo Learning Project — Step-by-Step Plan

**Goal:** Build a real backend API from an empty folder, understanding every piece, using the same layered architecture as `dv-service` but without its scaffolding.

**Stack:** Node.js, TypeScript, Express 5, PostgreSQL (Docker), Drizzle ORM, Zod, Vitest.

**Deliberately NOT included:** dependency injection container, decorators, RabbitMQ, Redis. You will meet those in `dv-service`; adding them here would mean two days of setup before your first endpoint runs.

**Reference:** `DEVELOPER_HANDBOOK.html` in this folder. Section numbers below (§4, §16) point into it.

## Ground rules

- Type the code. Don't paste it.
- Run the verification at the end of every step. If it doesn't do what the plan says, stop and fix it before moving on.
- Commit after each step. `git log` becomes the record of what you learned.
- When a step says "understand this before continuing" — it means it. Those are the concepts; the typing is not the point.

---

# PART A — From nothing to a running server

---

## Step 1: Create the project and understand `package.json`

- [ ] **1.1 — Enter the folder and start git**

```bash
cd /c/Users/ashwa/projects/todo-learning
git init
```

- [ ] **1.2 — Create `package.json`**

```bash
npm init -y
```

Open it. It is small and boring, which is the point:

```json
{
  "name": "todo-learning",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": { "test": "echo \"Error: no test specified\" && exit 1" },
  "license": "ISC"
}
```

**What `package.json` is:** a manifest. It records your project's name, the packages it needs, and the commands you can run. Nothing magic happened — npm wrote a file.

- [ ] **1.3 — Install your first package and watch the file change**

```bash
npm install express
```

Look again. This appeared:

```json
"dependencies": {
  "express": "^5.2.1"
}
```

Three things now exist on disk:

| Thing | What it is | Commit it? |
|---|---|---|
| `node_modules/` | The actual downloaded code — thousands of files | **Never.** Rebuildable from the other two. |
| `package-lock.json` | The exact version of every package, and every package *they* depend on | **Always.** |
| `dependencies` entry | Your declared intent: "I need express, roughly version 5" | **Always.** |

- [ ] **1.4 — Understand the `^`**

Versions are `MAJOR.MINOR.PATCH`. The symbol in front is a **range**:

| Range | Accepts | Meaning |
|---|---|---|
| `^5.2.1` | 5.2.1 → 5.99.99 | Compatible updates. Not 6.x — a major bump may break you. |
| `~5.2.1` | 5.2.1 → 5.2.99 | Bug fixes only. |
| `5.2.1` | exactly 5.2.1 | Pinned. |

So `^5.2.1` means two people installing months apart could get different versions. **That is what `package-lock.json` solves** — it pins the whole tree so everyone gets an identical install.

> If code works on your machine and fails in CI, a missing or stale lockfile is the first suspect.

- [ ] **1.5 — Create `.gitignore`**

```
node_modules/
dist/
.env
```

`node_modules` because it's huge and rebuildable. `.env` because it will hold passwords.

- [ ] **1.6 — Commit**

```bash
git add -A && git commit -m "step 1: initialise node project"
```

**Learned:** `package.json` is a manifest, `node_modules` is disposable, the lockfile is not.

---

## Step 2: Add TypeScript and understand `tsconfig.json`

**Why:** plain JavaScript finds your typos when the code runs — often in production. TypeScript finds them when you save the file.

- [ ] **2.1 — Install**

```bash
npm install --save-dev typescript @types/node @types/express tsx
```

These went into `devDependencies`, not `dependencies`. **The split matters:**

- **`dependencies`** — needed when the app *runs*. Express, the database driver, Zod.
- **`devDependencies`** — needed only to *build or test*. TypeScript, Vitest, type definitions.

A production install skips devDependencies, so the deployed app is smaller and its attack surface narrower.

**Why `@types/express`?** Express is written in plain JavaScript and ships no type information. The `@types/*` packages are community-written type definitions bolted on afterwards. Libraries written in TypeScript — Zod, Drizzle — need no `@types` package.

**What is `tsx`?** It runs `.ts` files directly, with no build step. Good for development.

- [ ] **2.2 — Create `tsconfig.json`**

Write it by hand rather than with `tsc --init`, so there's nothing in it you don't understand:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

| Option | What it does |
|---|---|
| `target` | Which JavaScript version to output |
| `rootDir` / `outDir` | Read `.ts` from `src/`, write `.js` to `dist/` |
| `strict` | Every safety check on. **Never turn this off.** |
| `esModuleInterop` | Lets `import express from 'express'` work with older packages |
| `skipLibCheck` | Don't type-check inside `node_modules` — saves a lot of time |
| `paths` | The alias — see below |

- [ ] **2.3 — Understand `@/` (this confuses everyone)**

`paths` makes `@/` shorthand for `src/`. So instead of:

```typescript
import { todoRepo } from '../../../repos/todo.repo';   // breaks when you move the file
```

you write:

```typescript
import { todoRepo } from '@/repos/todo.repo';          // survives moving the file
```

**It is not an npm package and not a Node feature — it is a compiler setting.** TypeScript understands it; plain Node at runtime does not. `tsx` handles it for you in development. (`dv-service` compiles with `tsc` and then runs `tsc-alias` to rewrite the aliases into real paths — that's what that step in its build script is for.)

- [ ] **2.4 — Add scripts**

Replace the `scripts` block in `package.json`:

```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "type-check": "tsc --noEmit"
}
```

`type-check` compiles without writing files — a pure "are there type errors?" check. Run it often.

- [ ] **2.5 — Verify**

Create `src/index.ts`:

```typescript
const greeting: string = 'TypeScript is working';
console.log(greeting);
```

```bash
npm run dev
```

Expected: `TypeScript is working`. `Ctrl+C` to stop.

- [ ] **2.6 — Break it on purpose**

```typescript
const greeting: string = 42;
```

Save. It reports:

```
Type 'number' is not assignable to type 'string'.
```

**That error is the entire value of TypeScript.** In plain JavaScript this would have run happily and broken somewhere far away. Change it back.

- [ ] **2.7 — Commit**

```bash
git add -A && git commit -m "step 2: add typescript"
```

---

## Step 3: Your first Express server

**This is the moment you have a backend.**

- [ ] **3.1 — Understand the model first**

A server is a program that waits. A **client** (browser, `curl`, mobile app) sends a **request**; the server sends a **response**. See Handbook §1–2.

A request has a **method** (`GET`, `POST`, …), a **path** (`/health`), optional **headers**, and an optional **body**.
A response has a **status code** (200, 404, 500), headers, and a body.

- [ ] **3.2 — Write it**

Replace `src/index.ts` entirely:

```typescript
import express from 'express';

const app = express();

// Teaches Express to parse JSON request bodies into req.body.
// Without this line req.body is undefined on every POST — a classic first bug.
app.use(express.json());

app.get('/health', (req, res) => {
	res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = 3000;

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});
```

- [ ] **3.3 — Run it and call it**

```bash
npm run dev
```

In a second terminal:

```bash
curl -i http://localhost:3000/health
```

Expected:

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"status":"ok","time":"2026-09-05T..."}
```

Open `http://localhost:3000/health` in your browser too. **You built that.**

- [ ] **3.4 — See a 404**

```bash
curl -i http://localhost:3000/nope
```

`HTTP/1.1 404 Not Found`. You didn't write that — Express does it when no route matches.

- [ ] **3.5 — Understand `app.use` vs `app.get`**

- `app.get('/path', handler)` — runs only for `GET /path`.
- `app.use(something)` — **middleware**: runs for *every* request that reaches it, in declaration order.

`express.json()` is middleware. Ordering matters: middleware declared after a route never runs for that route.

- [ ] **3.6 — Commit**

```bash
git add -A && git commit -m "step 3: first express server with /health"
```

---

## Step 4: Run PostgreSQL in Docker

**Why Docker:** installing Postgres directly means version conflicts and a mess to uninstall. Docker runs it in a container you can delete in one command.

- [ ] **4.1 — Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: todo-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: todo_user
      POSTGRES_PASSWORD: todo_password
      POSTGRES_DB: todo_db
    ports:
      # host:container — 5433 on your machine so it cannot clash with any
      # Postgres already running on the default 5432.
      - '5433:5432'
    volumes:
      # Named volume, so data survives `docker compose down`.
      - todo_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U todo_user -d todo_db']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  todo_pgdata:
```

- [ ] **4.2 — Start it**

```bash
docker compose up -d
```

`-d` means detached — it runs in the background.

- [ ] **4.3 — Verify**

```bash
docker compose ps
```

Expected: `todo-postgres`, status `Up (healthy)`. If it says `starting`, wait five seconds.

- [ ] **4.4 — Talk to it directly**

```bash
docker compose exec postgres psql -U todo_user -d todo_db -c "SELECT version();"
```

Expected: a line starting `PostgreSQL 16...`.

**You now have a real database.** Not a file, not a mock — the same software that runs in production.

- [ ] **4.5 — Store the connection details**

Create `.env`:

```
DATABASE_URL=postgresql://todo_user:todo_password@localhost:5433/todo_db
PORT=3000
```

Read that URL — it encodes `user:password@host:port/database`.

Create `.env.example` with the same keys and fake values:

```
DATABASE_URL=postgresql://user:password@localhost:5433/dbname
PORT=3000
```

**Why both?** `.env` holds real secrets and is gitignored. `.env.example` is committed so the next person knows which variables to set. Every serious project does this.

- [ ] **4.6 — Load it**

```bash
npm install dotenv
```

At the very top of `src/index.ts`, **before any other import**:

```typescript
import 'dotenv/config';
```

**Order matters.** Other modules read `process.env` as they load. If dotenv runs after them, they see nothing.

- [ ] **4.7 — Commit**

```bash
git add -A && git commit -m "step 4: postgres in docker"
```

Commands worth remembering:

| Command | Does |
|---|---|
| `docker compose up -d` | Start |
| `docker compose down` | Stop (keeps data) |
| `docker compose down -v` | Stop and **delete all data** |
| `docker compose logs postgres` | See what it's saying |

---

## Step 5: Connect Drizzle to the database

**What an ORM is:** writing SQL as strings means typos aren't caught until runtime, and building queries by joining strings opens SQL injection. An **ORM** lets you write queries in TypeScript, type-checked. Handbook §4.

- [ ] **5.1 — Install**

```bash
npm install drizzle-orm pg
npm install --save-dev drizzle-kit @types/pg
```

- `drizzle-orm` — the query builder (runtime)
- `pg` — the actual PostgreSQL driver (runtime)
- `drizzle-kit` — the migration tool (dev only)

- [ ] **5.2 — Create the connection**

Create `src/db/client.ts`:

```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	// Fail at startup with a clear message rather than mysteriously later.
	// Handbook §12 — the "fail fast at boot" rule.
	throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
}

/**
 * A connection POOL, not a single connection.
 *
 * Opening a connection costs real time, and Postgres caps how many can exist. A
 * pool keeps a few open and lends them out, so a request borrows one and returns
 * it instead of paying that cost every time.
 */
const pool = new Pool({ connectionString, max: 10 });

export const db = drizzle(pool, { schema });

export async function closeDb() {
	await pool.end();
}
```

- [ ] **5.3 — Create the schema barrel**

Create `src/db/schema/index.ts`:

```typescript
// Every table gets exported from here.
export {};
```

- [ ] **5.4 — Configure drizzle-kit**

Create `drizzle.config.ts` in the project root:

```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/db/schema/index.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL!
	}
});
```

- [ ] **5.5 — Add scripts**

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

- [ ] **5.6 — Prove it connects**

Temporarily add to the bottom of `src/index.ts`:

```typescript
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

db.execute(sql`SELECT 1 AS ok`)
	.then(() => console.log('Database connected'))
	.catch((err) => console.error('Database connection FAILED:', err.message));
```

```bash
npm run dev
```

Expected: `Database connected`.

If it fails: is Docker running (`docker compose ps`)? Is the port `5433` in both `.env` and `docker-compose.yml`?

- [ ] **5.7 — Remove the test code and commit**

```bash
git add -A && git commit -m "step 5: connect drizzle to postgres"
```

---

## Step 6: Your first table and first migration

- [ ] **6.1 — Define the table**

Create `src/db/schema/todos.ts`:

```typescript
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
		// UUID rather than a counting number: generated anywhere without coordination,
		// and it doesn't tell the world how many todos exist.
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

		// SOFT DELETE. Rows are never removed, only marked. Queries filter on this
		// being NULL. Keeps history and makes an accidental delete recoverable.
		deleted_at: timestamp('deleted_at', { withTimezone: true })
	},
	(table) => [
		index('idx_todos_created_at').on(table.created_at),
		index('idx_todos_is_completed').on(table.is_completed)
	]
);

// Derived from the table above. Rename a column and every place that uses it
// stops compiling — which is exactly what you want.
export type Todo = InferSelectModel<typeof todos>;
export type TodoInsert = InferInsertModel<typeof todos>;
```

- [ ] **6.2 — Understand the choices**

| Choice | Why |
|---|---|
| `.notNull()` | The column can never be empty. Prefer it — nullable-by-default scatters `if (x == null)` everywhere. |
| `.default(false)` | Existing rows get a value when the column is added later. |
| `withTimezone: true` | Always. A timestamp without a timezone is a bug waiting for a server in another region. |
| `deleted_at` | Soft delete. |
| `index(...)` | Without one, finding rows means scanning every row. Handbook §4. |

- [ ] **6.3 — Export it**

Replace `src/db/schema/index.ts`:

```typescript
export * from './todos';
```

- [ ] **6.4 — Generate the migration**

```bash
npm run db:generate
```

- [ ] **6.5 — READ the generated SQL**

Open the new `.sql` file in `drizzle/`. You should see `CREATE TABLE "todos"` and two `CREATE INDEX` statements.

**Always read a generated migration before applying it.** Drizzle infers intent from a diff. If it ever guesses wrong — reading a rename as drop-then-add — this is where you catch it, not after the data is gone.

- [ ] **6.6 — Apply it**

```bash
npm run db:migrate
```

- [ ] **6.7 — See the table**

```bash
npm run db:studio
```

A browser GUI opens. Find `todos`, confirm the columns, then close it.

- [ ] **6.8 — Understand what a migration IS**

Changing `todos.ts` does **not** change the database. A **migration** is a versioned SQL script that does. They're committed to git and run in order, so every machine reaches an identical schema.

> **The rule you must not break:** never edit a migration that has already run anywhere. Write a new one. An edited migration won't re-run on machines that already applied it, so environments drift apart silently — the worst kind of bug.

- [ ] **6.9 — Commit**

```bash
git add -A && git commit -m "step 6: todos table and first migration"
```

**Part A done.** You have a server and a database.

---

# PART B — Your first feature, layer by layer

Understand the shape before writing any of it (Handbook §10):

```
ROUTE       HTTP in, HTTP out. Reads req, picks a status code. No rules.
  ↓
SERVICE     The decisions. Knows nothing about HTTP.
  ↓
REPO        The SQL. Knows nothing about business rules.
  ↓
DATABASE
```

**Why bother for an app this small?** Because each layer becomes testable alone, and because when the rules get complicated — they always do — you'll know where each kind of code goes. You're practising the shape on something simple so it's automatic when it isn't.

---

## Step 7: The repository layer

**Rule: the only file allowed to write SQL.**

- [ ] **7.1 — Create it**

Create `src/repos/todo.repo.ts`:

```typescript
import { and, eq, isNull, desc } from 'drizzle-orm';

import { db } from '@/db/client';
import { todos, type Todo, type TodoInsert } from '@/db/schema';

export const todoRepo = {
	async create(data: TodoInsert): Promise<Todo> {
		const [row] = await db.insert(todos).values(data).returning();
		return row;
	},

	/**
	 * Read one live todo.
	 *
	 * The soft-delete filter lives HERE, not in callers. One caller forgetting it
	 * is how a deleted todo reappears in the API.
	 */
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
```

- [ ] **7.2 — Understand `returning()`**

Postgres normally tells you *how many* rows an INSERT touched, not what they contain. `.returning()` asks for the rows back — including values the database generated, like `id` and `created_at`. Without it you'd insert and then re-query.

- [ ] **7.3 — Test it with a scratch script**

Create `src/scratch.ts`:

```typescript
import 'dotenv/config';
import { todoRepo } from '@/repos/todo.repo';
import { closeDb } from '@/db/client';

async function main() {
	const created = await todoRepo.create({ title: 'My first todo' });
	console.log('Created:', created);

	const found = await todoRepo.findById(created.id);
	console.log('Found:', found?.title);

	const all = await todoRepo.findAll();
	console.log('Total todos:', all.length);

	await closeDb();
}

main();
```

```bash
npx tsx src/scratch.ts
```

Expected: a created todo with a generated `id` and `created_at`, then it found again, then a count.

**Notice:** you used the database with no HTTP at all. That's the layering working — the repo has no idea a web server exists.

- [ ] **7.4 — Commit**

Keep `scratch.ts`; it stays useful.

```bash
git add -A && git commit -m "step 7: todo repository"
```

---

## Step 8: The service layer

**Rule: all the decisions, no SQL, no HTTP.**

Right now it looks like a pointless pass-through. It won't by Step 13 — this is where "does this exist?" and "can this happen twice?" will live.

- [ ] **8.1 — Create error classes**

Create `src/errors/index.ts`:

```typescript
/**
 * An error that carries the HTTP status it should become.
 *
 * Services throw these; the error middleware (Step 11) turns them into responses.
 * That is how the service stays HTTP-free while still saying "this is a 404".
 */
export class AppError extends Error {
	constructor(
		message: string,
		public statusCode: number,
		public details?: unknown
	) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class NotFoundError extends AppError {
	constructor(message = 'Resource not found') {
		super(message, 404);
	}
}

export class BadRequestError extends AppError {
	constructor(message = 'Invalid request', details?: unknown) {
		super(message, 400, details);
	}
}

export class ConflictError extends AppError {
	constructor(message = 'Conflict with current state') {
		super(message, 409);
	}
}
```

- [ ] **8.2 — Create the service**

Create `src/services/todo.service.ts`:

```typescript
import { todoRepo } from '@/repos/todo.repo';
import { NotFoundError } from '@/errors';
import type { TodoInsert } from '@/db/schema';

export const todoService = {
	async create(data: TodoInsert) {
		return todoRepo.create(data);
	},

	/**
	 * Throws instead of returning null.
	 *
	 * "Not found" is the same answer at every call site, so raising it once here
	 * beats every caller remembering to check. The check that gets forgotten is the
	 * one that ships a 200 with a null body.
	 */
	async getById(id: string) {
		const todo = await todoRepo.findById(id);

		if (!todo) {
			throw new NotFoundError('Todo not found');
		}

		return todo;
	},

	async list() {
		return todoRepo.findAll();
	}
};
```

- [ ] **8.3 — Verify**

Replace the body of `main()` in `src/scratch.ts` (and import `todoService`):

```typescript
	const created = await todoService.create({ title: 'Service layer works' });
	console.log('Created:', created.title);

	try {
		await todoService.getById('00000000-0000-4000-8000-000000000000');
	} catch (err) {
		console.log('Correctly threw:', (err as Error).message);
	}

	await closeDb();
```

```bash
npx tsx src/scratch.ts
```

Expected: created, then `Correctly threw: Todo not found`.

- [ ] **8.4 — Commit**

```bash
git add -A && git commit -m "step 8: todo service and error classes"
```

---

## Step 9: The routes layer — your first working endpoint

**This is the payoff step.**

- [ ] **9.1 — Create the routes**

Create `src/routes/todo.routes.ts`:

```typescript
import { Router } from 'express';

import { todoService } from '@/services/todo.service';

/**
 * A Router is a mini-app you mount under a prefix. It keeps every todo route in
 * one file instead of piling them onto the main app.
 */
export const todoRouter = Router();

todoRouter.post('/', async (req, res) => {
	const todo = await todoService.create(req.body);

	// 201, not 200: something was created. The status code is part of the contract.
	res.status(201).json(todo);
});

todoRouter.get('/:id', async (req, res) => {
	const todo = await todoService.getById(req.params.id);

	res.json(todo);
});

todoRouter.get('/', async (req, res) => {
	const todos = await todoService.list();

	res.json(todos);
});
```

- [ ] **9.2 — Split `app.ts` out of `index.ts`**

Create `src/app.ts`:

```typescript
import express from 'express';

import { todoRouter } from '@/routes/todo.routes';

export function createApp() {
	const app = express();

	app.use(express.json());

	app.get('/health', (req, res) => {
		res.json({ status: 'ok', time: new Date().toISOString() });
	});

	// Everything in todoRouter now lives under /api/todos.
	app.use('/api/todos', todoRouter);

	return app;
}
```

Replace `src/index.ts`:

```typescript
import 'dotenv/config';

import { createApp } from '@/app';

const app = createApp();
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});
```

**Why split them?** `index.ts` *starts* a server; `app.ts` *builds* one. In Step 19 the tests call `createApp()` without ever opening a port.

- [ ] **9.3 — Call your own API**

```bash
npm run dev
```

```bash
curl -i -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn backend development","priority":1}'

curl http://localhost:3000/api/todos

curl http://localhost:3000/api/todos/<paste-id-here>
```

**You built an API.** Route → service → repo → Postgres → back out as JSON. That is the shape of every backend you will ever write.

- [ ] **9.4 — Find the two bugs**

```bash
# No title at all
curl -i -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" -d '{}'

# A todo that doesn't exist
curl -i http://localhost:3000/api/todos/00000000-0000-4000-8000-000000000000
```

The first gives an ugly 500 from Postgres about a null constraint. The second 500s instead of 404 — your `NotFoundError` is thrown and nothing catches it.

**Both are real bugs, and the next two steps fix them.** Note that you found them by trying to break your own code. Do that habitually.

- [ ] **9.5 — Commit**

```bash
git add -A && git commit -m "step 9: todo routes - first working endpoint"
```

---

## Step 10: Input validation with Zod

**The rule from Handbook §1: never trust the client.** Anything in `req.body` was written by someone you cannot see.

- [ ] **10.1 — Install**

```bash
npm install zod
```

- [ ] **10.2 — Define what input is allowed**

Create `src/models/todo.model.ts`:

```typescript
import { z } from 'zod';

/**
 * What a caller may send when creating a todo.
 *
 * Note what is NOT here: id, created_at, is_completed, completed_at. The database
 * owns the first two, and completion is an ACTION with its own endpoint (Step 13).
 * Letting a client set is_completed here would let it skip that path entirely.
 */
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
```

**`z.infer` is the trick worth noticing:** the TypeScript type is derived from the runtime validator, so the two can never disagree.

- [ ] **10.3 — Validate in the routes**

Rewrite `src/routes/todo.routes.ts`:

```typescript
import { Router } from 'express';

import { todoService } from '@/services/todo.service';
import { createTodoSchema, idParamSchema } from '@/models/todo.model';

export const todoRouter = Router();

todoRouter.post('/', async (req, res) => {
	// Parse THEN use. Everything downstream now works with a known-good shape.
	const data = createTodoSchema.parse(req.body);

	const todo = await todoService.create(data);

	res.status(201).json(todo);
});

todoRouter.get('/:id', async (req, res) => {
	const { id } = idParamSchema.parse(req.params);

	const todo = await todoService.getById(id);

	res.json(todo);
});

todoRouter.get('/', async (req, res) => {
	const todos = await todoService.list();

	res.json(todos);
});
```

`.parse()` returns typed data or throws a `ZodError`. Step 11 turns that into a clean 400.

- [ ] **10.4 — Why validate in the route, not the service?**

Because the route is the boundary with the outside world. Everything past it should be able to assume the data is sane. **Validate once, at the edge.**

- [ ] **10.5 — Verify**

```bash
curl -i -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" -d '{"title":""}'
```

Still a 500 — but read the log: it's now a `ZodError` about the empty title, not a Postgres constraint error. Validation works; the *reporting* is Step 11.

- [ ] **10.6 — Commit**

```bash
git add -A && git commit -m "step 10: zod input validation"
```

---

## Step 11: Error handling middleware

One piece of middleware fixes every endpoint at once.

- [ ] **11.1 — Create it**

Create `src/middleware/errorHandler.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

import { AppError } from '@/errors';

/**
 * The last middleware. Express recognises it as an error handler purely because it
 * takes FOUR arguments — remove `next` and it silently becomes a normal middleware
 * that never runs. That is not something you can guess; it is just how Express works.
 */
export function errorHandler(
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction
) {
	// Input that failed validation. 400 — the caller's fault.
	if (err instanceof ZodError) {
		return res.status(400).json({
			error: 'Validation failed',
			// Say exactly which field and why. A bare "invalid input" forces the
			// caller to guess, and they will guess wrong.
			details: err.issues.map((i) => ({
				field: i.path.join('.'),
				message: i.message
			}))
		});
	}

	// Errors we raised deliberately, carrying their own status.
	if (err instanceof AppError) {
		return res.status(err.statusCode).json({
			error: err.message,
			...(err.details ? { details: err.details } : {})
		});
	}

	// Anything else is a bug in OUR code. Log it fully, tell the client nothing —
	// stack traces and database messages leak how the system is built.
	console.error('Unhandled error:', err);

	return res.status(500).json({ error: 'Internal server error' });
}
```

- [ ] **11.2 — Register it LAST**

In `src/app.ts`:

```typescript
import { errorHandler } from '@/middleware/errorHandler';
```

```typescript
	app.use('/api/todos', todoRouter);

	// Must be last. Middleware runs in order, and this only sees errors from
	// things registered BEFORE it.
	app.use(errorHandler);

	return app;
```

- [ ] **11.3 — A note on Express 5**

In Express 4, an async handler that threw was an unhandled promise rejection — the request hung, and you needed a wrapper around every handler. **Express 5 forwards rejected promises to the error handler automatically.** That's why your `await todoService.getById(...)` needs no `try/catch`.

If you ever see an Express 4 codebase where every route is wrapped in `asyncHandler(...)`, this is why.

- [ ] **11.4 — Verify all three paths**

```bash
# Validation error → 400 with field details
curl -i -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" -d '{"title":""}'

# Not found → 404 with a clean message
curl -i http://localhost:3000/api/todos/00000000-0000-4000-8000-000000000000

# Bad UUID → 400, NOT 500
curl -i http://localhost:3000/api/todos/not-a-uuid
```

**One file fixed every endpoint you will ever add.** That's what middleware is for.

- [ ] **11.5 — Commit**

```bash
git add -A && git commit -m "step 11: centralised error handling"
```

---

## Step 12: Listing with pagination and filters

`GET /api/todos` currently returns every row. With 100,000 todos that's a slow query, a huge response, and possibly a crashed server. **Every list endpoint must be paginated.**

- [ ] **12.1 — Add the query**

In `src/repos/todo.repo.ts`, add imports:

```typescript
import { ilike, sql, type SQL } from 'drizzle-orm';
```

And the method:

```typescript
	async findPaginated(options: {
		page: number;
		limit: number;
		isCompleted?: boolean;
		search?: string;
	}) {
		const { page, limit, isCompleted, search } = options;
		const offset = (page - 1) * limit;

		const clauses: SQL[] = [isNull(todos.deleted_at)];

		if (typeof isCompleted === 'boolean') {
			clauses.push(eq(todos.is_completed, isCompleted));
		}

		if (search) {
			// ilike = case-insensitive LIKE. % are wildcards.
			clauses.push(ilike(todos.title, `%${search}%`));
		}

		const where = and(...clauses);

		// Two independent reads — run them together rather than in sequence.
		const [rows, [{ count }]] = await Promise.all([
			db
				.select()
				.from(todos)
				.where(where)
				.orderBy(desc(todos.created_at))
				.limit(limit)
				.offset(offset),
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(todos)
				.where(where)
		]);

		return {
			data: rows,
			pagination: {
				page,
				limit,
				total: count,
				totalPages: Math.ceil(count / limit)
			}
		};
	},
```

- [ ] **12.2 — Understand LIMIT / OFFSET**

`LIMIT 20 OFFSET 40` means "skip 40 rows, give me the next 20" — page 3 at 20 per page.

**The ordering is not optional.** Without `ORDER BY`, Postgres may return rows in any order, and it can differ between calls — so the same row could appear on two pages while another appears on none. **A paginated query without a stable sort is broken even when it looks fine.**

- [ ] **12.3 — Add the query schema**

In `src/models/todo.model.ts`:

```typescript
export const listTodosSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	// Capped at 100. Without a cap, ?limit=999999 is a free denial-of-service.
	limit: z.coerce.number().int().min(1).max(100).default(20),
	is_completed: z
		.enum(['true', 'false'])
		.optional()
		.transform((v) => (v === undefined ? undefined : v === 'true')),
	search: z.string().max(255).optional()
});
```

**Why `z.coerce`?** Query string values are always strings — `?page=2` gives `"2"`. `coerce` converts before validating.

- [ ] **12.4 — Wire it up**

Service:

```typescript
	async list(options: {
		page: number;
		limit: number;
		isCompleted?: boolean;
		search?: string;
	}) {
		return todoRepo.findPaginated(options);
	},
```

Route (replace `GET /`):

```typescript
todoRouter.get('/', async (req, res) => {
	const query = listTodosSchema.parse(req.query);

	const result = await todoService.list({
		page: query.page,
		limit: query.limit,
		isCompleted: query.is_completed,
		search: query.search
	});

	res.json(result);
});
```

- [ ] **12.5 — Verify**

Create five or six todos, then:

```bash
curl "http://localhost:3000/api/todos?page=1&limit=2"
curl "http://localhost:3000/api/todos?search=learn"
curl "http://localhost:3000/api/todos?is_completed=false"
curl -i "http://localhost:3000/api/todos?limit=99999"   # → 400
```

- [ ] **12.6 — Commit**

```bash
git add -A && git commit -m "step 12: pagination, filtering and search"
```

---

## Step 13: Update, soft delete, and a race-safe complete

The most important step in Part B. **Read 13.4 slowly.**

- [ ] **13.1 — Repo methods**

```typescript
	async update(id: string, data: Partial<TodoInsert>): Promise<Todo | null> {
		const [row] = await db
			.update(todos)
			.set({ ...data, updated_at: new Date() })
			.where(and(eq(todos.id, id), isNull(todos.deleted_at)))
			.returning();

		return row ?? null;
	},

	async softDelete(id: string): Promise<Todo | null> {
		const [row] = await db
			.update(todos)
			.set({ deleted_at: new Date(), updated_at: new Date() })
			.where(and(eq(todos.id, id), isNull(todos.deleted_at)))
			.returning();

		return row ?? null;
	},

	/**
	 * Flip a todo to complete — but ONLY if it is currently incomplete.
	 * That last clause is the entire point. See 13.4.
	 */
	async markComplete(id: string): Promise<Todo | null> {
		const now = new Date();

		const [row] = await db
			.update(todos)
			.set({ is_completed: true, completed_at: now, updated_at: now })
			.where(
				and(
					eq(todos.id, id),
					isNull(todos.deleted_at),
					eq(todos.is_completed, false)
				)
			)
			.returning();

		return row ?? null;
	}
```

- [ ] **13.2 — Service methods**

```typescript
	async update(id: string, data: UpdateTodoInput) {
		const updated = await todoRepo.update(id, data);

		if (!updated) {
			throw new NotFoundError('Todo not found');
		}

		return updated;
	},

	async remove(id: string) {
		const deleted = await todoRepo.softDelete(id);

		if (!deleted) {
			throw new NotFoundError('Todo not found');
		}

		return deleted;
	},

	/**
	 * Complete a todo, exactly once.
	 *
	 * markComplete returns null for TWO reasons — the todo doesn't exist, or it was
	 * already complete — so we read the row back to find out which.
	 *
	 * Already-complete is reported as SUCCESS, not an error: the caller wanted the
	 * todo complete, and it is. Making a retry fail punishes the client for a
	 * dropped response that was not their fault.
	 */
	async complete(id: string) {
		const completed = await todoRepo.markComplete(id);

		if (completed) {
			return { status: 'completed' as const, todo: completed };
		}

		const existing = await todoRepo.findById(id);

		if (!existing) {
			throw new NotFoundError('Todo not found');
		}

		return { status: 'already_completed' as const, todo: existing };
	}
```

Add `UpdateTodoInput` to the imports.

- [ ] **13.3 — Routes**

```typescript
todoRouter.patch('/:id', async (req, res) => {
	const { id } = idParamSchema.parse(req.params);
	const data = updateTodoSchema.parse(req.body);

	const todo = await todoService.update(id, data);

	res.json(todo);
});

todoRouter.delete('/:id', async (req, res) => {
	const { id } = idParamSchema.parse(req.params);

	await todoService.remove(id);

	res.json({ message: 'Todo deleted', id });
});

/**
 * Completion is a POST to a sub-path, not PATCH { is_completed: true }.
 *
 * It is an ACTION with consequences — it stamps a time, and in a bigger system it
 * would notify people. A generic field edit promises none of that, and modelling it
 * that way invites a client to "un-complete" a todo by sending false.
 */
todoRouter.post('/:id/complete', async (req, res) => {
	const { id } = idParamSchema.parse(req.params);

	const result = await todoService.complete(id);

	if (result.status === 'already_completed') {
		return res.json({ message: 'Todo was already complete', todo: result.todo });
	}

	res.json({ message: 'Todo completed', todo: result.todo });
});
```

- [ ] **13.4 — Understand the race condition (read twice)**

Here is the version almost everyone writes first:

```typescript
// WRONG — do not use
const todo = await todoRepo.findById(id);
if (todo.is_completed) throw new ConflictError('Already complete');
await todoRepo.update(id, { is_completed: true });
```

It looks correct. It is not. Two requests arriving at the same moment:

```
Request A: findById  → is_completed = false
Request B: findById  → is_completed = false     ← B read before A wrote
Request A: update    → completes it
Request B: update    → completes it AGAIN
```

**Both passed the check. Both wrote.** Here that means two `completed_at` stamps. In an order-fulfilment or payment system it means shipping twice or charging twice.

The fix is to make the check and the write **one statement**, so the database arbitrates:

```sql
UPDATE todos SET is_completed = true
WHERE id = ? AND is_completed = false
```

Only one can match. The loser matches zero rows and gets `null`. There is no window between checking and writing, because there is no separate check.

> **The pattern to remember:** whenever you write `if (condition) then write`, ask whether two requests could both pass the `if`. If they could, fold the condition into the `WHERE` — or use a database constraint (Handbook §4).

- [ ] **13.5 — Verify**

```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" -d '{"title":"Race test"}'

curl -i -X POST http://localhost:3000/api/todos/<id>/complete   # "Todo completed"
curl -i -X POST http://localhost:3000/api/todos/<id>/complete   # "already complete", still 200

curl -i -X DELETE http://localhost:3000/api/todos/<id>
curl -i http://localhost:3000/api/todos/<id>                    # 404
```

Then check `db:studio`: the deleted row is **still there**, with `deleted_at` set. That's soft delete.

- [ ] **13.6 — Commit**

```bash
git add -A && git commit -m "step 13: update, soft delete, race-safe complete"
```

**Part B done.** A complete, correct CRUD API with proper errors, pagination and concurrency safety.

---

# PART C — Relationships and joins

One table taught you the layers. Real schemas are graphs. This is the part most tutorials skip, and the part interviews ask about.

Re-read Handbook §4 first.

---

## Step 14: A parent table and a foreign key (one-to-many)

A todo belongs to a **list** ("Work", "Shopping"). One list has many todos; each todo is in at most one list.

**The rule: in a one-to-many, the foreign key goes on the MANY side.**

- [ ] **14.1 — Create the parent table**

Create `src/db/schema/todoLists.ts`:

```typescript
import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const todoLists = pgTable(
	'todo_lists',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: varchar('name', { length: 120 }).notNull(),
		color: varchar('color', { length: 20 }),

		created_at: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updated_at: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		deleted_at: timestamp('deleted_at', { withTimezone: true })
	},
	(table) => [index('idx_todo_lists_created_at').on(table.created_at)]
);

export type TodoList = InferSelectModel<typeof todoLists>;
export type TodoListInsert = InferInsertModel<typeof todoLists>;
```

Note it holds **no reference to its todos**. Storing child ids here would mean rewriting the parent on every child insert, and two places to keep in sync.

- [ ] **14.2 — Add the foreign key**

In `src/db/schema/todos.ts`:

```typescript
import { todoLists } from './todoLists';
```

After `description`:

```typescript
		/**
		 * NULLABLE, for two reasons:
		 *
		 * 1. Rows already exist. Postgres cannot add a NOT NULL column with no default
		 *    to a populated table — there is nothing to put in the existing rows.
		 * 2. "Not in a list yet" is a legitimate state, not a data error.
		 *
		 * `set null` on delete, not `cascade`: deleting a list must not destroy the
		 * user's todos. They become unfiled, which is recoverable.
		 */
		todo_list_id: uuid('todo_list_id').references(() => todoLists.id, {
			onDelete: 'set null'
		}),
```

In the index array:

```typescript
		// Postgres does NOT index foreign keys automatically. Without this, every
		// "todos in this list" query scans the entire table.
		index('idx_todos_todo_list_id').on(table.todo_list_id),
```

- [ ] **14.3 — Learn the delete rules (a real decision, every time)**

When the parent row is deleted:

| Option | Effect on children | Choose when |
|---|---|---|
| `cascade` | Children deleted too | The child is meaningless alone — a comment on a deleted post |
| `set null` | FK blanked, child survives | The child stands alone — a todo without a list |
| `restrict` | The delete is **refused** | The child should block deletion — a product on live orders |

Getting this wrong is how people permanently lose data. Choose deliberately.

- [ ] **14.4 — Export and migrate**

```typescript
export * from './todoLists';
```

```bash
npm run db:generate
```

Read the SQL. Confirm `todo_list_id` is **not** `NOT NULL`, then:

```bash
npm run db:migrate
```

- [ ] **14.5 — Watch the foreign key refuse bad data**

```bash
docker compose exec postgres psql -U todo_user -d todo_db -c \
  "INSERT INTO todos (title, todo_list_id) VALUES ('Broken', '00000000-0000-4000-8000-000000000000');"
```

Expected:

```
ERROR:  insert or update on table "todos" violates foreign key constraint
```

**No application code prevented that — the database did.** That's referential integrity. A dangling reference is now physically impossible, no matter what bug your code has.

- [ ] **14.6 — Add list endpoints**

Create `src/repos/todoList.repo.ts`:

```typescript
import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { todoLists, type TodoList, type TodoListInsert } from '@/db/schema';

export const todoListRepo = {
	async create(data: TodoListInsert): Promise<TodoList> {
		const [row] = await db.insert(todoLists).values(data).returning();
		return row;
	},

	async findAll(): Promise<TodoList[]> {
		return db
			.select()
			.from(todoLists)
			.where(isNull(todoLists.deleted_at))
			.orderBy(desc(todoLists.created_at));
	},

	async findById(id: string): Promise<TodoList | null> {
		const [row] = await db
			.select()
			.from(todoLists)
			.where(and(eq(todoLists.id, id), isNull(todoLists.deleted_at)))
			.limit(1);

		return row ?? null;
	}
};
```

Create `src/routes/todoList.routes.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';

import { todoListRepo } from '@/repos/todoList.repo';

export const todoListRouter = Router();

const createListSchema = z.object({
	name: z.string().min(1).max(120).trim(),
	color: z.string().max(20).optional()
});

todoListRouter.post('/', async (req, res) => {
	const data = createListSchema.parse(req.body);

	const list = await todoListRepo.create(data);

	res.status(201).json(list);
});

todoListRouter.get('/', async (req, res) => {
	res.json(await todoListRepo.findAll());
});
```

Mount it in `src/app.ts`, **before** `errorHandler`:

```typescript
	app.use('/api/lists', todoListRouter);
```

Allow assigning a list — add to `createTodoSchema`:

```typescript
	todo_list_id: z.uuid().optional()
```

- [ ] **14.7 — Verify**

```bash
curl -X POST http://localhost:3000/api/lists \
  -H "Content-Type: application/json" -d '{"name":"Work","color":"blue"}'

curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"In a list","todo_list_id":"<list-id>"}'

# And one with NO list — you need this for Step 15
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" -d '{"title":"Unfiled todo"}'
```

- [ ] **14.8 — Commit**

```bash
git add -A && git commit -m "step 14: todo_lists parent table and foreign key"
```

---

## Step 15: `LEFT JOIN` vs `INNER JOIN`

**A join reads two tables together in one query.** Which kind you pick decides whether rows silently disappear.

- [ ] **15.1 — Understand the difference first**

You have two todos: one in "Work", one unfiled (`todo_list_id` is NULL).

| Join | Returns | Means |
|---|---|---|
| `INNER JOIN` | **1 row** | "Todos that are in a list" |
| `LEFT JOIN` | **2 rows** | "All todos, plus their list if they have one" |

The unfiled todo has no matching list row. `INNER JOIN` drops it. `LEFT JOIN` keeps it and fills the list columns with `NULL`.

> **This is the most common SQL bug there is.** Someone adds an inner join to "include the list name", and rows vanish from the API. Nobody notices until a user asks where their todo went.
>
> **Rule of thumb: if the foreign key is nullable, you want a LEFT JOIN.**

- [ ] **15.2 — Write it**

In `src/repos/todo.repo.ts`:

```typescript
import { getTableColumns } from 'drizzle-orm';
import { todoLists } from '@/db/schema';
```

```typescript
	/**
	 * Todos with their list attached, in ONE query.
	 *
	 * LEFT, not INNER: todo_list_id is nullable, so an inner join would silently drop
	 * every unfiled todo from an endpoint that claims to return all of them.
	 */
	async findAllWithList() {
		const rows = await db
			.select({
				todo: getTableColumns(todos),
				list_id: todoLists.id,
				list_name: todoLists.name
			})
			.from(todos)
			.leftJoin(
				todoLists,
				and(
					eq(todoLists.id, todos.todo_list_id),
					// This filter belongs in the JOIN condition, NOT the WHERE.
					// In a WHERE it would discard todos whose list was soft-deleted,
					// quietly turning this back into an inner join. See 15.5.
					isNull(todoLists.deleted_at)
				)
			)
			.where(isNull(todos.deleted_at))
			.orderBy(desc(todos.created_at));

		return rows.map((row) => ({
			...row.todo,
			list: row.list_id ? { id: row.list_id, name: row.list_name! } : null
		}));
	},
```

- [ ] **15.3 — Expose it**

Service:

```typescript
	async listWithLists() {
		return todoRepo.findAllWithList();
	},
```

Route — add **above** the `/:id` route:

```typescript
todoRouter.get('/with-lists', async (req, res) => {
	res.json(await todoService.listWithLists());
});
```

> **Why above `/:id`?** Express matches routes in declaration order. Registered after, `/with-lists` would match `/:id` first and be treated as an id called "with-lists". **Specific routes go before parameterised ones** — another bug that costs people an hour.

- [ ] **15.4 — Watch a row vanish**

```bash
curl http://localhost:3000/api/todos/with-lists
```

Both todos come back — one with `"list": {...}`, the unfiled one with `"list": null`.

Now **change `.leftJoin(` to `.innerJoin(`**, save, and call it again.

**The unfiled todo is gone.** No error, no warning. It simply isn't there.

Change it back.

*Actually do this.* Reading about it and watching it are different things, and this is the bug you will meet in real code.

- [ ] **15.5 — The disguised version**

Now try the other mistake — move the filter out of the join into the where:

```typescript
			.leftJoin(todoLists, eq(todoLists.id, todos.todo_list_id))
			.where(and(isNull(todos.deleted_at), isNull(todoLists.deleted_at)))
```

Looks harmless. But a `WHERE` on the right-hand table discards unmatched rows, so you have re-created the inner join with extra steps. Put it back in the join condition.

- [ ] **15.6 — Commit**

```bash
git add -A && git commit -m "step 15: left join for todos with lists"
```

---

## Step 16: `GROUP BY`, counting, and the N+1 problem

For each list: how many todos, and how many done?

- [ ] **16.1 — Write the WRONG version first, on purpose**

Add to `src/repos/todoList.repo.ts` temporarily:

```typescript
	// DELIBERATELY WRONG — the N+1 problem. You delete this in 16.3.
	async summariesBad() {
		const lists = await db.select().from(todoLists);        // 1 query

		return Promise.all(
			lists.map(async (list) => {                          // N more queries
				const rows = await db
					.select()
					.from(todos)
					.where(eq(todos.todo_list_id, list.id));

				return { id: list.id, name: list.name, total: rows.length };
			})
		);
	},
```

- [ ] **16.2 — See the problem**

Create five lists, then call this from `scratch.ts`. Count the queries: **1 for the lists, plus 1 per list = 6.**

With 50 lists, 51 queries. With 500, 501.

**The code looks completely reasonable** — a loop that fetches what it needs. That is exactly why this bug is everywhere. It never shows up with three rows of test data, and it falls over in production.

> **Learn the shape: a database call inside a loop.** That is almost always N+1. When you see `.map(async ...)` with a query inside, stop.

- [ ] **16.3 — Delete it and write the right version**

```typescript
	/**
	 * Per-list counts in ONE query, however many lists there are.
	 *
	 * LEFT JOIN so a list with zero todos still appears with a count of 0 — an inner
	 * join would hide empty lists, which is exactly when the number is interesting.
	 */
	async summaries() {
		return db
			.select({
				id: todoLists.id,
				name: todoLists.name,
				// count(todos.id), NOT count(*).
				//
				// With a LEFT JOIN an empty list still produces one row, with every
				// todo column NULL. count(*) counts that row and reports 1.
				// count(column) skips NULLs and correctly reports 0.
				total: sql<number>`count(${todos.id})::int`,
				// A conditional count in the same pass. Without FILTER you would need
				// a second query, or fetch every row and count in JavaScript.
				completed: sql<number>`count(*) filter (where ${todos.is_completed})::int`
			})
			.from(todoLists)
			.leftJoin(
				todos,
				and(eq(todos.todo_list_id, todoLists.id), isNull(todos.deleted_at))
			)
			.where(isNull(todoLists.deleted_at))
			.groupBy(todoLists.id, todoLists.name)
			.orderBy(todoLists.name);
	}
```

Add `sql` and `todos` to the imports.

- [ ] **16.4 — Understand `GROUP BY`**

A join produces one row per *matching pair*. `GROUP BY` collapses those into one row per group, and aggregate functions (`count`, `sum`, `avg`, `max`) summarise what got collapsed.

**The rule that trips everyone:** every column in your `SELECT` must either appear in the `GROUP BY` or be inside an aggregate. Postgres cannot pick a single `name` for a group unless it knows the group has only one — which is why `todoLists.name` is in the `GROUP BY`.

- [ ] **16.5 — Expose and verify**

```typescript
todoListRouter.get('/summary', async (req, res) => {
	res.json(await todoListRepo.summaries());
});
```

Set up a list with 3 todos (complete one), and a second, empty list.

```bash
curl http://localhost:3000/api/lists/summary
```

Expected:

```json
[
  { "id": "...", "name": "Empty List", "total": 0, "completed": 0 },
  { "id": "...", "name": "Work",       "total": 3, "completed": 1 }
]
```

**Check both things:** the empty list is present, and its total is 0 not 1. Those are the two traps from 16.3.

- [ ] **16.6 — Commit**

```bash
git add -A && git commit -m "step 16: grouped per-list counts, avoiding N+1"
```

---

## Step 17: Many-to-many with a join table

A todo can have several tags; a tag applies to several todos.

- [ ] **17.1 — Understand why a third table is required**

You cannot put `tag_id` on `todos` — a todo has many tags. You cannot put `todo_id` on `tags` — a tag has many todos. **A column holds one value.**

So the relationship gets its own table, one row per pairing. This is a **join table** (also junction, or link table).

- [ ] **17.2 — Create both tables**

Create `src/db/schema/tags.ts`:

```typescript
import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';

export const tags = pgTable(
	'tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: varchar('name', { length: 60 }).notNull(),

		created_at: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		deleted_at: timestamp('deleted_at', { withTimezone: true })
	},
	(table) => [
		// One "urgent" tag, not fifteen. PARTIAL (the where clause) so a deleted
		// tag's name can be reused instead of being reserved forever.
		uniqueIndex('uq_tags_name')
			.on(table.name)
			.where(sql`${table.deleted_at} IS NULL`)
	]
);

export type Tag = InferSelectModel<typeof tags>;
export type TagInsert = InferInsertModel<typeof tags>;
```

Create `src/db/schema/todoTags.ts`:

```typescript
import { pgTable, uuid, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { todos } from './todos';
import { tags } from './tags';

/**
 * The link between a todo and a tag — one row per pairing.
 *
 * Two foreign keys, two DIFFERENT delete rules, both deliberate:
 *
 *   todo_id → cascade  : a link to a deleted todo is meaningless. Remove it.
 *   tag_id  → restrict : refuse to delete a tag still in use. Whoever wants it gone
 *                        must unlink it first, consciously.
 */
export const todoTags = pgTable(
	'todo_tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		todo_id: uuid('todo_id')
			.notNull()
			.references(() => todos.id, { onDelete: 'cascade' }),
		tag_id: uuid('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'restrict' }),

		created_at: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(table) => [
		// BOTH directions indexed: "tags for this todo" uses one, "todos with this
		// tag" uses the other. A join table is always queried from both ends.
		index('idx_todo_tags_todo_id').on(table.todo_id),
		index('idx_todo_tags_tag_id').on(table.tag_id),
		// The same tag cannot be applied twice — a DATABASE guarantee, because two
		// simultaneous requests would both pass an application check (Step 13.4).
		uniqueIndex('uq_todo_tags_todo_tag').on(table.todo_id, table.tag_id)
	]
);

export type TodoTag = InferSelectModel<typeof todoTags>;
export type TodoTagInsert = InferInsertModel<typeof todoTags>;
```

- [ ] **17.3 — Export and migrate**

```typescript
export * from './tags';
export * from './todoTags';
```

```bash
npm run db:generate && npm run db:migrate
```

- [ ] **17.4 — Query both directions**

Create `src/repos/tag.repo.ts`:

```typescript
import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { tags, todoTags, todos, type Tag } from '@/db/schema';

export const tagRepo = {
	async findOrCreate(name: string): Promise<Tag> {
		const [existing] = await db
			.select()
			.from(tags)
			.where(and(eq(tags.name, name), isNull(tags.deleted_at)))
			.limit(1);

		if (existing) return existing;

		const [created] = await db.insert(tags).values({ name }).returning();
		return created;
	},

	/** Apply a tag. onConflictDoNothing makes a duplicate request harmless. */
	async addTagToTodo(todoId: string, tagId: string) {
		const [row] = await db
			.insert(todoTags)
			.values({ todo_id: todoId, tag_id: tagId })
			.onConflictDoNothing()
			.returning();

		return row ?? null;
	},

	/**
	 * Tags on one todo. Read right to left: start at the link rows for this todo,
	 * then hop to the tag each points at.
	 *
	 * INNER is correct here — a link whose tag is missing is not a tag.
	 */
	async getTagsForTodo(todoId: string) {
		return db
			.select({ id: tags.id, name: tags.name })
			.from(todoTags)
			.innerJoin(tags, eq(tags.id, todoTags.tag_id))
			.where(and(eq(todoTags.todo_id, todoId), isNull(tags.deleted_at)))
			.orderBy(tags.name);
	},

	/** The mirror image — same shape, opposite direction. */
	async getTodosForTag(tagId: string) {
		return db
			.select({ id: todos.id, title: todos.title })
			.from(todoTags)
			.innerJoin(todos, eq(todos.id, todoTags.todo_id))
			.where(and(eq(todoTags.tag_id, tagId), isNull(todos.deleted_at)))
			.orderBy(desc(todos.created_at));
	}
};
```

- [ ] **17.5 — Add the routes**

In `src/routes/todo.routes.ts`:

```typescript
const addTagSchema = z.object({ name: z.string().min(1).max(60).trim() });

todoRouter.post('/:id/tags', async (req, res) => {
	const { id } = idParamSchema.parse(req.params);
	const { name } = addTagSchema.parse(req.body);

	// Confirm the todo exists first — otherwise you create an orphan tag for a
	// todo that isn't there.
	await todoService.getById(id);

	const tag = await tagRepo.findOrCreate(name);
	await tagRepo.addTagToTodo(id, tag.id);

	res.status(201).json({ todo_id: id, tags: await tagRepo.getTagsForTodo(id) });
});

todoRouter.get('/:id/tags', async (req, res) => {
	const { id } = idParamSchema.parse(req.params);

	res.json(await tagRepo.getTagsForTodo(id));
});
```

Add `import { z } from 'zod'` and `import { tagRepo } from '@/repos/tag.repo'`.

- [ ] **17.6 — Watch the two delete rules behave differently**

```bash
curl -X POST http://localhost:3000/api/todos/<todo-id>/tags \
  -H "Content-Type: application/json" -d '{"name":"urgent"}'

# Idempotent — add it again, still one tag
curl -X POST http://localhost:3000/api/todos/<todo-id>/tags \
  -H "Content-Type: application/json" -d '{"name":"urgent"}'
```

Try to delete the tag:

```bash
docker compose exec postgres psql -U todo_user -d todo_db -c \
  "DELETE FROM tags WHERE name = 'urgent';"
```

Expected: `ERROR: update or delete on table "tags" violates foreign key constraint on table "todo_tags"` — that's **`restrict`**.

Now hard-delete the *todo*:

```bash
docker compose exec postgres psql -U todo_user -d todo_db -c \
  "DELETE FROM todos WHERE id = '<todo-id>';"

docker compose exec postgres psql -U todo_user -d todo_db -c \
  "SELECT count(*) FROM todo_tags;"
```

The link row is gone — that's **`cascade`**.

**Two foreign keys in one table, behaving in opposite ways, exactly as you declared them.**

- [ ] **17.7 — Commit**

```bash
git add -A && git commit -m "step 17: tags many-to-many with join table"
```

**Part C done.** Four tables, both kinds of relationship, and the joins that read them.

---

# PART D — Making it real

---

## Step 18: Middleware — logging and a simple auth check

- [ ] **18.1 — Request logging**

Create `src/middleware/requestLogger.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
	namespace Express {
		interface Request {
			requestId?: string;
		}
	}
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
	// A per-request id. In a real system this travels to every log line and every
	// downstream service, so you can reconstruct one request out of millions.
	req.requestId = randomUUID();

	const start = Date.now();

	// Log on FINISH, not on entry: only then do you know the status and duration.
	res.on('finish', () => {
		console.log(
			`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms [${req.requestId}]`
		);
	});

	// Middleware MUST call next() or the request hangs forever with no error.
	next();
}
```

- [ ] **18.2 — A simple API key check**

Create `src/middleware/auth.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express';

/**
 * A deliberately simple stand-in for real authentication.
 *
 * Real systems use signed tokens (JWT) that carry who the user is and cannot be
 * forged — that is what dv-service does. A shared secret proves only that the
 * caller knows the secret. The SHAPE is the lesson: check at the edge, reject
 * early, never let an unauthenticated request reach your business logic.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
	const provided = req.header('x-api-key');
	const expected = process.env.API_KEY;

	if (!expected) {
		console.error('API_KEY is not configured');
		return res.status(500).json({ error: 'Server misconfigured' });
	}

	if (provided !== expected) {
		// 401 = we don't know who you are.  403 = we know, and you may not.
		return res.status(401).json({ error: 'Missing or invalid API key' });
	}

	next();
}
```

Add to `.env` and `.env.example`:

```
API_KEY=local-dev-key-change-me
```

- [ ] **18.3 — Wire them up, in the right order**

`src/app.ts`:

```typescript
export function createApp() {
	const app = express();

	// Order matters. Each runs in the order registered.
	app.use(requestLogger);          // 1. log everything, including health checks
	app.use(express.json());         // 2. parse bodies

	// Public — no key, so monitoring can reach it.
	app.get('/health', (req, res) => {
		res.json({ status: 'ok', time: new Date().toISOString() });
	});

	// Protected — runs before any /api route handler.
	app.use('/api', requireApiKey);

	app.use('/api/todos', todoRouter);
	app.use('/api/lists', todoListRouter);

	app.use(errorHandler);           // last, always

	return app;
}
```

- [ ] **18.4 — Verify**

```bash
curl -i http://localhost:3000/health                    # 200, no key needed
curl -i http://localhost:3000/api/todos                 # 401
curl -i http://localhost:3000/api/todos \
  -H "x-api-key: local-dev-key-change-me"               # 200
```

Watch your server terminal — every request now logs method, path, status, duration and id.

- [ ] **18.5 — Commit**

```bash
git add -A && git commit -m "step 18: request logging and api key middleware"
```

---

## Step 19: Tests

You have been testing by hand with curl. That doesn't scale, and it doesn't run again when you change something six weeks from now.

- [ ] **19.1 — Install**

```bash
npm install --save-dev vitest supertest @types/supertest
```

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **19.2 — Configure**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		// Tests share one database, so running files in parallel makes them fight.
		fileParallelism: false
	},
	resolve: {
		alias: { '@': path.resolve(__dirname, './src') }
	}
});
```

The `alias` block is needed because **Vitest does not read `tsconfig.json` paths** — a very common first stumble.

- [ ] **19.3 — Write the tests**

Create `src/__tests__/todo.test.ts`:

```typescript
import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { createApp } from '@/app';

const app = createApp();
const KEY = process.env.API_KEY!;

describe('Todo API', () => {
	it('creates and reads a todo', async () => {
		const created = await request(app)
			.post('/api/todos')
			.set('x-api-key', KEY)
			.send({ title: 'Test todo', priority: 2 });

		expect(created.status).toBe(201);
		expect(created.body.title).toBe('Test todo');
		expect(created.body.is_completed).toBe(false);

		const fetched = await request(app)
			.get(`/api/todos/${created.body.id}`)
			.set('x-api-key', KEY);

		expect(fetched.status).toBe(200);
	});

	it('rejects an empty title with 400', async () => {
		const res = await request(app)
			.post('/api/todos')
			.set('x-api-key', KEY)
			.send({ title: '' });

		expect(res.status).toBe(400);
		expect(res.body.error).toBe('Validation failed');
	});

	it('returns 404 for a todo that does not exist', async () => {
		const res = await request(app)
			.get('/api/todos/00000000-0000-4000-8000-000000000000')
			.set('x-api-key', KEY);

		expect(res.status).toBe(404);
	});

	it('rejects a malformed id with 400, not 500', async () => {
		const res = await request(app)
			.get('/api/todos/not-a-uuid')
			.set('x-api-key', KEY);

		expect(res.status).toBe(400);
	});

	it('requires an api key', async () => {
		const res = await request(app).get('/api/todos');

		expect(res.status).toBe(401);
	});

	it('completes a todo only once', async () => {
		const created = await request(app)
			.post('/api/todos')
			.set('x-api-key', KEY)
			.send({ title: 'Complete me' });

		const first = await request(app)
			.post(`/api/todos/${created.body.id}/complete`)
			.set('x-api-key', KEY);

		expect(first.status).toBe(200);
		expect(first.body.todo.is_completed).toBe(true);

		const second = await request(app)
			.post(`/api/todos/${created.body.id}/complete`)
			.set('x-api-key', KEY);

		expect(second.status).toBe(200);
		expect(second.body.message).toContain('already');
	});
});
```

- [ ] **19.4 — Run**

```bash
npm test
```

Expected: 6 passing.

**Notice `createApp()` is used without `app.listen()`.** Supertest starts the app in-process on a random port. That's why Step 9.2 split those two files.

- [ ] **19.5 — Prove the tests actually test something**

Break something on purpose — change the create route's `201` to `200`. Run the tests. One fails. Change it back.

**A test that has never failed proves nothing.**

- [ ] **19.6 — Commit**

```bash
git add -A && git commit -m "step 19: api tests with vitest and supertest"
```

---

## Step 20: Compare what you built to `dv-service`

- [ ] **20.1 — Map the layers**

| Your project | dv-service | Same idea? |
|---|---|---|
| `src/routes/todo.routes.ts` | `src/api/todos/TodoController.ts` | Yes — HTTP in, HTTP out |
| `src/services/todo.service.ts` | `src/services/appServices/*.ts` | Yes — the decisions |
| `src/repos/todo.repo.ts` | `src/repos/*/*Repo.ts` | Yes — the SQL |
| `src/models/todo.model.ts` | `src/models/*.ts` | Yes — Zod input schemas |
| `src/db/schema/` | `src/db/schema/` | Identical |
| `src/middleware/errorHandler.ts` | `src/middlewares/` | Yes |
| `export const todoService = {...}` | `@Service()` + `@inject(...)` | Same purpose, different mechanism |
| `todoRouter.get('/:id', ...)` | `@Get('/:id')` | Same purpose, different mechanism |
| *(none)* | Outbox + RabbitMQ consumers | New — Handbook §18–21 |
| *(none)* | Redis caching | New — Handbook §7 |

- [ ] **20.2 — Read one dv-service slice with new eyes**

In order. It should now look familiar rather than intimidating:

1. `src/api/banners/banners.api.ts`
2. `src/api/banners/BannerController.ts`
3. `src/services/appServices/BannerService.ts`
4. `src/repos/banners/BannerRepo.ts`

- [ ] **20.3 — Find your own patterns in real code**

| You wrote | Find it in dv-service |
|---|---|
| Race-safe `markComplete` | `FraudCheckService.complete` — the same "only if not already done" idea |
| Soft delete filtering | `deleted_at` filters throughout `SubmissionRepo` |
| Partial unique index | `submission_file_fraud_checks_one_live_per_file` |
| `cascade` vs `restrict` in one table | `src/db/schema/programProducts.ts` |
| LEFT JOIN with the filter in the join | `BannerRepo.ts`, around line 227 |
| Pagination envelope | Any `findAll` in `BaseModelRepo` |

- [ ] **20.4 — Answer these in your own words**

If any is hard, go back to the step in brackets:

1. What is `package.json`, and why is `package-lock.json` separate? (1)
2. What does `@/` mean, and why doesn't plain Node understand it? (2)
3. What is middleware, and why does order matter? (3, 11, 18)
4. What is a migration, and why must you never edit an applied one? (6)
5. Why does the repo filter `deleted_at` instead of the callers? (7)
6. Why does the service throw instead of returning null? (8)
7. Why validate in the route rather than the service? (10)
8. Why does the error handler take four arguments? (11)
9. Why must a paginated query have an `ORDER BY`? (12)
10. Why is `if (check) then write` unsafe, and what replaces it? (13)
11. Why did `todo_list_id` have to be nullable? (14)
12. When do you choose `cascade`, `set null`, or `restrict`? (14)
13. What happens to unfiled todos under an `INNER JOIN`? (15)
14. What is the N+1 problem, and what shape gives it away? (16)
15. Why `count(todos.id)` and not `count(*)` in a grouped LEFT JOIN? (16)
16. Why can neither `todos` nor `tags` hold the foreign key? (17)

- [ ] **20.5 — Final check**

```bash
npm run type-check && npm test
```

- [ ] **20.6 — Commit**

```bash
git add -A && git commit -m "step 20: complete todo learning project"
```

---

## Where to go next

1. **Real authentication** — replace the API key with JWT, add a `users` table, scope todos to their owner. Forces you to think about *authorisation*, not just authentication.
2. **Transactions** — Handbook §5, §17. Add "move all todos from list A to list B" and make it all-or-nothing.
3. **Events** — Handbook §18–21. The outbox pattern is the piece that makes `dv-service` click.
4. **Caching** — Handbook §7. Add Redis, then discover that invalidation is the hard part.

But first: go back to `dv-service` and read a feature you couldn't follow before. That's the real test of whether this worked.
