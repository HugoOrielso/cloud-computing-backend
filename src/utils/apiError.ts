export class ApiError extends Error {
    statusCode: number
    isOperational: boolean
    code?: string
  
    constructor(message: string, statusCode: number, code?: string, isOperational = true) {
      super(message)
      this.statusCode = statusCode
      this.isOperational = isOperational
      this.code = code
      Error.captureStackTrace(this, this.constructor)
    }
  }
  