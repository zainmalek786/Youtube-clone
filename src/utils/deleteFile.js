import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./apiError.js";

cloudinary.config({
    cloud_name: "ddzunmcdq", 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const deleteFromCloudinary = async (imageToBeDeleted)=>{
console.log("File to be deleted uri:",imageToBeDeleted);

try {
 const publicId = imageToBeDeleted.replace(/^.*\/upload\/[v\d]+\/|\.[^/.]+$/g, '');
 await cloudinary.uploader.destroy(publicId,{resource_type:"auto"})
 console.log("File deleted successffully",imageToBeDeleted);
 
 
} catch (error) {
    throw new ApiError(500,"Unable to delete File")
    
}

}

export {deleteFromCloudinary}