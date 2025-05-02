import { FileData, User } from '../types/types.js'
import { createUserDTO } from '../controllers/users/usersDto'
import { db } from '../lib/database/connection'
import { v4 as uuidv4 } from 'uuid';

export async function createUser(data: createUserDTO) {
    const [rows] = await db.query<User[]>(
        'SELECT * FROM users WHERE email = ?',
        [data.email]
    )

    if (rows.length > 0) {
        throw new Error('Ya existe un usuario con este email')
    }

    await db.query(
        'INSERT INTO users (email, name, password) VALUES (?, ?, ?)',
        [data.email, data.name, data.password]
    )

    return {
        email: data.email,
    }
}

export async function getAllUsers(): Promise<User[]> {
    const [rows] = await db.query<User[]>(
        'SELECT id, email, created_at FROM users'
    )
    return rows
}

export async function getUserById(id: string): Promise<User | null> {
    const [rows] = await db.query<User[]>(
        'SELECT id, name, email, created_at FROM users WHERE id = ?',
        [id]
    )
    return rows[0] || null
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const [rows] = await db.query<User[]>(
        'SELECT id, name, email, created_at FROM users WHERE id = ?',
        [email]
    )
    return rows[0] || null
}

export async function login(email: string): Promise<User | null> {
    const [rows] = await db.query<User[]>(
        'SELECT id, email, password FROM users WHERE email = ?',
        [email]
    )

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return null;
    }

    return rows[0] as User;
}



export const UserService = {
    createUser,
    getAllUsers,
    getUserById,
    login,
    getUserByEmail
}