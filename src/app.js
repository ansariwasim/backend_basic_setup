// Create server

import express from 'express'
const app = express()

import cookieParser from 'cookie-parser';

// middleware 
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



// Import route
import authRoute from './route/auth.route.js'

// route
app.use("/api/auth", authRoute)


export default app;