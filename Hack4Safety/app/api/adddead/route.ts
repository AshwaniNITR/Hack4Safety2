import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import deadPerson from "@/models/deadbody";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Database connection
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGO_URI as string);
}

// Function to get embeddings from your embedding service
async function getEmbeddings(imageFile: File): Promise<number[]> {
  try {
    // Create form data with the file directly
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(
      `https://hacksfmodelfall-latest.onrender.com/get_embeddings`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Failed to get embeddings: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.embedding_vector;
  } catch (error) {
    console.error("Error getting embeddings:", error);
    throw error;
  }
}

// Function to upload image to Cloudinary
async function uploadToCloudinary(imageFile: File): Promise<string> {
  try {
    // Convert File to buffer
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "dead_persons",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    
    // Extract all fields
    const age = formData.get("age") ? parseInt(formData.get("age") as string) : undefined;
    const gender = formData.get("gender") as string;
    const address = formData.get("address") as string;
    const contactNumber = formData.get("contactNumber") as string;
    const dateMissing = formData.get("dateMissing") as string;
    const clothingDescription = formData.get("clothingDescription") as string;
    const physicalFeatures = formData.get("physicalFeatures") as string;
    const reportFiledByStr = formData.get("reportFiledBy") as string;
    const reportFiledBy = reportFiledByStr ? JSON.parse(reportFiledByStr) : {};

    // Handle image upload
    const image = formData.get("image") as File;
    if (!image) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    // Get embeddings from the image file
    console.log("Getting embeddings...");
    const embedding = await getEmbeddings(image);
    console.log("Embeddings received:", embedding.length, "dimensions");

    // Upload image to Cloudinary
    console.log("Uploading to Cloudinary...");
    const imageUrl = await uploadToCloudinary(image);
    console.log("Image uploaded:", imageUrl);

    // Create new dead person record
    const newDeadPerson = new deadPerson({
      age,
      gender,
      address,
      contactNumber,
      dateMissing: new Date(dateMissing),
      clothingDescription,
      physicalFeatures,
      imageUrl,
      embedding,
      reportFiledBy,
    });

    await newDeadPerson.save();

    return NextResponse.json(
      {
        success: true,
        message: "Dead person record added successfully",
        data: newDeadPerson,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding dead person:", error);
    return NextResponse.json(
      {
        error: "Failed to add record",
        details: error.message,
      },
      { status: 500 }
    );
  }
}