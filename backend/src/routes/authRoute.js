import express from "express";
import isAuth from "../middlewares/isAuth.js";
import isAdminOrHR from "../middlewares/isAdminOrHR.js";
import { 
  login, 
  logout, 
  createEmployee, 
  getMe, 
  changePassword
} from "../controllers/authController.js";

const authRouter = express.Router();

// Public routes
authRouter.post("/login", login);
authRouter.post("/logout", logout);

// Protected routes
authRouter.get("/me", isAuth, getMe);
authRouter.post("/change-password", isAuth, changePassword);

// Admin/HR only routes
authRouter.post("/create-employee", isAuth, isAdminOrHR, createEmployee);

export default authRouter;