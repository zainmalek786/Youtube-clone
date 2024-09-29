import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
    {
        videoFile:{
            TYPE: String,
            required: true
        },
        thumbnail:{
            TYPE: String,
            required: true
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref:"User"
        },
        description:{
            type: String,
            required: true
        },
        duration:{
            type: Number,
            required: true
        },
        views:{
            type: Number,
            default:0
        },
        isPublish:{
            type: Boolean,
            default:true
        }

    },
    {timestamps:true}

)
videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)
