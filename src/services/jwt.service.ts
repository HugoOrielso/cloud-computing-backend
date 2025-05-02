import jwt from 'jsonwebtoken'
import moment from 'moment'
import { config } from 'dotenv'
import { secretKey as configSecretKey, refreshKey as configRefreshKey } from '../config'
import { User } from '../types/types'
config()

export const createToken = (user: User, maxAge: number): string => {
  const payload = {
    id: user.id,
    email: user.email,
    iat: moment().unix(),
  }
  const secretKey = configSecretKey || process.env.SECRET_KEY || 'defaultSecretKey'
  return jwt.sign(payload, secretKey, { expiresIn: `${maxAge}s` }) 
}

export const createRefreshToken = (user: User, maxAge: number): string => {
  const payload = {
    id: user.id,
    email: user.email,
    iat: moment().unix(),
  }
  const secretKey = configRefreshKey || process.env.REFRESH_KEY || 'defaultRefreshKey'
  return jwt.sign(payload, secretKey, { expiresIn: `${maxAge}d` })
}

export const verifyAccessToken = (token: string): User => {
  const secretKey = configSecretKey || process.env.SECRET_KEY || 'defaultSecretKey'
  return jwt.verify(token, secretKey) as User
}

export const verifyRefreshToken = (token: string): User => {
  const secretKey = configRefreshKey || process.env.REFRESH_KEY || 'defaultRefreshKey'
  return jwt.verify(token, secretKey) as User
}
