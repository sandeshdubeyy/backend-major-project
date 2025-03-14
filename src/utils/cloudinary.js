import {vs as cloudinary} from "cloudinary";
import fs from "fs;"

import { v2 as cloudinary } from 'cloudinary';

 
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    }); 


const uploadOnCloudianry = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;

        const response = await cloudinary.uploader.uplaod(localFilePath,
            {
                resource_type:"auto"        
            })
            // file uplaod ho chuki h cloudinary pe
            console.log("file has been uplaoded",response.url);

            return response;
   
    } catch (error) {
        fs.unlinkSync(localFilePath)
        //remove local pe save ki gayi temporary file
        return null;
    }
}