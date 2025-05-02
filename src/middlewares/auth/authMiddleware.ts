import { Request, Response, NextFunction } from 'express'
import { createToken, verifyAccessToken, verifyRefreshToken } from '../../services/jwt.service'

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.access_token;
  
  if (!token) {
    res.status(401).json({ message: 'No token' })
    return
  }

  try {
    const user = verifyAccessToken(token);
    (req as any).user = user
    next()
  } catch (err) {
    res.status(403).json({ message: 'Token inválido o expirado' })
    return
  }
}

export const refreshSession = (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token
  
  if (!refreshToken) res.status(403).json({
    message: 'Token requerido'
  }) 


  try {
    const user = verifyRefreshToken(refreshToken)
    const maxAge = 15 * 60 * 1000
    const newAccessToken = createToken(user,maxAge)

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge,
    })

    res.status(200).json({ message: 'Token renovado correctamente' })
  } catch (err) {
    
    res.status(403).json({ message: 'Refresh token inválido' })
  }
}