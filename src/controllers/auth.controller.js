import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const generateAccessTokenAndRefreshToken = async (userId) => {

    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(400, "User not found")
        }

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
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

    const createUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createUser) {
        throw new ApiError(400, "Errow throw while user register")
    }

    res.status(200).json(new ApiResponse(401, createUser, "User register successfully"))

});


// logic controller
const loginUser = asyncHandler(async (req, res) => {

    const { userName, email, password } = req.body

    if (!(userName || email)) {
        throw new ApiError(400, "userName or email are required")
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
        $or: [
            { userName }, { email }
        ]
    })

    if (!user) {
        throw new ApiError(400, "user doesnot exist,")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid user credentials password")
    }

    const { refreshToken, accessToken } = await generateAccessTokenAndRefreshToken(user._id)


    const loginUser = await User.findById(user._id).select("-password -accesstoken ")

    const options = {
        httpOnly: true,
        secure: true
    }

    res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, { user: loginUser, refreshToken, accessToken }, "User logged in successfully"))


})

// logout controller
const logoutUser = asyncHandler(async (req, res) => {


    await User.findByIdAndUpdate(req.user._id,
        {
            $unset: {
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
        .json(new ApiResponse(200, {}, "user loggedOut successfully"))
})

// refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Invalid refresh token")
    }

    try {
        const decoded = Jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decoded._id)
        if (!user) {
            throw new ApiError(401, "unuthorized user")
        }

        if (user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "invalid user refresh token")
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id)

        const options = {
            httpOnly: true,
            secure: true,
        }

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Create accessToken successfully"))
    } catch (error) {
        throw new ApiError(401, error.message || "something when wrong while refresh accessToken")
    }


})

// change Password 
const changePassword = asyncHandler(async (req, res) => {

    const { currentPassword, newPassword } = req.body

    // validate the fields
    if (!(currentPassword && newPassword)) {
        throw new ApiError(400, "All fields are required")
    }

    // find the user
    const user = await User.findById(req.user._id)

    if (!user) {
        throw new ApiError(404, "unauthorized user")
    }
    // password comparision
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "your current password is incorrect")
    }

    // updated a password
    user.password = newPassword
    // save new password
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed Successfully"))


})

// Get currentUser 
const getCurrentUser = asyncHandler(async (req, res) => {

    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current User fetch successfully"))

})

// updateAccoutDetail 
const updateAccoutDetail = asyncHandler(async (req, res) => {

    const { fullName, email } = req.body

    if ([fullName, email].some((field) => !field || field.trim() == " ")) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json( new ApiResponse(200, {user}, "updated account detail successfully"))

})

// update avatar image
const updateAvatarImage = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required")
    }

    const uploadAvatarImage = await uploadOnCloudinary(avatarLocalPath)
    if (!uploadAvatarImage.url) {
        throw new ApiError(401, "update url not found")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: uploadAvatarImage.url
            }
        },
        { new: true }
    ).select("-password")

    if (!user) {
        throw new ApiError(404, "user  not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { user }, "updated avatar image successfully"))
})

// updata cover image
const updateCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage is required")
    }

    const uploadCoverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!uploadCoverImage.url) {
        throw new ApiError(500, "failed to upload coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: uploadCoverImage.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { user }, "Cover Image updated successfully"))
})

// getUserChannelProfile
const getUserChannelProfile = asyncHandler(async(req,res)=>{

  const {userName} = req.params

  if(!userName?.trim()){
    throw new ApiError(400, "userName is missing")
  }

  const channel = await User.aggregate([
    {
        $match: {
            userName: userName
        }
    },
    {
        $lookup: {
            from: "subcriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subcribers"
        }
    },
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subcribedTo"
      }  
    },
    {
        $addFields: {
            subcriberToCount: {
                $size: "$subcribers"
            },
            $channelsSubcriberToCount:{
                $size: "$subcribedTo"
            },
            isSubcribed:{
                $cond:{
                    if:{$in:[req.user?.-id, "$subcribers.subcribers"]},
                    then : true,
                    else: false,
                }
            }

        }
    },
    {
     $project: {
        fullName: 1,
        userName: 1,
        subcriberToCount: 1,
        $channelsSubcriberToCount: 1,
        isSubcribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
     }
    }
  ])

  if(!channel?.length){
    throw new ApiError(400, "Channel does not exist")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "User channel fetched successfully")
  )

})


export default { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateAccoutDetail, updateAvatarImage, updateCoverImage, getUserChannelProfile };