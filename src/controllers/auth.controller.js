import {asyncHandler} from "../utils/asyncHandler.js";
import{ ApiError }from "../utils/ApiError.js";
import{ ApiResponse} from "../utils/ApiResponse.js";
import{ User} from "../models/user.model.js";

const registerUser = asyncHandler(async (req, res) => {

    // 1. Get user data from request body
    const { userName, email, fullName, password } = req.body;

    // 2. Validate required fields
    if (
        [userName, email, fullName, password]
            .some((field) => !field || field.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with username or email already exists");
    }

    // 4. Create user
    const user = await User.create({
        userName,
        email,
        fullName,
        password
    });

    // 5. Find created user without password and refreshToken
    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken");

    // 6. Check if user was created
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    // 7. Send response
    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        )
    );
});

export default { registerUser };