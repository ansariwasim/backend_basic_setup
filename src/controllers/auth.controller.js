
// import {User} from "../models/user.model.js" 
import {asyncHandler } from '../utils/asyncHandler.js'

const register = asyncHandler( (req, res)=> {
    console.log("This is Working")
    if(!req){
     res.status(200)

    }
})

export default {register}