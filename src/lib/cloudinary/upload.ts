import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(url: string): Promise<string> {
  const result = await cloudinary.uploader.upload(url, {
    folder:         "valmont/products",
    transformation: [{ width: 1200, crop: "limit", quality: "auto:good" }],
  });
  return result.secure_url;
}
