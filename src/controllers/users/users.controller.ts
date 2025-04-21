import { Request, Response, NextFunction } from 'express'
import { createUserDTO, LoginDto } from './usersDto'
import { ValidationError } from '../../utils/errors'
import { UserService } from '../../services/users.service'
import { hash, compare } from 'bcrypt'
import { createRefreshToken, createToken, verifyRefreshToken } from '../../services/jwt.service'

export async function createUser(req: Request<{}, {}, createUserDTO>, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body
    const errors = []

    if (!email) {
      errors.push({ field: 'email', message: 'Requerido' })
    }

    if (!password) {
      errors.push({ field: 'password', message: 'Requerido' })
    }

    if (!name) errors.push({ field: 'nombre', message: 'Requerido' })


    if (errors.length) {
      throw new ValidationError(errors)
    }

    const hashedPassword = await hash(password,10)

    const user = await UserService.createUser({
      email,
      password: hashedPassword,
      name
    })
    

    res.status(201).json({
      message: 'Usuario creado con éxito',
      user
    })
  } catch (err) {
    next(err)
  }
}


export async function login(req: Request<{}, {}, LoginDto>, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body
    const errors = []

    if (!email) errors.push({ field: 'email', message: 'Requerido' })
    if (!password) errors.push({ field: 'password', message: 'Requerido' })
    if (errors.length > 0) throw new ValidationError(errors)

    const user = await UserService.login(email)
    if (!user) throw new ValidationError([{ field: 'email', message: 'Email equivocado' }])
    if (!user.password) throw new ValidationError([{ field: 'password', message: 'Contraseña no encontrada' }])

    const verifyPassword = await compare(password, user.password)
    if (!verifyPassword) {
      throw new ValidationError([{ field: 'password', message: 'Contraseña incorrecta' }])
    }

    const token = createToken(user)
    const refreshToken = createRefreshToken(user)

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 min
    })

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    })

    res.status(200).json({
      message: 'Login exitoso',
      user,
    })
  } catch (err) {
    next(err)
  }
}


export async function uploadFiles(req: Request, res: Response)   {

  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    res.status(400).json({ message: 'No se subió ningún archivo.' });
    return;
  }

  res.status(200).json({
    message: 'Archivos subidos correctamente',
    total: (req.files as Express.Multer.File[]).length,
    files: (req.files as Express.Multer.File[]).map(file => ({
      originalName: file.originalname,
      path: file.path
    }))
  });
}


export const logout = (req: Request, res: Response) => {
  res.clearCookie('access_token').clearCookie('refresh_token').json({ message: 'Sesión cerrada' })
}


export const refreshSession = (req: Request, res: Response) => {
  const errors = []
  const refreshToken = req.cookies.refresh_token
  if (!refreshToken) errors.push({ field: 'token', message: 'Requerido' })

  if (errors.length > 0) throw new ValidationError(errors)

  try {
    const user = verifyRefreshToken(refreshToken)
    const newAccessToken = createToken(user)

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    })

    res.json({ message: 'Token renovado correctamente' })
  } catch (err) {
    res.status(403).json({ message: 'Refresh token inválido' })
  }
}