import {createConnection} from 'mysql2'


export const conection = await createConnection({
    database: 'cloud_computing',
    host: 'localhost',
    user: 'root',
    password: '',
    port: '3306 '
},  console.log('Conectado a la base de datos'))
  