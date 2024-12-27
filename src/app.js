import express from "express"
import { urlencoded } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"16kb"}))

app.use(express.urlencoded({
    extended:true,
    limit:"14kb"}))

app.use(express.static("public"))

app.use(cookieParser())

//configure routes

import router from "./routes/user.routes.js"
app.use("/api/v1/users",router)

import videoRouter from "./routes/video.routes.js"
app.use("/api/v1/videos",videoRouter)

export default app