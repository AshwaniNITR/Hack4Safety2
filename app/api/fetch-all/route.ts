// app/api/fetch-all/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// MongoDB Connection
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Missing Person Schema
const missingPersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  address: { type: String },
  contactNumber: { type: String },
  dateMissing: { type: Date, required: true },
  placeLastSeen: { type: String },
  clothingDescription: { type: String },
  physicalFeatures: { type: String },
  imageUrl: { type: String, required: true },
  embedding: { type: [Number], required: true },
  status: { type: String, enum: ["Missing", "Found"], default: "Missing" },
  reportFiledBy: {
    name: { type: String },
    designation: { type: String },
    policeStation: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

const MissingPerson = mongoose.models.MissingPerson || 
  mongoose.model("MissingPerson", missingPersonSchema);

export async function GET(request: Request) {
  try {
    await connectDB();

    // Fetch all missing persons from database
    const allPersons = await MissingPerson.find({}).sort({ createdAt: -1 });

    // Calculate statistics
    const totalReports = allPersons.length;
    const totalMissing = allPersons.filter(p => p.status === 'Missing').length;
    const totalFound = allPersons.filter(p => p.status === 'Found').length;
    const aiEmbeddingsGenerated = allPersons.filter(p => p.embedding && p.embedding.length > 0).length;

    // Calculate district-wise data
    const districtMap = new Map();
    allPersons.forEach(person => {
      const district = person.address || 'Unknown';
      if (!districtMap.has(district)) {
        districtMap.set(district, {
          district,
          missingCases: 0,
          foundCases: 0,
          totalEmbeddings: 0,
          totalCases: 0
        });
      }
      const data = districtMap.get(district);
      data.totalCases++;
      if (person.status === 'Missing') data.missingCases++;
      if (person.status === 'Found') data.foundCases++;
      if (person.embedding && person.embedding.length > 0) data.totalEmbeddings++;
    });

    const districtData = Array.from(districtMap.values()).map(d => ({
      ...d,
      resolutionRate: d.totalCases > 0 ? Math.round((d.foundCases / d.totalCases) * 100) : 0,
      avgEmbeddingConfidence: d.totalCases > 0 ? Math.round((d.totalEmbeddings / d.totalCases) * 100) : 0
    }));

    // Calculate monthly trends
    const monthlyMap = new Map();
    allPersons.forEach(person => {
      const date = new Date(person.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthName,
          missingReported: 0,
          foundResolved: 0,
          aiMatches: 0,
          embeddingQuality: 0,
          totalEmbeddings: 0,
          totalCases: 0
        });
      }
      const data = monthlyMap.get(monthKey);
      data.totalCases++;
      if (person.status === 'Missing') data.missingReported++;
      if (person.status === 'Found') data.foundResolved++;
      if (person.embedding && person.embedding.length > 0) {
        data.totalEmbeddings++;
        data.aiMatches++;
      }
    });

    const monthlyTrends = Array.from(monthlyMap.values())
      .map(m => ({
        ...m,
        embeddingQuality: m.totalCases > 0 ? Math.round((m.totalEmbeddings / m.totalCases) * 100) : 0
      }))
      .slice(-12); // Last 12 months

    // Calculate match accuracy (based on found cases with embeddings)
    const foundWithEmbeddings = allPersons.filter(p => 
      p.status === 'Found' && p.embedding && p.embedding.length > 0
    ).length;
    const matchAccuracy = totalFound > 0 ? Math.round((foundWithEmbeddings / totalFound) * 100) : 0;

    // Calculate average resolution time (mock calculation)
    const avgResolutionTime = allPersons
      .filter(p => p.status === 'Found')
      .reduce((acc, person) => {
        const daysDiff = Math.floor((new Date().getTime() - new Date(person.dateMissing).getTime()) / (1000 * 60 * 60 * 24));
        return acc + daysDiff;
      }, 0);
    const avgDays = totalFound > 0 ? Math.round(avgResolutionTime / totalFound) : 0;

    const response = {
      stats: {
        totalMissing,
        totalFound,
        monthlyMatches: monthlyTrends[monthlyTrends.length - 1]?.aiMatches || 0,
        pendingVerification: Math.floor(totalMissing * 0.15), // Mock data
        totalReports,
        aiEmbeddingsGenerated,
        matchAccuracy,
        avgResolutionTime: avgDays
      },
      allPersons: allPersons.map(person => ({
        _id: person._id.toString(),
        name: person.name,
        age: person.age,
        gender: person.gender,
        address: person.address,
        contactNumber: person.contactNumber,
        dateMissing: person.dateMissing,
        placeLastSeen: person.placeLastSeen,
        clothingDescription: person.clothingDescription,
        physicalFeatures: person.physicalFeatures,
        imageUrl: person.imageUrl,
        embedding: person.embedding,
        status: person.status,
        reportFiledBy: person.reportFiledBy,
        createdAt: person.createdAt
      })),
      districtData,
      monthlyTrends,
      recentReports: allPersons.slice(0, 10) // Last 10 reports
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from database' },
      { status: 500 }
    );
  }
}