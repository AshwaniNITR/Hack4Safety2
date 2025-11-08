// import { NextResponse } from "next/server";
// import mongoose from "mongoose";
// import MissingPerson from "@/models/missingPerson";
// import connectToDatabase from "@/libs/connectToDb";
// import { getCoordinates } from "@/utils/geocode";

// // ------------------ In-memory storage for search results ------------------
// let latestSearchResult: any = null;

// // ------------------ Helpers ------------------

// // Cosine similarity
// function cosineSimilarity(a: number[], b: number[]): number {
//   const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
//   const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
//   const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
//   return dot / (normA * normB);
// }

// // Haversine formula (in km)
// function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
//   const R = 6371;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // ------------------ GET endpoint ------------------

// export async function GET(req: Request) {
//   try {
//     if (!latestSearchResult) {
//       return NextResponse.json(
//         { error: "No search results available yet" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(latestSearchResult);
//   } catch (err: unknown) {
//     console.error("❌ Error in GET route:", err);
//     return NextResponse.json({ error: (err as Error).message }, { status: 500 });
//   }
// }

// // ------------------ POST endpoint ------------------

// export async function POST(req: Request) {
//   try {
//     await connectToDatabase();

//     // ✅ Get all query data
//     const formData = await req.formData();
//     const image = formData.get("image") as File;
//     const lat = parseFloat(formData.get("addressLat") as string);
//     const lon = parseFloat(formData.get("addressLon") as string);
//     const gender = formData.get("gender") as string;
//     const age = parseInt(formData.get("age") as string);

//     if (!image) {
//       return NextResponse.json({ error: "Image file required" }, { status: 400 });
//     }
//     if (isNaN(lat) || isNaN(lon)) {
//       return NextResponse.json({ error: "Invalid coordinates received" }, { status: 400 });
//     }

//     // ✅ Step 1 — Get embedding from Flask API
//     const flaskFormData = new FormData();
//     flaskFormData.append("image", image);

//     const flaskResponse = await fetch(
//       "https://identiq-gpbgdmgua9gbf5gm.centralindia-01.azurewebsites.net/get_embeddings",
//       { method: "POST", body: flaskFormData as any }
//     );
//     const flaskResult = await flaskResponse.json();

//     if (!flaskResponse.ok || !flaskResult.embedding_vector) {
//       return NextResponse.json(
//         { error: "Failed to get embedding from Flask API" },
//         { status: 500 }
//       );
//     }

//     const inputEmbedding = flaskResult.embedding_vector;

//     // ✅ Step 2 — Filter data by gender and ±10 years of age before similarity
//     const query: any = {};
//     if (gender) query.gender = gender;
//     if (!isNaN(age)) query.age = { $gte: age - 20, $lte: age + 20 };

//     const allPersons = await MissingPerson.find(query, { embedding: 1, address: 1 });

//     if (!allPersons.length) {
//       return NextResponse.json({ error: "No matching records by gender/age" }, { status: 404 });
//     }

//     // ✅ Step 3 — Compute similarity + location distance
//     const candidates: {
//       id: string;
//       similarity: number;
//       distanceKm: number;
//       score: number;
//       averageScore: number;
//     }[] = [];

//     for (const person of allPersons) {
//       // --- (1) Embedding similarity
//       if (!person.embedding || !Array.isArray(person.embedding)) continue;
//       const sim = cosineSimilarity(inputEmbedding, person.embedding);

//       // --- (2) Location distance
//       let distanceKm = 10000;
//       if (person.address) {
//         const coords = await getCoordinates(person.address);
//         if (coords) distanceKm = haversine(lat, lon, coords.lat, coords.lon);
//       }

//       // --- (3) Normalize distance to 0–1 scale
//       const locScore = Math.max(0, 1 - distanceKm / 100);

//       // --- (4) Weighted combined score (embedding > location)
//       const finalScore = sim * 0.7 + locScore * 0.3;

//       // --- (5) Calculate average of similarity and finalScore
//       const averageScore = (sim + finalScore) / 2;

//       candidates.push({
//         id: person._id.toString(),
//         similarity: sim,
//         distanceKm,
//         score: finalScore,
//         averageScore,
//       });
//     }

//     if (!candidates.length) {
//       return NextResponse.json(
//         { error: "No valid records with embeddings or addresses" },
//         { status: 404 }
//       );
//     }

//     // ✅ Step 4 — Sort by average score (descending) and get top 3
//     const top3 = candidates
//       .sort((a, b) => b.averageScore - a.averageScore)
//       .slice(0, 3);

//     // ✅ Step 5 — Fetch full person details
//     const matchedPersons = await MissingPerson.find({
//       _id: { $in: top3.map((p) => new mongoose.Types.ObjectId(p.id)) },
//     }).lean();

