import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

   // Configuration
   cloudinary.config({ 
    cloud_name: "ddzunmcdq", 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath)=>{
    console.log("file path on cl",localFilePath);
    
try {
    if(!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
     })
     fs.unlinkSync(localFilePath)
     console.log("fileuploaddata",response.url)
     return response
} catch (error) {
    console.log("yahan error hai",error);
    
    fs.unlinkSync(localFilePath)
    return null
}
}

export {uploadOnCloudinary}