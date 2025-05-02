import { Request, Response, NextFunction } from 'express'
import { createUserDTO, LoginDto } from './usersDto'
import { UserService } from '../../services/users.service'
import { hash, compare } from 'bcrypt'
import { createRefreshToken, createToken } from '../../services/jwt.service'

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body as createUserDTO;

    if (!email || !name || !password) {
      res.status(400).json({ message: 'Faltan datos por enviar' });
      return;
    }

    const hashedPassword = await hash(password, 10);

    const user = await UserService.createUser({
      email,
      password: hashedPassword,
      name,
    });

    res.status(201).json({ message: 'Usuario creado con éxito', user });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear el usuario' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as LoginDto

    if (!email || !password) {
      res.status(400).json({ message: 'Faltan datos por enviar' })
      return
    }

    const user = await UserService.login(email)

    
    if (!user || !user.password) {
      res.status(400).json({ message: 'Usuario no encontrado' })
      return
    }

    const verifyPassword = await compare(password, user.password)
    if (!verifyPassword) {
      res.status(400).json({ message: 'Contraseña incorrecta' })
      return
    }

    const access_token_max_age = 15 * 60 * 1000;
    const refresh_token_max_age = 7 * 24 * 60 * 60 * 1000;
    
    const token = createToken(user,access_token_max_age)
    const refreshToken = createRefreshToken(user,refresh_token_max_age)

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: access_token_max_age,
    })

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refresh_token_max_age,
    })

    res.status(200).json({
      message: 'Login exitoso'
    })

  } catch (err) {
    res.status(500).json({
      message: "Ocurrió un error"
    })
  }
}

export const logout = (req: Request, res: Response) => {
  res.clearCookie('access_token').clearCookie('refresh_token').json({ message: 'Sesión cerrada' })
}


