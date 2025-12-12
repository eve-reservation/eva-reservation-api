import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary with environment variables
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export const cloudinaryConfig = {
	cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
	apiKey: process.env.CLOUDINARY_API_KEY || "",
	apiSecret: process.env.CLOUDINARY_API_SECRET || "",
	isConfigured(): boolean {
		return !!(this.cloudName && this.apiKey && this.apiSecret);
	},
};

