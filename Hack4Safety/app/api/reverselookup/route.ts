// app/api/reverselookup/route.ts
import { NextResponse } from "next/server";
import MissingPerson from "@/models/missingPerson";
import connectToDatabase from "@/libs/connectToDb";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // Handle FormData (image upload)
    const formData = await req.formData();
    const image = formData.get("image") as File;
    
    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert image to buffer for sending to Python API
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Send image to Python API to get embeddings
    const pythonFormData = new FormData();
    const blob = new Blob([buffer], { type: image.type });
    pythonFormData.append('image', blob, image.name);

    console.log("Sending image to Python API for embedding extraction...");
    const embeddingResponse = await fetch("https://identiq-gpbgdmgua9gbf5gm.centralindia-01.azurewebsites.net/get_embeddings", {
      method: "POST",
      body: pythonFormData
    });

    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.json();
      console.error("Python API error:", errorData);
      return NextResponse.json(
        { error: "Failed to extract face embedding", details: errorData.error },
        { status: 500 }
      );
    }

    const embeddingData = await embeddingResponse.json();
    console.log("Embedding received:", embeddingData);
    
    const embedding: number[] = embeddingData.embedding_vector;

    if (!embedding || embedding.length === 0) {
      return NextResponse.json(
        { error: "No face detected in image" },
        { status: 400 }
      );
    }

    // Get optional filters
    const addressLat = formData.get("addressLat");
    const addressLon = formData.get("addressLon");
    const gender = formData.get("gender");
    const age = formData.get("age");

    // Validate coordinates if location-based search is needed
    if (addressLat && addressLon && embedding.length > 0) {
      // Build filters
      const filters: any = {};
      
      if (gender) {
        filters.gender = gender;
      }
      
      if (age) {
        const ageNum = parseInt(age as string);
        filters.age = { $gte: ageNum - 10, $lte: ageNum + 10 };
      }

      const maxDistance = 600; // 50km

      // Get all persons matching basic filters
      const persons = await MissingPerson.find(filters);

      // Helper: Calculate distance between two coordinates (Haversine formula)
      function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
      }

      // Helper: Geocode address to coordinates
      async function geocodeAddress(address: string): Promise<{lat: number, lon: number} | null> {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
          const res = await fetch(url, { 
            headers: { "User-Agent": "Hack4Safety-App" }
          });
          const data = await res.json();
          
          if (data.length > 0) {
            return {
              lat: parseFloat(data[0].lat),
              lon: parseFloat(data[0].lon)
            };
          }
          return null;
        } catch (error) {
          console.error("Geocoding error:", error);
          return null;
        }
      }

      // Process each person: geocode their address and calculate distance
      const nearby = [];
      const queryLat = parseFloat(addressLat as string);
      const queryLon = parseFloat(addressLon as string);

      for (const person of persons) {
        if (!person.address) continue;

        // Geocode the person's address
        const coords = await geocodeAddress(person.address);
        
        if (coords) {
          // Calculate distance
          const distance = calculateDistance(queryLat, queryLon, coords.lat, coords.lon);
          
          // Only include if within maxDistance
          if (distance <= maxDistance) {
            nearby.push({
              ...person.toObject(),
              distance: distance,
              personCoords: coords
            });
          }
        }
      }

      console.log(`Found ${nearby.length} persons within ${maxDistance}km`);

      // Cosine similarity
      function cosine(a: number[], b: number[]) {
        if (!a || !b || a.length !== b.length) return 0;
        
        const dot = a.reduce((s, v, i) => s + v * b[i], 0);
        const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
        const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
        
        if (magA === 0 || magB === 0) return 0;
        return dot / (magA * magB);
      }

      // Calculate scores
      const scored = nearby.map(person => {
        const imageScore = cosine(embedding, person.embedding);
        const locScore = 1 - person.distance / maxDistance; // Normalized to 0-1
        
        let ageScore = 0;
        if (age && person.age) {
          const ageNum = parseInt(age as string);
          ageScore = 1 - Math.abs(ageNum - person.age) / 10;
          ageScore = Math.max(0, Math.min(1, ageScore));
        }
        
        const finalScore = 0.6 * imageScore + 0.3 * locScore + 0.1 * ageScore;
        
        return { 
          ...person, 
          finalScore,
          imageScore,
          locScore,
          ageScore,
          distanceKm: person.distance.toFixed(2)
        };
      });

      const top5 = scored
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 5);

      return NextResponse.json({
        success: true,
        matches: top5,
        totalFound: nearby.length
      });
    }

    // If no coordinates, do a simple embedding-based search
    if (embedding.length > 0) {
      const allPersons = await MissingPerson.find({});
      
      function cosine(a: number[], b: number[]) {
        if (!a || !b || a.length !== b.length) return 0;
        
        const dot = a.reduce((s, v, i) => s + v * b[i], 0);
        const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
        const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
        
        if (magA === 0 || magB === 0) return 0;
        return dot / (magA * magB);
      }

      const scored = allPersons.map(person => ({
        ...person.toObject(),
        finalScore: cosine(embedding, person.embedding),
        imageScore: cosine(embedding, person.embedding),
        locScore: 0,
        ageScore: 0
      }));

      const top5 = scored
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 5);

      return NextResponse.json({
        success: true,
        matches: top5,
        totalFound: allPersons.length
      });
    }

    return NextResponse.json(
      { error: "No valid search criteria provided" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error in reverse lookup:", error);
    return NextResponse.json(
      { error: "Failed to process reverse lookup", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}