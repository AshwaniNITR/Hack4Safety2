import { NextResponse } from "next/server";
import MissingPerson from "@/models/missingPerson";
import connectToDatabase from "@/libs/connectToDb";
import { getCoordinates } from "@/utils/geocode"; // 👈 import the utility

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

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // ✅ Read FormData (frontend sends addressLat, addressLon)
    const formData = await req.formData();
    const lat = parseFloat(formData.get("addressLat") as string);
    const lon = parseFloat(formData.get("addressLon") as string);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: "Invalid coordinates received from frontend" },
        { status: 400 }
      );
    }

    // ✅ Fetch all persons with their address strings
    const allPersons = await MissingPerson.find({}, { address: 1 });

    if (!allPersons.length) {
      return NextResponse.json({ error: "No persons found" }, { status: 404 });
    }

    // ✅ Convert each address to coordinates via getCoordinates()
    const personsWithCoords = [];
    for (const person of allPersons) {
      if (!person.address) continue;
      const coords = await getCoordinates(person.address);
      if (coords) {
        const distance = haversine(lat, lon, coords.lat, coords.lon);
        personsWithCoords.push({
          id: person._id.toString(),
          distance,
          coords,
        });
      }
    }

    if (!personsWithCoords.length) {
      return NextResponse.json(
        { error: "Could not resolve coordinates for any addresses" },
        { status: 404 }
      );
    }

    // ✅ Sort by distance and pick top 3
    const top3 = personsWithCoords.sort((a, b) => a.distance - b.distance).slice(0, 3);

    // ✅ Fetch those 3 persons’ full details
    const nearestPersons = await MissingPerson.find({
      _id: { $in: top3.map((p) => p.id) },
    }).lean() as unknown as MissingPersonDoc[];

    // ✅ Attach computed distance + coordinates
    const result = nearestPersons.map((p: MissingPersonDoc) => {
      const d = top3.find((t) => t.id === p._id.toString());
      return { ...p, distanceKm: d?.distance ?? null, coords: d?.coords ?? null };
    });
    console.log("result",result);
    return NextResponse.json({ nearestPersons: result });
  } catch (error) {
    console.error("Error finding nearest addresses:", error);
    return NextResponse.json(
      { error: `Error finding nearest addresses: ${error}` },
      { status: 500 }
    );
  }
}
