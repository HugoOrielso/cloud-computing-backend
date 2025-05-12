import path from 'path';
import express from 'express'
import userRouter from './src/router/user.routes'
import cors from 'cors';
import cookieParser from 'cookie-parser';
import filesRouter from './src/router/files.routes';

const app = express()
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true              
}));

app.use(cookieParser())
const PORT = process.env.PORT ?? 4321

app.use("/api/users", userRouter)
app.use("/api/files", filesRouter)

app.listen(PORT, ()=>{
    console.log(`Server on port ${PORT}`);
})

