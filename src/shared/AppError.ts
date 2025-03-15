import { STATUS_CODES } from 'http';

export abstract class AppError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = STATUS_CODES[statusCode] || 'UnknownError';
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}