export class AppError extends Error {
    constructor(
        message : string,
        public statusCode: number,
        public details?: unknown
    ){
        super(message)
        this.name = this.constructor.name;
    }
}

export class NotFoundError extends AppError {
    constructor(message : string = "Resource not found"){
        super(message,404);
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
