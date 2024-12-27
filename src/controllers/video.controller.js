import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import {Video} from "../models/Video.model.js"
import { json } from "express"
import mongoose from "mongoose"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { deleteFromCloudinary } from "../utils/deleteFile.js"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const getAllVideos = asyncHandler(async(req,res)=>{
    const {page = 1 ,limit = 10 , query ,sortBy ,sortType ,userID} = req.query

    const sortField = sortBy === "views"? "views": "createdAt"
    const sortOrder = sortType === "asc"? "1" :"-1"

    const videosQuery = await Video.aggregate([
        {
            $match: {
                ...(query? { title :{ $regex:query , $option:"i" }}:{}),
                ...(userID? {owner : userID}:{})
            }
        },
        {
            $sort: {
                [sortField]:sortOrder,
            }
        }

    ])

    const options = {
        page:parseInt(page),
        limit:parseInt(limit),
        customLabels:{docs:"videos",totalDocs:"totalVideos", totalPages: "totalPages"}
    }

    const result = await Video.aggregatePaginate(videosQuery,options)
    console.log(result);
    

    res.status(200).json(
        new ApiResponse(
            200,
            
            result,
                // pagination:{
                //     currentPage: result.page,
                //     totalPages: result.totalPages,
                //     totalVideos : result.totalVideos
                // }
            "Videos has been fetched successfully"
            )
    )
})

const publishAVideo = asyncHandler(async (req,res)=>{
    const {description ,title } = req.body

    if (!description) {
        throw new ApiError(400,"Please write the description for the video",)
    }
    if (!title) {
        throw new ApiError(400,"Please write the title for the video",)
    }
    const videoLocalPath = req.files?.video[0]?.path

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(400,"video file is reqruired")
    }

    const videoUrl = await uploadOnCloudinary(videoLocalPath)
    
    if (!videoUrl) {
        throw new ApiError(500,"Error while uploading file")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400,"Thumbnail is required")
    }

    const thumbnailUrl = await uploadOnCloudinary(thumbnailLocalPath)
    
    if (!thumbnailUrl) {
        throw new ApiError(500,"Error while uploading thumbnail")
    }

    const video = await Video.create({
        videoFile:videoUrl,
        thumbnail:thumbnailUrl,
        owner:req.user._id,
        title,
        description,
        duration:videoUrl.duration,

    })

    if (!video) {
        throw new ApiError(500,"Internal Error")
    }

    res.status(200).json(
        new ApiError(200,{},"video uploaded successfully")
    )


})

const getVideoById = asyncHandler(async(req,res)=>{
    const {videoId} = req.params

    if (!videoId) {
        throw new ApiError(404,"Invalid request,cannnot find the video")
    }

    const videoUrl = await Video.findById(videoId)

    if (!videoUrl) {
        throw new ApiError(500,"Internal server Error")
    }

    res.status(200).json(
        new ApiResponse(
            200,
            videoUrl,
            "Video has been fetched successfully"
        )
    )
})


const updateVideo = asyncHandler(async(req,res)=>{
    const {videoId,description,title} = req.body

    const thumbnailLocalPath =  req.files?.thumbnail[0]?.path

    if(!description && !title ) {
        throw new ApiError(400,"Some field is missing")
    }
    let thumbnail
    if (thumbnailLocalPath) {
          thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    }

    if (!thumbnail) {
        throw new ApiError(500,"Error while uploading thumbnail")   
    }

    const video = await findByIdAndUpdate(
        videoId,
        {
         $set : {
           ...(description && {description}),
           ...(title && {title}),
           ...(thumbnail && {thumbnail})
               }
    },
    {new:true}
)
   res.status(200).json(
    new ApiResponse(
        200,
        video,
        "Video has been updated successfully"
    )
   )

})

const togglePublishStatus = asyncHandler(async(req,res)=>{
    const {videoId} = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404,"Cannot find the video")
    }

    video.isPublish = !video.isPublish
    await video.save()

    res.status(200).json(
        new ApiResponse(
            200,
            video,
            "video status has been changes"
        )
    )
})

const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404,"Cannot find the video")
    }

    await deleteFromCloudinary(video.videoFile)
    await deleteFromCloudinary(video.thumbnail)

    await video.delete()

    res.status(200).json(
        new ApiResponse(
            200,
            video,
            "video has been deleted"
        )
    )
})


export {getAllVideos,
        publishAVideo,
        updateVideo,
        togglePublishStatus,
        getVideoById,
        deleteVideo
}