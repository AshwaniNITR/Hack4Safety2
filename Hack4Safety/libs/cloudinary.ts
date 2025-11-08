import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  [key: string]: string | number;
}

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = "projects"
): Promise<CloudinaryResponse> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder },
        (error: Error | undefined, result: CloudinaryResponse | undefined) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error("Upload failed with no result"));
          }
        }
      )
      .end(fileBuffer);
  });
};

export default cloudinary;