import { todoRepo } from "@/repos/todo.repo";
import { NotFoundError } from "@/errors";
import type { TodoInsert } from "@/db/schema";


export const todoService = {
    async create(data:TodoInsert){
        return todoRepo.create(data);
    },

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

} 