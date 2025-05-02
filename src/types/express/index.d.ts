import 'express';

declare module 'express' {
  export interface Request {
    user?: {
      id: string;
      email: string;
      iat: number;
      exp: number
    };
  }
}