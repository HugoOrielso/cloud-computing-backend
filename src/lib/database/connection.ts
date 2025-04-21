import mysql from 'mysql2/promise'

export const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cloud_computing',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
})

