import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const generateAccessTokenAndRefreshToken = async (userId)=>{

try {
      const user =  await User.findById(userId)
      if(!user){
         throw new ApiError(400, "User not found")
      }
    
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()
    
      user.refreshToken = refreshToken;
      await user.save({validateBeforeSave: false})
    
      return {accessToken, refreshToken}
} catch (error) {
    throw new ApiError(400, " something went wronge While generating accessToken and refresh Token ")
}
}


// Register controller
const registerUser = asyncHandler(async (req, res) => {

    const { fullName, userName, email, password } = req.body

    if ([fullName, userName, email, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All field are required")
    }

    const userAlreadyExist = await User.findOne({
        $or: [
            { email }, { userName }
        ]
    })

    if (userAlreadyExist) {
        throw new ApiError(409, "User already register. go to login route")
    }

    // avatar and cover local path

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar Image is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    const user = await User.create({
        fullName,
        userName,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage.url || ""

    })

    const createUser = await User.findById(user._id).select( "-password -refreshToken")

    if (!createUser) {
        throw new ApiError(400, "Errow throw while user register")
    }

    res.status(200).json(new ApiResponse(401, createUser, "User register successfully"))

});


// logic controller
const loginUser = asyncHandler(async(req,res)=>{

    const {userName, email, password} = req.body

    if(!(userName || email)){
        throw new ApiError(400, "userName or email are required")
    }

      if (!password) {
  throw new ApiError(400, "Password is required");
}

const user = await User.findOne({
    $or:[
        {userName}, {email}
    ]
})

if(!user){
    throw new ApiError(400, "user doesnot exist,")
}

const isPasswordCorrect = await user.isPasswordCorrect(password)

if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid user credentials password")
}

const {refreshToken, accessToken} = await generateAccessTokenAndRefreshToken(user._id)


const loginUser = await User.findById(user._id).select("-password -accesstoken ")

const options = {
httpOnly: true,
secure: true
}

res
.status(200)
.cookie("refreshToken", refreshToken, options)
.cookie("accessToken", accessToken, options)
.json(new ApiResponse(200, {user: loginUser, refreshToken, accessToken}, "User logged in successfully"))


})

// logout controller
const logoutUser = asyncHandler(async(req, res)=> {

    
    await User.findByIdAndUpdate(req.user._id,
        {
          $unset:{
            refreshToken: 1
          }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true

    }

    return res
    .status(200)
    .cookie("accessToken", options)
    .cookie("refreshToken", options)
    .json(new ApiResponse(200,{}, "user loggedOut successfully"))
})


export default { registerUser , loginUser, logoutUser};