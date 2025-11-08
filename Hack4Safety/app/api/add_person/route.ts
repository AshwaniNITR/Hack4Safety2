import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Pinecone } from "@pinecone-database/pinecone";
import connectToDatabase from "@/app/libs/connectToDb";
import MissingPerson from "@/models/missingPerson";
interface MissingPerson {
  _id: string;
  name: string;
  age?: number;
  gender?: string;
  address?: string;
  contactNumber?: string;
  dateMissing: string;
  placeLastSeen?: string;
  clothingDescription?: string;
  physicalFeatures?: string;
  imageUrl: string;
  embedding: number[];
  status: string;
  reportFiledBy?: {
    name?: string;
    designation?: string;
    policeStation?: string;
  };
  createdAt: string;
}
// ✅ Pinecone setup
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function GET() {
  try {
    // Step 1: Connect to MongoDB
    await connectToDatabase();
    console.log("✅ MongoDB connected");

    // Step 2: Fetch all data from MongoDB
    const persons = await MissingPerson.find({});
    console.log(`📦 Found ${persons.length} records`);
    console.log(persons);

    // Step 3: Connect to Pinecone index
    const index = pinecone.index(process.env.PINECONE_INDEX!);

    // Step 4: Prepare data for Pinecone
    const vectors = persons.map((person:MissingPerson) => ({
      id: person._id.toString(),
      values: person.embedding,
      metadata: {
        name: person.name || "",
        age: person.age || "",
        gender: person.gender || "",
        placeLastSeen: person.placeLastSeen || "",
        clothingDescription: person.clothingDescription || "",
        physicalFeatures: person.physicalFeatures || "",
        imageUrl: person.imageUrl || "",
        status: person.status || "Missing",
      },
    }));

    // Step 5: Upload to Pinecone (in chunks of 100 for safety)
    const chunkSize = 100;
    for (let i = 0; i < vectors.length; i += chunkSize) {
      const chunk = vectors.slice(i, i + chunkSize);
      await index.upsert(chunk);
    }

    return NextResponse.json({
      message: "✅ Data uploaded to Pinecone successfully",
      count: vectors.length,
    });
  } catch (error: any) {
    console.error("❌ Pinecone sync error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
