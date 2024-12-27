import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import {Like} from "../models/Like.model"
import { asyncHandler } from "../utils/asyncHandler";
import mongoose from "mongoose";

const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const userId = req.user._id

    const video = findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    const exist = findOne(
        {video:videoId,
        likedBy:userId
        }
    )

    if(exist){
        await deleteOne({_id:exist._id})
        return res.json(new ApiResponse(200, "Unliked"))
    }
    

    const liked = await Like.create({
        video:videoId,
        likedBy:userId
    })


    res.status(201).json(new ApiResponse(201, liked, "liked"))
})

const toggleCommentLike = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    const userId = req.user._id

    const comment = Like.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Video not found")
    }
    const exist = Like.findOne(
        {commentId:commentId,
        likedBy:userId
        }
    )

    if(exist){
        await Like.deleteOne({_id:exist._id})
        return res.json(new ApiResponse(200, "Unliked"))
    }
    
    
    const liked = await Like.create({
        comment:videoId,
        likedBy:userId
    })

    res.status(201).json(new ApiResponse(201, liked, "liked"))
})

const getLikedVideos = asyncHandler(async(req,res)=>{
    const userId = req.user._id

    const liked_videos = await Like.aggregate([
        {
            $match : {
                likedBy:new mongoose.Types.ObjectId(userId)
            }

        },
        {
            $lookup:{
                foreignField:"_id",
                localField:"video",
                from:"videos",
                as:"LikedVideos"
            }
        }
    ])

    if (liked_videos.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No liked videos found."));
    }

    res.status(200).json(new ApiResponse(200, liked_videos[0].LikedVideos,"liked videos fetched sucsessfully!"))
})