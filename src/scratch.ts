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