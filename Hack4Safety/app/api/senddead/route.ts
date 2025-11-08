// app/api/send-to-dead-db/route.ts (or pages/api/send-to-dead-db.ts for Pages Router)

import { NextRequest, NextResponse } from 'next/server'; // Adjust path to your DB connection
import deadPerson from '@/models/deadbody'
import connectToDatabase from '@/libs/connectToDb';

// For App Router (app directory)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const data = await request.json();

    if (!data || !data.matches || data.matches.length === 0) {
      return NextResponse.json(
        { error: 'No match data provided' },
        { status: 400 }
      );
    }

    // Map the search results to the dead person schema
    const personsToSave = data.matches.map((match: any) => ({
      name: match.name || 'Unknown',
      age: match.age,
      gender: match.gender,
      address: match.address,
      contactNumber: match.contactNumber,
      dateMissing: new Date(match.dateMissing),
      placeLastSeen: match.placeLastSeen,
      clothingDescription: match.clothingDescription,
      physicalFeatures: match.physicalFeatures,
      imageUrl: match.imageUrl,
      embedding: match.embedding,
      status: match.status || 'Missing',
      reportFiledBy: match.reportFiledBy || {},
      createdAt: match.createdAt ? new Date(match.createdAt) : new Date(),
    }));

    // Insert all persons into the database
    const result = await deadPerson.insertMany(personsToSave, {
      ordered: false, // Continue even if some documents fail
    });

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${result.length} person(s) to the dead database`,
      count: result.length,
    });
  } catch (error: any) {
    console.error('Error saving to dead database:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to save to database',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// For Pages Router (pages directory) - Alternative implementation
/*
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import deadPerson from '@/models/deadPerson';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const data = req.body;

    if (!data || !data.matches || data.matches.length === 0) {
      return res.status(400).json({ error: 'No match data provided' });
    }

    const personsToSave = data.matches.map((match: any) => ({
      name: match.name || 'Unknown',
      age: match.age,
      gender: match.gender,
      address: match.address,
      contactNumber: match.contactNumber,
      dateMissing: new Date(match.dateMissing),
      placeLastSeen: match.placeLastSeen,
      clothingDescription: match.clothingDescription,
      physicalFeatures: match.physicalFeatures,
      imageUrl: match.imageUrl,
      embedding: match.embedding,
      status: match.status || 'Missing',
      reportFiledBy: match.reportFiledBy || {},
      createdAt: match.createdAt ? new Date(match.createdAt) : new Date(),
    }));

    const result = await deadPerson.insertMany(personsToSave, {
      ordered: false,
    });

    return res.status(200).json({
      success: true,
      message: `Successfully saved ${result.length} person(s) to the dead database`,
      count: result.length,
    });
  } catch (error: any) {
    console.error('Error saving to dead database:', error);
    
    return res.status(500).json({
      error: 'Failed to save to database',
      details: error.message,
    });
  }
}
*/