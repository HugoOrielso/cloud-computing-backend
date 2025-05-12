import { Router } from "express";
import { authMiddleware } from "../middlewares/auth/authMiddleware";
import { getMetricasProyecto, getProject, importarProyectoDesdeGithub, listProjects, lookFiles, uploadFiles, uploadFilesFromLocal } from "../controllers/files/files.controller";
import upload from "../middlewares/multer/multerStorage";

const filesRouter = Router();

filesRouter.post("/upload", authMiddleware, upload.array('files'), uploadFiles);
filesRouter.post("/uploadFromLocal", authMiddleware, upload.array('files'), uploadFilesFromLocal);
filesRouter.post("/uploadFromGithub", authMiddleware,  importarProyectoDesdeGithub);
filesRouter.get('/projects', authMiddleware, listProjects);
filesRouter.get('/projects/:id', authMiddleware, getProject);
filesRouter.get('/projects-metricas', authMiddleware, getMetricasProyecto);
filesRouter.get('/projects-metricas', authMiddleware, getMetricasProyecto);
filesRouter.get('/projects/:folder/file/:filename', authMiddleware, lookFiles);


export default filesRouter;