//     // ✅ Step 6 — Combine result (maintain sorted order)
//     const result = top3.map((candidate) => {
//       const person = matchedPersons.find(
//         (p: any) => p._id.toString() === candidate.id
//       );
//       return {
//         ...person,
//         similarity: candidate.similarity,
//         distanceKm: candidate.distanceKm,
//         finalScore: candidate.score,
//         averageScore: candidate.averageScore,
//       };
//     });

//     // ✅ Store the result for GET endpoint with metadata
//     latestSearchResult = {
//       matches: result,
//       searchParams: {
//         lat,
//         lon,
//         gender: gender || "Any",
//         age: age || "Any",
//       },
//       timestamp: new Date().toISOString(),
//       totalCandidates: candidates.length,
//     };

//     return NextResponse.json({ matches: result });
//   } catch (err: unknown) {
//     console.error("❌ Error in multimatch route:", err);
//     return NextResponse.json({ error: (err as Error).message }, { status: 500 });
//   }
// }
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import MissingPerson from "@/models/missingPerson";
import connectToDatabase from "@/libs/connectToDb";
import { getCoordinates } from "@/utils/geocode";

// ------------------ In-memory storage for search results ------------------
let latestSearchResult: any = null;

// ------------------ Helpers ------------------

// Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
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

// ------------------ GET endpoint ------------------

export async function GET(req: Request) {
  try {
    if (!latestSearchResult) {
      return NextResponse.json(
        { error: "No search results available yet" },
        { status: 404 }
      );
    }

    return NextResponse.json(latestSearchResult);
  } catch (err: unknown) {
    console.error("❌ Error in GET route:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// ------------------ POST endpoint ------------------

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // ✅ Get all query data
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const lat = parseFloat(formData.get("addressLat") as string);
    const lon = parseFloat(formData.get("addressLon") as string);
    const gender = formData.get("gender") as string;
    const age = parseInt(formData.get("age") as string);

    if (!image) {
      return NextResponse.json({ error: "Image file required" }, { status: 400 });
    }
    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: "Invalid coordinates received" }, { status: 400 });
    }

    // ✅ Step 1 — Get embedding from Flask API
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
        { status: 400 }
      );
    }

    const inputEmbedding = flaskResult.embedding_vector;

    // ✅ Step 2 — Filter data by gender and ±10 years of age before similarity
    const query: any = {};
    if (gender) query.gender = gender;
    if (!isNaN(age)) query.age = { $gte: age - 20, $lte: age + 20 };

    const allPersons = await MissingPerson.find(query, { embedding: 1, address: 1 });

    if (!allPersons.length) {
      return NextResponse.json({ error: "No matching records by gender/age" }, { status: 404 });
    }

    // ✅ Step 3 — Compute similarity + location distance
    const candidates: {
      id: string;
      similarity: number;
      distanceKm: number;
      score: number;
      averageScore: number;
    }[] = [];

    for (const person of allPersons) {
      // --- (1) Embedding similarity
      if (!person.embedding || !Array.isArray(person.embedding)) continue;
      const sim = cosineSimilarity(inputEmbedding, person.embedding);

      // --- (2) Location distance
      let distanceKm = 10000;
      if (person.address) {
        const coords = await getCoordinates(person.address);
        if (coords) distanceKm = haversine(lat, lon, coords.lat, coords.lon);
      }

      // --- (3) Normalize distance to 0–1 scale
      const locScore = Math.max(0, 1 - distanceKm / 100);

      // --- (4) Weighted combined score (embedding > location)
      const finalScore = sim * 0.7 + locScore * 0.3;

      // --- (5) Calculate average of similarity and finalScore
      const averageScore = (sim + finalScore) / 2;

      candidates.push({
        id: person._id.toString(),
        similarity: sim,
        distanceKm,
        score: finalScore,
        averageScore,
      });
    }

    if (!candidates.length) {
      return NextResponse.json(
        { error: "No valid records with embeddings or addresses" },
        { status: 404 }
      );
    }

    // ✅ Step 4 — Sort by average score (descending) and get top 3
    const top3 = candidates
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 3);

    // ✅ Step 5 — Fetch full person details
    const matchedPersons = await MissingPerson.find({
      _id: { $in: top3.map((p) => new mongoose.Types.ObjectId(p.id)) },
    }).lean();

    // ✅ Step 6 — Combine result (maintain sorted order)
    const result = top3.map((candidate) => {
      const person = matchedPersons.find(
        (p: any) => p._id.toString() === candidate.id
      );
      return {
        ...person,
        similarity: candidate.similarity,
        distanceKm: candidate.distanceKm,
        finalScore: candidate.score,
        averageScore: candidate.averageScore,
      };
    });

    // ✅ Store the result for GET endpoint with metadata
    latestSearchResult = {
      matches: result,
      searchParams: {
        lat,
        lon,
        gender: gender || "Any",
        age: age || "Any",
      },
      timestamp: new Date().toISOString(),
      totalCandidates: candidates.length,
    };

    return NextResponse.json({ matches: result });
  } catch (err: unknown) {
    console.error("❌ Error in multimatch route:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}