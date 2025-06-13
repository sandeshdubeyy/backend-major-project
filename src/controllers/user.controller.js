import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudianry} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser=asyncHandler( async(req,res) =>
{
    //get user details (username,password,email,fullname)
    
    const {fullname,email,username,password}=req.body;
    console.log("email: ",email);
    
    //validation of all the fields if they filled correctly or not

    if([fullname,email,username,password].some((field)=>
    field?.trim() === ""))
    {
        throw new ApiError(400,"all fields are not filled");
    }

    //check if user already exists

    const existedUser = User.findOne({
        $or:[{ username },{ email }]
    })

    if(existedUser)
    {
        throw new ApiError(409,"User with similar email or username already exists");
    }
    
    //check for images and validate
    
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    console.log(avatarLocalPath);

    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar field is required");
    }

    //upload on cloudinary

    const avatar = await uploadOnCloudianry(avatarLocalPath);
    const coverImage = await uploadOnCloudianry(coverImageLocalPath);

    //confirm if avatar it is uploaded or not as it is required field

    if(!avatar)
    {
        throw new ApiError(400,"Avatar field is required");
    }

    //create object of user to update in mongodb

    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    });

    //remove password and refresh token from response
    
    const userCreated=await User.findById(user._id).select(
        "-password -refreshTokens"
    );

    //check for user creation

    if(!userCreated)
    {
        throw new ApiError(500,"Something went wrong while registering user");
    }

    // send response

    return res.status(201).json(
        new ApiResponse(200,userCreated,"User is registered Succesfully")
    );
});

export {registerUser};