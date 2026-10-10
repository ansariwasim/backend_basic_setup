import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"

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

    res.status(401).json(new ApiResponse(400, createUser, "User register successfully"))

});

export default { registerUser };