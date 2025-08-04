import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { logger } from '../index'

export const validateRequest = (schema: {
  body?: ZodSchema
  params?: ZodSchema
  query?: ZodSchema
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body)
      }

      // Validate request params
      if (schema.params) {
        req.params = schema.params.parse(req.params)
      }

      // Validate request query
      if (schema.query) {
        req.query = schema.query.parse(req.query)
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation error:', {
          path: req.path,
          method: req.method,
          errors: error.errors
        })

        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
        return
      }

      logger.error('Unexpected validation error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal validation error'
      })
    }
  }
}