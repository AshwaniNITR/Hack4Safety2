import connectToDatabase from "@/libs/connectToDb";
import missingPerson from "@/models/missingPerson";
//import foundPerson from "@/models/foundPerson";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDatabase();
    const data = await missingPerson.find({status:"Found"});
    return NextResponse.json(data, { status: 200 });
  } catch (error:unknown) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { message: "Error fetching data", error: (error as Error).message },
      { status: 500 }
    );
  }
}
