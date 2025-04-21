// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express'


export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Error interno del servidor'
  let code = err.code || 'ERR_INTERNAL'

  const response: any = {
    code,
    message,
  }

  // Si es un error de validación, incluye los detalles
  if (err.errors) {
    response.errors = err.errors
  }

  // Solo en desarrollo mostramos el stack
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack
  }

  res.status(statusCode).json(response)
}
