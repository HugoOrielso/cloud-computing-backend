import express from 'express'
import { errorHandler } from './src/middlewares/errors/errorHandler'
import userRouter from './src/router/user.routes'
import path from 'path';
import fs from 'fs';

const app = express()
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use('/static', express.static(process.cwd() + '/uploads'));
  
const PORT = process.env.PORT ?? 4321

app.use("/api/users", userRouter)
app.use(errorHandler)

app.listen(PORT,()=>{
    console.log(`Server on port ${PORT}`);
})

