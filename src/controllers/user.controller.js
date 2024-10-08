// import { asyncHandler } from "../utils/asyncHandler";
import {asyncHandler} from  "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/User.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import { json } from "express";

const registerUser = asyncHandler( async (req,res)=>{
// get user details from frontend
// validation
// check if the user already exist
// check for images for avatar
// upload avatar and cover on cloudinary 
// create user Object - create entry in db
// remove password and refresh token from response
// check for user creation
// send res

const {fullName,userName,email,password} = req.body
    console.log(fullName,userName,email,password);
    console.log("files arhi  hain",req.files);
    

    if([fullName,userName,email,password].some((field)=> field?.trim() === "")){
        throw new ApiError(400,"All fields are requires")
    }

    const userExist = await User.findOne(
        {
            $or : [{email},{userName}]
        }
    )
   if(userExist){
    throw new ApiError(408,"User with this email or username already exist")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path
   console.log(avatarLocalPath);

//    const coverImageLocalPath =req.files?.coverImage[0]?.path

let coverImageLocalPath;
let coverImageUrl;
let coverImage;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
coverImageLocalPath = req.files.coverImage[0].path;
coverImageUrl = await uploadOnCloudinary(coverImageLocalPath)
coverImage = coverImageUrl.url;

}   

   if (!avatarLocalPath) {
    throw new ApiError(400,"Avatar is needed")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
if (!avatar) {
    throw new ApiError(400,"Avatar file is required and not uploaded on cloudinary")
}
  
const user = await User.create({
fullName,
userName: userName.toLowerCase(),
password,
email,
coverImage : coverImage || "",
avatar: avatar.url

})

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)
console.log("user create hogya:" ,createdUser);

if (!createdUser) {
    throw new ApiError(500,"Cannot register user internal server error")
}

return res.status(200).json(
    new ApiResponse(200,createdUser,"user has been created successfully") 
)

})

const generateAccessAndRefreshToken = async(userId)=>{    
    try {
    console.log(userId ,"userID");

        const user = await User.findById(userId)
console.log(user.userName);

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
    
        return { accessToken,refreshToken}
    } catch (error) {
         throw new ApiError(500,"Something went wrong while generating token")
    }
  

}
const loginUser = asyncHandler( async (req,res)=>{

    // date -> req.body
    // chech email or password
    // find user
    // check password
    // access refresh token 
    // send cookies 
    // send res 

    const { userName,email,password} = req.body
     
    if(!email) {
        throw new ApiError(404,"Email or username is required");   
    }
console.log(email,password);


    if (!password) {
        throw new ApiError(400,"password is required")
    }
    
   const user = await User.findOne({
        $or :[{ email } , { userName }]
    })

    if (!user) {
        throw new ApiError(400,"user does not exist")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401,"Invalid credentials")
    }
    
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
    // return res.status("200")

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken").lean()

console.log("working",loggedInUser);

     const options = {
        httpOnly : true,
        secure : true
    }
    return res.status(200).
    cookie("accessToken",accessToken,options).
    cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser, accessToken,refreshToken
            },
            "User Logged in successfully"
        )
    )

})

const logOutUser = asyncHandler( async(req,res)=>{
   User.findByIdAndUpdate(
    req.user._id,
    {
        $set:
        {
             refreshToken: undefined
        }
    },
    {
        new:true
    }
   )

   const options ={
    httpOnly:true,
    secure:true
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(
    new ApiResponse(200,{},"User Logged Out")
   )

})

const refreshAccessToken = asyncHandler( async(req,res)=>{
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

   if (!incomingRefreshToken) {
    throw new ApiError(401,"Unauthorize request")
   }
try {
       const decodedRefreshToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
       const user = findById(decodedRefreshToken._id)
    
       if (!user) {
        throw new ApiError(401,"Invalid request")
       }
    
       if (user?.refreshToken !== decodedRefreshToken) {
        throw new ApiError(401,"Invalid refresh token")
       }
    
       const options = {
        httpOnly : true,
        secure : true
       }
    
       const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
    
       return res.
       status(200)
       .cookies("refreshToken",refreshToken,options)
       .cookies("accessToken",accessToken,options)
    >json(
       new ApiResponse(
        200,
        {accessToken,refreshToken:refreshToken},
        "access token refreshed "
       ))
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid request") 
}

})


export {registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken
}