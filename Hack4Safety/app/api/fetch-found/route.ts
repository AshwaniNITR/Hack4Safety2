import connectToDatabase from "@/libs/connectToDb";
import foundPerson from "@/models/foundPerson";
import { getCoordinates } from "@/utils/geocode";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDatabase();
    // const coord=await getCoordinates("Bhubaneshwar Odisha");
    // console.log(coord);
    const data = await foundPerson.find({});
    return NextResponse.json(data, { status: 200 });
  } catch (error:unknown) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { message: "Error fetching data", error: (error as Error).message },
      { status: 500 }
    );
  }
}
