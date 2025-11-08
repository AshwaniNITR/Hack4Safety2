// app/api/missing-persons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import MissingPerson from '@/models/missingPerson';
import { uploadToCloudinary } from '@/libs/cloudinary';

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

interface MissingPerson {
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

// Function to get facial embeddings from your AI model
const getFacialEmbedding = async (imageBuffer: Buffer): Promise<number[]> => {
  try {
    const AI_MODEL_URL = process.env.AI_MODEL_URL;
    
    if (!AI_MODEL_URL) {
      console.error('AI_MODEL_URL is not configured in environment variables');
      throw new Error('AI model endpoint not configured');
    }

    console.log('Calling embedding API at:', `${AI_MODEL_URL}/get_embeddings`);
    
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' });
    formData.append('image', blob, 'image.jpg');

    const response = await fetch(`${AI_MODEL_URL}/get_embeddings`, {
      method: 'POST',
      body: formData,
    });

    console.log('Embedding API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Embedding API error response:', errorText);
      throw new Error(`Failed to generate facial embeddings: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Embedding API response keys:', Object.keys(data));
    
    const embedding = data.embedding_vector || data.embedding || data.embeddings || [];
    console.log('Extracted embedding length:', embedding.length);
    
    return embedding;
  } catch (error: unknown) {
    console.error('Error generating embeddings:', error);
    throw new Error(`Failed to process facial recognition: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Parse form data
    const formData = await req.formData();
    
    // Extract form fields
    const name = formData.get('name') as string;
    const age = formData.get('age') as string;
    const gender = formData.get('gender') as string;
    const address = formData.get('address') as string;
    const contactNumber = formData.get('contactNumber') as string;
    const dateMissing = formData.get('dateMissing') as string;
    const placeLastSeen = formData.get('placeLastSeen') as string;
    const clothingDescription = formData.get('clothingDescription') as string;
    const physicalFeatures = formData.get('physicalFeatures') as string;
    const reportedByName = formData.get('reportedByName') as string;
    const reportedByDesignation = formData.get('reportedByDesignation') as string;
    const policeStation = formData.get('policeStation') as string;
    const image = formData.get('image') as File;

    // Validate required fields
    if (!name || !dateMissing || !image) {
      return NextResponse.json(
        { error: 'Missing required fields: name, dateMissing, and image are required' },
        { status: 400 }
      );
    }

    // Validate image file
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image file.' },
        { status: 400 }
      );
    }

    // Convert image to buffer
    const imageBytes = await image.arrayBuffer();
    const imageBuffer = Buffer.from(imageBytes);

    // Upload image to Cloudinary
    console.log('Uploading image to Cloudinary...');
    const cloudinaryResponse = await uploadToCloudinary(
      imageBuffer,
      'missing-persons'
    );
    const imageUrl = cloudinaryResponse.secure_url;
    console.log('Image uploaded successfully:', imageUrl);

    // Generate facial embeddings
    const embedding = await getFacialEmbedding(imageBuffer);

    // Validate embedding
    if (!embedding || embedding.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate facial embeddings. Please ensure the image contains a clear face.' },
        { status: 400 }
      );
    }

    // Create missing person document
    const missingPerson = new MissingPerson({
      name,
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      address: address || undefined,
      contactNumber: contactNumber || undefined,
      dateMissing: new Date(dateMissing),
      placeLastSeen: placeLastSeen || undefined,
      clothingDescription: clothingDescription || undefined,
      physicalFeatures: physicalFeatures || undefined,
      imageUrl,
      embedding,
      status: 'Missing',
      reportFiledBy: {
        name: reportedByName || undefined,
        designation: reportedByDesignation || undefined,
        policeStation: policeStation || undefined,
      },
    });

    // Save to database
    await missingPerson.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Missing person report filed successfully',
        data: {
          id: missingPerson._id,
          name: missingPerson.name,
          dateMissing: missingPerson.dateMissing,
          status: missingPerson.status,
          imageUrl: missingPerson.imageUrl,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error processing missing person report:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process report',
        details: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve missing persons
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const query: Partial<MissingPerson> = {};
    if (status) {
      query.status = status;
    }

    const missingPersons = await MissingPerson.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-embedding'); // Exclude embedding from response for performance

    const total = await MissingPerson.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: missingPersons,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching missing persons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch missing persons', details: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}