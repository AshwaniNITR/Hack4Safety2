import { NextResponse } from "next/server";
import { getPineconeClient } from "@/libs/pineconeClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { embedding, filters } = body;

    const client = getPineconeClient();
    const index = client.index("missing-persons");

    const result = await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
      filter: filters || {}, // e.g. { gender: "Female", placeLastSeen: "Bhubaneswar" }
    });

    return NextResponse.json({ matches: result.matches });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json({ error: "Failed to query" }, { status: 500 });
  }
}
