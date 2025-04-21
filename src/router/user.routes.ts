import { Router } from "express";
import { createUser, login, uploadFiles, refreshSession } from "../controllers/users/users.controller";
import upload from "../middlewares/multer/multerStorage";
import { authMiddleware } from "../middlewares/auth/authMiddleware";

const userRouter = Router();

userRouter.post("/create", createUser);
userRouter.post("/", login);
userRouter.post("/upload", authMiddleware, upload.any(), uploadFiles);
userRouter.post("/refresh", authMiddleware,  refreshSession); 
userRouter.post("/prueba", authMiddleware,  (req, res) => {
    res.status(200).json({message: "ok"})
}); 

export default userRouter;
