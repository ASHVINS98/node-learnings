import 'dotenv/config';
import { todoRepo } from '@/repos/todo.repo';
import { closeDb } from '@/db/client';
import { todoService } from './services/todo.service';

async function main() {
	const created = await todoService.create({
		title : "second todo"
	})
	console.log(created);
	
	try {
		await todoService.getById('00000000-0000-4000-8000-000000000000');
	} catch (err) {
		console.log('Correctly threw:', (err as Error).message);
	}
	const list = await todoService.list();
	console.log('All todos:', list);
	await closeDb()
}

main();