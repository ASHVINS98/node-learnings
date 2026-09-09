import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

import { AppError } from '@/errors';


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

