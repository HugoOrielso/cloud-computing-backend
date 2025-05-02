import { Router } from "express";
import { authMiddleware } from "../middlewares/auth/authMiddleware";
import { listProjects, uploadFiles } from "../controllers/files/files.controller";
import upload from "../middlewares/multer/multerStorage";

const filesRouter = Router();

filesRouter.post("/upload", authMiddleware, upload.array('files'), uploadFiles);
filesRouter.get('/projects', authMiddleware, listProjects);


export default filesRouter;
