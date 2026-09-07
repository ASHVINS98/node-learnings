import { Router } from "express";
import { todoService } from "@/services/todo.service";

export const todoRouter = Router()

todoRouter.post('/',async (req,res) => {
    const todo = await todoService.create(req.body);
    return res.status(201).json(todo);
})

todoRouter.get('/:id', async (req, res) => {
	const todo = await todoService.getById(req.params.id);

	res.json(todo);
});

todoRouter.get('/', async (req, res) => {
	const todos = await todoService.list();

	res.json(todos);
});