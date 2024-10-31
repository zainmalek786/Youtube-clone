// import { asyncHandler } from "../utils/asyncHandler";
import {asyncHandler} from  "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/User.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFile.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import { json } from "express";
import mongoose from "mongoose";

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
        $unset:
        {
             refreshToken: 1
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

const changeCurrentPassword = asyncHandler( async(req,res)=>{
    const {oldPassword,newPassoword} = req.body

    const user = User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw ApiError(401,"Invalid old password")
    }

    user.password = newPassoword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Password Change"
    ))
})

const getCurrentUser = asyncHandler( async (req,res)=>{
    return res
    .status(200)
    .json(
        200,
        req.user,
        "current user fethced successfully"
    )
})

const updateAccountDetails = asyncHandler( async(req,res)=>{
    const {fullName,email } = req.body

    if (!fullName || !email) {
     throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json( new ApiResponse(
        200,
        user,
        "Account details updated successfully"
    ))
})


const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
     throw new ApiError(400,"Avatar File is missing")
    }
     
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400,"Error while uploading avatar file")
       }

       const userPreviousDetails = await User.findById(req.user._id)
       if (userPreviousDetails) {
       try {
             const previousAvatar = userPreviousDetails.avatar
             await deleteFromCloudinary(previousAvatar)
         } catch (error) {
       console.log("Error while deleting avatar :",error);
       
         }
       }else{
           throw new ApiError(404,"User not found Invalid request")
       }
    
       const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar : avatar.url
            }
        },
        {new:true}
       ).select(" -password ")

       return res.status(200).json( new ApiResponse(
        200,
        user,
        "Avatar updated "
    ))
    
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
     throw new ApiError(400,"cover Image File is missing")
    }
     
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400,"Error while uploading cover image")
       }
    const userPreviousDetails = await User.findById(req.user._id)
    if (userPreviousDetails) {
      try {
          const previousCoverImage = userPreviousDetails.coverImage
          await deleteFromCloudinary(previousCoverImage)
      } catch (error) {
    console.log("Error while deleting image :",error);
    
      }
    }else{
        throw new ApiError(404,"User not found Invalid request")
    }


       const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage : coverImage.url
            }
        },
        {new:true}
       ).select(" -password ")

       return res.status(200).json( new ApiResponse(
        200,
        user,
        "Cover Image updated"
    ))
    
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {userName} = req.params

    if (!userName?.trim()) {
        throw new ApiError(400,"User name is missing")
    }

    const channel = await User.aggregate( [
        {
            $match :{
                $userName : userName?.toLowerCase()
                   }
        },
        {
            $lookup:{
                from :"subscriptions",
                foreignField:"Channel",
                localField:"_id",
                as :"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                foreignField:"subscriber",
                localField:"_id",
                as:"subscribedTo"
            }
        },{
            $addFields:{
                subscribersCount:{
                    $size:"subscribers"
                },
                subscribedTo :{
                    $size:"subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                       }
                }
            }
        },
        {
            $project:{
                userName:1,
                fullName:1,
                subscribersCount:1,
                subscribedTo:1,
                coverImage:1,
                avatar:1,
                isSubscribed:1,
                email:1,
            }
        }
    ] )

    if (!channel?.length) {
        throw new ApiError(400,"Channel does not exist")        
    }

    return res.status(200).json(
        new ApiResponse(200,
            channel[0],"User Channel fetched successfully"
        )
    )
})

const getUserWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
         {
            $match:{
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
         },
         {

            $lookup : {
                foreignField:"_id"  ,
                from :"videos",
                localField: "watchHistory" ,
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from :"users",
                            foreignField:"_id",
                            localField:"owner",
                            as : "owner",
                            pipeline:[
                                {
                                    $project:{
                                        userName :1,
                                        fullName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner :{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            },
         },


    ])
    return res.status(200).json(
        new apiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
     )
})

export {registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
}