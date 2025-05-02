import { RowDataPacket } from 'mysql2'

export interface User extends RowDataPacket {
  id: string
  name: string
  email: string
  password?: string
  created_at?: Date
}

export interface Payload {
  id: string;
  email: string;
  iat: number;
  exp: number
}

export interface FileData {
  filename: string;
  filepath: string;
}

