import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
export declare const validateRequest: (schema: {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
}) => (req: Request, res: Response, next: NextFunction) => void;
