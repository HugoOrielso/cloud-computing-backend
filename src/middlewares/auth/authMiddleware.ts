import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../../services/jwt.service'

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.access_token

  if (!token) {
    res.status(401).json({ message: 'No token' })
    return
  }

  try {
    const user = verifyAccessToken(token)
    ;(req as any).user = user
    next()
  } catch (err) {
    res.status(403).json({ message: 'Token inválido o expirado' })
    return
  }
}
