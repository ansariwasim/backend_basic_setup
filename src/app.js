// Create server

import express from 'express'
const app = express()
import multer from 'multer'
import cookieParser from 'cookie-parser';

// middleware 
const upload = multer({
    dest: "public/temp"
});
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



// Import route
import authRoute from './route/auth.route.js'

// route
app.use("/api/v1/auth", authRoute)


export default app;