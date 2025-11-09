// app/api/update-status/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import deadPerson from "@/models/missingPerson";
import foundPerson from "@/models/foundPerson";
import connectToDatabase from "@/libs/connectToDb";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } =await context.params;
    console.log(id);
    const body = await request.json();
    console.log(body);
    
    const {
      solvedAt,
      foundLocation,
      foundPolice,
      contactType,
      contactValue,
    } = body;

    // Validate required fields
    if (!solvedAt || !foundLocation || !foundPolice || !contactValue) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch the missing person details
    const missingPerson = await deadPerson.findById(id);

    if (!missingPerson) {
      return NextResponse.json(
        { error: "Missing person not found" },
        { status: 404 }
      );
    }

    // Check if already found
    if (missingPerson.status === "Identified") {
      return NextResponse.json(
        { error: "This person is already marked as Identified" },
        { status: 400 }
      );
    }

    // Update the missing person status to "Found"
    missingPerson.status = "Identified";
    await missingPerson.save();

    // Create a new FoundPerson record
    const foundPersonData = {
      name: missingPerson.name,
      age: missingPerson.age,
      gender: missingPerson.gender,
      address: missingPerson.address,
      contactNumber: contactValue,
      dateMissing: missingPerson.dateMissing,
      imageUrl: missingPerson.imageUrl,
      status: "Identified",
      solvedAt: new Date(solvedAt),
      foundPolice: foundPolice,
      foundLocation: foundLocation,
      contactType: contactType,
      contactValue:contactValue,
      originalMissingPersonId: id,
    };

    const foundPersonn = await foundPerson.create(foundPersonData);

    // Return combined response
    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
      data: {
        missingPerson: {
          _id: missingPerson._id,
          name: missingPerson.name,
          status: missingPerson.status,
        },
        foundPerson: foundPerson,
        combined: {
          ...foundPersonData,
          _id: foundPersonn._id,
        },
      },
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json(
      { error: "Failed to update status", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}