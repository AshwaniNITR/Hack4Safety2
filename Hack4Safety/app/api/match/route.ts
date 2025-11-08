import { NextResponse } from "next/server";
import mongoose from "mongoose";
import MissingPerson from "@/models/missingPerson";
import * as fuzz from "fuzzball"; // npm i fuzzball
import connectToDatabase from "@/libs/connectToDb";

// ---------------- Helper Functions ----------------

// Normalize number difference (e.g., age)
function numericSimilarity(a?: number, b?: number) {
  if (!a || !b) return 0;
  const diff = Math.abs(a - b);
  const maxVal = Math.max(a, b);
  return 1 - diff / maxVal; // closer ages → closer to 1
}

// Textual similarity using fuzzy ratio
function textSimilarity(a?: string, b?: string) {
  if (!a || !b) return 0;
  return fuzz.partial_ratio(a.toLowerCase(), b.toLowerCase()) / 100;
}

// Gender similarity (exact match)
function genderSimilarity(a?: string, b?: string) {
  if (!a || !b) return 0;
  return a.toLowerCase() === b.toLowerCase() ? 1 : 0;
}

// Cosine similarity for embeddings
function cosineSimilarity(vec1: number[], vec2: number[]) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
  const dot = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));
  return mag1 && mag2 ? dot / (mag1 * mag2) : 0;
}

// ---------------- API Handler ----------------
export async function POST(req: Request) {
  await connectToDatabase();
  const input = await req.json();

  const allRecords = await MissingPerson.find({});

  const weights = {
    embedding: 0.6,
    age: 0.1,
    gender: 0.1,
    clothing: 0.1,
    place: 0.1,
  };

  const results = allRecords.map((record) => {
    const faceSim = cosineSimilarity(input.embedding, record.embedding);
    const ageSim = numericSimilarity(input.age, record.age);
    const genderSim = genderSimilarity(input.gender, record.gender);
    const clothingSim = textSimilarity(input.clothingDescription, record.clothingDescription);
    const placeSim = textSimilarity(input.placeLastSeen, record.placeLastSeen);

    const totalScore =
      weights.embedding * faceSim +
      weights.age * ageSim +
      weights.gender * genderSim +
      weights.clothing * clothingSim +
      weights.place * placeSim;

    return {
      record,
      similarity: Number(totalScore.toFixed(3)),
    };
  });

  // Sort descending by similarity score
  results.sort((a, b) => b.similarity - a.similarity);

  return NextResponse.json({
    topMatches: results.slice(0, 5),
  });
}
