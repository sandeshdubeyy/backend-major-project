import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudianry = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file uplaod ho chuki h cloudinary pe
    console.log("yeh dlt hone wala h ", localFilePath);
    const absolutePath = path.resolve(localFilePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
    return response;
  } catch (error) {
    //remove local pe save ki gayi temporary file
    console.log("yeh dlt hone wala h ", localFilePath);
    const absolutePath = path.resolve(localFilePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
    return null;
  }
};

export { uploadOnCloudianry };
