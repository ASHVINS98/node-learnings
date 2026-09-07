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