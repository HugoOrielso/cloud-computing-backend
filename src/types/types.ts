import { RowDataPacket } from 'mysql2'

export interface User extends RowDataPacket {
  id: string
  name: string
  email: string
  password?: string
  created_at?: Date
}
