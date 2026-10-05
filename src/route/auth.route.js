
import express from 'express'
const route = express.Router()
import authController from '../controllers/auth.controller.js';

route.post("/register", authController.register )

export default route;