import { ApiError } from "./apiError"

export class NotFoundError extends ApiError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'ERR_NOT_FOUND')
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'No autenticado') {
    super(message, 401, 'ERR_UNAUTHORIZED')
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Sin permisos') {
    super(message, 403, 'ERR_FORBIDDEN')
  }
}

export class ValidationError extends ApiError {
  constructor(errors: any[], message = 'Datos inválidos') {
    super(message, 400, 'ERR_VALIDATION')
    this.errors = errors
  }
  errors: any[]
}
