import {Router } from "express"
import {loginUser, logoutUser, registerUser, getCurrentUser} from "../controller/user.controller.js"
import { validateUser } from "../middleware/auth.middleware.js";


const router = Router();

router.route("/register").post(
    registerUser
)

router.route("/login").post(
        loginUser
)


router.route("/logout").post(
    validateUser,
    logoutUser
)

router.route("/current-user").get(
    validateUser,
    getCurrentUser
)



export default router