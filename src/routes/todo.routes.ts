import { Router } from "express";
import { todoService } from "@/services/todo.service";
import { createTodoSchema,idParamSchema } from "../models/todo.model";

export const todoRouter = Router()

todoRouter.post('/',async (req,res) => {
	const data = createTodoSchema.parse(req.body);
    const todo = await todoService.create(data);

    return res.status(201).json(todo);
})

todoRouter.get('/:id', async (req, res) => {
	const idParams = idParamSchema.parse(req.params.id);
	const todo = await todoService.getById(idParams.id);

	res.json(todo);
});

todoRouter.get('/', async (req, res) => {
	const todos = await todoService.list();

	res.json(todos);
});