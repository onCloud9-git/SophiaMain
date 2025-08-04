"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const index_1 = require("../index");
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // Validate request body
            if (schema.body) {
                req.body = schema.body.parse(req.body);
            }
            // Validate request params
            if (schema.params) {
                req.params = schema.params.parse(req.params);
            }
            // Validate request query
            if (schema.query) {
                req.query = schema.query.parse(req.query);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                index_1.logger.warn('Validation error:', {
                    path: req.path,
                    method: req.method,
                    errors: error.errors
                });
                res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
                return;
            }
            index_1.logger.error('Unexpected validation error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal validation error'
            });
        }
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validation.middleware.js.map