import { Router } from "express";
import { createUser, login, logout  } from "../controllers/users/users.controller";
import { authMiddleware, refreshSession } from "../middlewares/auth/authMiddleware";

const userRouter = Router();

userRouter.post("/create", createUser);
userRouter.post("/login", login);
userRouter.post("/refresh",  refreshSession); 
userRouter.get("/logout", authMiddleware, logout); 

userRouter.get('/auth', authMiddleware, (req, res) => {
    const user = (req as any).user;
    res.json({ user });
});

export default userRouter;
