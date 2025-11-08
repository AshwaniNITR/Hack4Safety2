// app/api/unidentified/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import MissingPerson from '@/models/missingPerson';

// MongoDB connection
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Database connection failed');
  }
};

export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const search = searchParams.get('search') || '';

    // Build query - only fetch records with status "Missing"
    const query: Record<string,any> = { status: 'Missing' };

    // Optional: Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { placeLastSeen: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort: Record<string, any> = {};
    sort[sortBy] = sortOrder;

    // Fetch missing persons with status "Missing"
    const missingPersons = await MissingPerson.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .select('-embedding') // Exclude embedding from response for performance
      .lean(); // Convert to plain JavaScript objects for better performance

    // Get total count for pagination
    const total = await MissingPerson.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: missingPersons,
      pagination: {
        total,
        limit,
        skip,
        currentPage: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching unidentified persons:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch unidentified persons', 
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}