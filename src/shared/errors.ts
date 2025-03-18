import { AppError } from "./AppError";

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
    }
}

export class DatabaseError extends AppError {
    constructor(message: string) {
        super(message, 500);
    }
}