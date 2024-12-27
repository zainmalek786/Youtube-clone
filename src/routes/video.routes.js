import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { updateVideo } from "../controllers/video.controller.js";
import { togglePublishStatus } from "../controllers/video.controller.js";
import {deleteVideo} from "../controllers/video.controller.js";
import { getAllVideos } from "../controllers/video.controller.js";
import { publishAVideo } from "../controllers/video.controller.js";
import { getVideoById } from "../controllers/video.controller.js";


const videoRouter = Router()

videoRouter.use(verifyJWT) //  it will assure only logged in user can access

videoRouter.route("/")
.get(getAllVideos)
.post(
    upload.fields([
        {
            name:"video",
            maxCount:1,
        },{
            name:"thumbnail",
            maxCount:1,
        }
    ]),
    publishAVideo
)

videoRouter.route("/getvideobyid").get(getVideoById)

videoRouter.route("/updatevideo").post(upload.fields([
    {
        name:"thumbnail",
        maxCount:1
    },
    updateVideo
]))

videoRouter.route("/togglepublish").post(togglePublishStatus)
videoRouter.route("/deletevideo").post(deleteVideo)


export default videoRouter 