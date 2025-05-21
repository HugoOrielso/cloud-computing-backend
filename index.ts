import path from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import os from 'os-utils';
import { getProjectUsage, trackUsage } from './src/middlewares/projectsUsageTracker';
import userRouter from './src/router/user.routes';
import filesRouter from './src/router/files.routes';

const app = express();
const server = createServer(app); // usamos http.createServer
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(trackUsage); // antes de servir los estáticos

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

const PORT = process.env.PORT ?? 4321;

app.use("/api/users", userRouter);
app.use("/api/files", filesRouter);
app.get('/api/system/project-usage', (req, res) => {
  res.json(getProjectUsage());
});

// SOCKET.IO: emitir uso de CPU en tiempo real
io.on('connection', (socket) => {
    console.log('🟢 Cliente conectado al socket');

    const interval = setInterval(() => {
        os.cpuUsage((cpu) => {
            const free = os.freememPercentage();
            const usedMem = (1 - free) * 100;
            socket.emit('system_update', {
                cpu: parseFloat((cpu * 100).toFixed(2)),
                mem: parseFloat(usedMem.toFixed(2)),
                time: new Date().toLocaleTimeString()
            });
        });
    }, 1000);

    socket.on('disconnect', () => {
        console.log('🔴 Cliente desconectado');
        clearInterval(interval);
    });
});


// Iniciar servidor HTTP (y no app.listen)
server.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
