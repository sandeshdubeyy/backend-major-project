import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudianry} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { application } from "express";
import jwt from "jsonwebtoken"


// creating seperate method for generating access and refresh token


const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId);
        
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken(); // dono m jwt token aayenge ,basically pura user data encyrpter form m aayega jo ki jwt algo lagake lambi string ban jati

        user.refreshTokens=refreshToken;
        await user.save( {validateBeforeSave:false} ); // does not need to check all fields because password was already valiadated while logging in

        return{accessToken,refreshToken};
    } catch (error) {
        console.error("Token generation failed:", error.message);
        throw new ApiError(500,"Something went wrong while generating access and refresh token");
    }
}


const registerUser=asyncHandler( async(req,res) =>
{
    //get user details (username,password,email,fullname)
    
    const {fullname,email,username,password}=req.body;
    console.log(req.files);
    //validation of all the fields if they filled correctly or not

    if([fullname,email,username,password].some((field)=>
    field?.trim() === ""))
    {
        throw new ApiError(400,"all fields are not filled");
    }

    //check if user already exists

    const existedUser = await User.findOne({
        $or:[{ username },{ email }] //mongo db operatos
    })
    
    if(existedUser)
    {
        throw new ApiError(409,"User with similar email or username already exists");
    }
    
    //check for images and validate
    
    let avatarLocalPath;
    
    if (req.files?.avatar?.[0]) {
        avatarLocalPath = req.files.avatar[0].path;
    }
    //const coverImageLocalPath=req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImageLocalPath=req.files.coverImage[0].path;
    }

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


const loginUser = asyncHandler(async(req,res)=>{

    // get info from req body
   
    const {email,username,password}=req.body;
   
    // validate the username or email
   
    if(!username && !email)
    {
        throw new ApiError(400,"username or email is required");
    }
   
    // check if user exists
   
    const user = await User.findOne({ // yeh bool nhi h ,isme user model ki saari information rahegi uss user ki jisko find krre h
        $or:[{email},{username}] //mongo db operators
    })
 
    if(!user)
    {
        throw new ApiError(404,"User does not exist");
    }
   
    // check password

    const isPasswordValid = user.isPasswordCorrect(password); // boolean aayega

    if(!isPasswordValid)
    {
        throw new ApiError(401,"Password is incorrect");
    }
    
    // give access and ref token
    
    const {accessToken,refreshToken} =  await generateAccessAndRefreshToken(user._id);  
    
    // extra : update the user in this function as its access token field is emtpy

    const loggedInUser = await User.findById(user._id).select("-password  -refreshTokens");

    // generate cookies to send access and ref tokens
    
    // send a final response
    
    const options = {
        httpOnly:true, //ab sirf database se changes kiye ja sakte h ya server side se
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user: loggedInUser,
                  accessToken,
                  refreshToken
        },
        "User has logged in successfully"
        )
    );
});


const logoutUser = asyncHandler(async(req,res)=>{
    // first making a new custom middleware which will help in authentication

    // done

    //update refresh token data of user in model

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshTokens:undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true, 
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User has logged out successfully"));
});


const AccessRefreshToken = asyncHandler(async(req,res)=>{
    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user)
        {
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshTokens)
        {
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} = generateAccessAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(200,
                {
                    accessToken , refreshToken:newRefreshToken
                },"Access token refreshed") 
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }

});


export {
    registerUser,
    loginUser,
    logoutUser,
    AccessRefreshToken
};