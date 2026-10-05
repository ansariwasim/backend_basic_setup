
import express from 'express'
const route = express.Router()

route.get("/home", (req, res)=>{
   console.log("heelo")
})

export default route;