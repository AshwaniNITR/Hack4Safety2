import { NextResponse } from "next/server";
import mongoose from "mongoose";
import MissingPerson from "@/models/missingPerson";
import connectToDatabase from "@/libs/connectToDb";
import { getCoordinates } from "@/utils/geocode";

// ------------------ Helpers ------------------

// Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}
interface MissingPersonDoc {
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
  addresslat?:number;
  addresslon?:number;
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

// Haversine formula (in km)
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ------------------ Main API ------------------

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // ✅ Get image + coordinates from frontend form data
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const lat = parseFloat(formData.get("addressLat") as string);
    const lon = parseFloat(formData.get("addressLon") as string);

    if (!image) {
      return NextResponse.json({ error: "Image file required" }, { status: 400 });
    }
    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: "Invalid coordinates received" }, { status: 400 });
    }

    // ✅ Step 1 — Get embedding from Flask
    const flaskFormData = new FormData();
    flaskFormData.append("image", image);
    const flaskResponse = await fetch(
      "https://identiq-gpbgdmgua9gbf5gm.centralindia-01.azurewebsites.net/get_embeddings",
      { method: "POST", body: flaskFormData as any }
    );
    const flaskResult = await flaskResponse.json();

    if (!flaskResponse.ok || !flaskResult.embedding_vector) {
      return NextResponse.json(
        { error: "Failed to get embedding from Flask API" },
        { status: 500 }
      );
    }

    const inputEmbedding = flaskResult.embedding_vector;

    // ✅ Step 2 — Fetch all records from MongoDB
    const allPersons = await MissingPerson.find({}, { embedding: 1, address: 1 });

    if (!allPersons.length) {
      return NextResponse.json({ error: "No records found" }, { status: 404 });
    }

    // ✅ Step 3 — Compute embedding similarity + geocode each address
    const candidates: {
      id: string;
      similarity: number;
      distanceKm: number;
      score: number;
    }[] = [];

    for (const person of allPersons) {
      // --- (1) Compute embedding similarity
      if (!person.embedding || !Array.isArray(person.embedding)) continue;
      const sim = cosineSimilarity(inputEmbedding, person.embedding); // between 0–1

      // --- (2) Compute location distance
      let distanceKm = 10000; // default far
      if (person.address) {
        const coords = await getCoordinates(person.address);
        if (coords) {
          distanceKm = haversine(lat, lon, coords.lat, coords.lon);
        }
      }

      // --- (3) Normalize location distance into a 0–1 proximity score
      const locScore = Math.max(0, 1 - distanceKm / 100); // closer → higher (0–1 range)

      // --- (4) Weighted score: 70% embedding + 30% location
      const finalScore = sim * 0.7 + locScore * 0.3;

      candidates.push({
        id: person._id.toString(),
        similarity: sim,
        distanceKm,
        score: finalScore,
      });
    }

    if (!candidates.length) {
      return NextResponse.json(
        { error: "No valid records with embeddings or addresses" },
        { status: 404 }
      );
    }

    // ✅ Step 4 — Sort by final weighted score and get top 3
    const top3 = candidates.sort((a, b) => b.score - a.score).slice(0, 3);

    // ✅ Step 5 — Fetch full records of top 3
    const matchedPersons = await MissingPerson.find({
      _id: { $in: top3.map((p) => new mongoose.Types.ObjectId(p.id)) },
    }).lean();

    // ✅ Step 6 — Merge results
    const result = matchedPersons.map((p: any) => {
      const info = top3.find((t) => t.id === p._id.toString());
      return {
        ...p,
        similarity: info?.similarity ?? null,
        distanceKm: info?.distanceKm ?? null,
        finalScore: info?.score ?? null,
      };
    });
    console.log("Results",result);

    return NextResponse.json({ matches: result });
  } catch (err: any) {
    console.error("❌ Error in multimatch route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
