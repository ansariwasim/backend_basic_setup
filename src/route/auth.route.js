
import express from 'express'
const route = express.Router()
import authController from '../controllers/auth.controller.js';
import upload from "../middleware/multer.middleware.js";
import { verifyJwt } from '../middleware/auth.middleware.js';


route.post("/register", upload.fields([
  {
    name: "avatar",
    maxCount: 1,
  },
  {
    name: "coverImage",
    maxCount: 1,
  },
]), authController.registerUser)


//  login route
route.post("/login", authController.loginUser)

// logout route
route.post("/logout", verifyJwt, authController.logoutUser)

// Refresh access Token 
route.post("/refresh-token", authController.refreshAccessToken)

// change password 
route.patch("/change-password", verifyJwt, authController.changePassword)

// Get current User
route.get("/current-user", verifyJwt, authController.getCurrentUser)

// change user detail
route.patch("/updateUserDetail", verifyJwt, authController.updateAccoutDetail)

// change avartar image
route.patch( "/changeAvatarImage",
    verifyJwt,
    upload.single("avatar"),
    authController.updateAvatarImage
);
export default route;