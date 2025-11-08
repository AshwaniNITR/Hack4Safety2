import { NextResponse } from "next/server";
import mongoose from "mongoose";
import MissingPerson from "@/models/missingPerson";
import connectToDatabase from "@/libs/connectToDb";

// Helper: Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // Parse multipart form data
    const formData = await req.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    // Send image to Flask API for embedding extraction
    const flaskFormData = new FormData();
    flaskFormData.append("image", image);

    const flaskResponse = await fetch("https://identiq-gpbgdmgua9gbf5gm.centralindia-01.azurewebsites.net/get_embeddings", {
      method: "POST",
      body: flaskFormData as any,
    });

    const flaskResult = await flaskResponse.json();

    if (!flaskResponse.ok || !flaskResult.embedding_vector) {
      return NextResponse.json(
        { error: "Failed to get embedding from Flask API" },
        { status: 500 }
      );
    }

    const inputEmbedding = flaskResult.embedding_vector;

    // Fetch all stored embeddings from MongoDB
    const persons = await MissingPerson.find({}, { embedding: 1 });

    if (!persons.length) {
      return NextResponse.json(
        { error: "No stored embeddings found in database" },
        { status: 404 }
      );
    }

    // Compute cosine similarities
    const similarities = persons
      .map((p: any) => {
        if (!p.embedding || !Array.isArray(p.embedding)) return null;
        const sim = cosineSimilarity(inputEmbedding, p.embedding);
        return { id: p._id, similarity: sim };
      })
      .filter(Boolean)
      .sort((a, b) => b!.similarity - a!.similarity)
      .slice(0, 1);

    // Get IDs of top 3
    const topIds = similarities.map((m) => m!.id);

    // Fetch full records
    const matchedPersons = await MissingPerson.find({
      _id: { $in: topIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });
    console.log("matched persions",matchedPersons);
    return NextResponse.json({
      matches: matchedPersons,
      similarities,
    });
  } catch (err: any) {
    console.error("❌ Error in /api/cosine:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
