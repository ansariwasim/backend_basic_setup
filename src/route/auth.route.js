
import express from 'express'
const route = express.Router()
import authController from '../controllers/auth.controller.js';
import upload from "../middleware/multer.middleware.js";


route.post("/register",  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]), authController.registerUser)

export default route;