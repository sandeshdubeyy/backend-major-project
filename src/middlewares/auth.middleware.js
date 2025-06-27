import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";
import { application } from "express";

export const verifyJWT = asyncHandler(async (req,_,next) => { //res ki jagah _ dalna industry practice h ki woh use nhi hora
        
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ","");
    
        if(!token){
            throw new ApiError(401,"Unauthorized request");
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-passsword -refreshTokens");
    
        if(!user)
        {
            throw new ApiError(401,"Invalid access token");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token");
    }
})