import { NextResponse } from "next/server";
import connectToDatabase from "@/libs/connectToDb";
import MissingPerson from "@/models/missingPerson";

export async function GET() {
  try {
    await connectToDatabase();

    const response = await MissingPerson.find({});

    return NextResponse.json(response, { status: 200 });
  } catch (error:unknown) {
    console.error("❌ Error fetching deadPerson data:", error);
    return NextResponse.json(
      { message: "Error fetching data", error: (error as Error).message },
      { status: 500 }
    );
  }
}
