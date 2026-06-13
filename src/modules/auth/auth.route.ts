import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

// url is also called api endpoint.
/* router.post("/login", authController.loginUser);
router.post("/refresh-token", authController.refreshToken); */
// creating users
router.post("/signup", authController.registerUser);

export const authRoute = router;
