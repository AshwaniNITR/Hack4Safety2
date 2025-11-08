import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import mongoose, { Schema, Document } from 'mongoose';

// ==================== TYPES ====================

// Interface for the incoming API request body
interface MissingPersonRequest {
  name: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string; // Home address
  contactNumber?: string;
  dateMissing: string; // ISO string date
  placeLastSeen: string; // Text description
  lat: number; // Latitude of placeLastSeen
  lon: number; // Longitude of placeLastSeen
  clothingDescription?: string;
  physicalFeatures?: string;
  reportFiledBy?: {
    name?: string;
    designation?: string;
    policeStation?: string;
  };
}

// Interface for nearby organizations (re-used from your example)
interface OrganizationWithDistance {
  name: string;
  email: string;
  type: 'hospital' | 'municipality' | 'ngo';
  lat: number;
  lon: number;
  distance: number;
  phone?: string;
  address?: string;
}

// ==================== DATABASE CONNECTION ====================

const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    // Ensure MONGO_URI is set in your .env.local file
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGO_URI!, {
      dbName: "test", // Or your preferred database name
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

// ==================== MONGOOSE MODELS ====================

// Organization Schema (to find recipients)
interface IOrganization extends Document {
  name: string;
  email: string;
  type: 'hospital' | 'municipality' | 'ngo';
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  active: boolean;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    type: { type: String, required: true, enum: ['hospital', 'municipality', 'ngo'] },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lon: { type: Number, required: true, min: -180, max: 180 },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Organization = mongoose.models.Organization ||
  mongoose.model<IOrganization>('Organization', OrganizationSchema);

// Missing Person Schema (based on your request)
// NOTE: Added lat/lon to store the location of 'placeLastSeen' for proximity alerts
interface IMissingPerson extends Document {
  name: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  contactNumber?: string;
  dateMissing: Date;
  placeLastSeen: string;
  lat: number; // Latitude of placeLastSeen
  lon: number; // Longitude of placeLastSeen
  clothingDescription?: string;
  physicalFeatures?: string;
  reportFiledBy?: {
    name?: string;
    designation?: string;
    policeStation?: string;
  };
  createdAt: Date;
}

const missingPersonSchema = new Schema<IMissingPerson>(
  {
    name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    address: { type: String },
    contactNumber: { type: String },
    dateMissing: { type: Date, required: true },
    placeLastSeen: { type: String },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lon: { type: Number, required: true, min: -180, max: 180 },
    clothingDescription: { type: String },
    physicalFeatures: { type: String },
    reportFiledBy: {
      name: { type: String },
      designation: { type: String },
      policeStation: { type: String },
    },
    createdAt: { type: Date, default: Date.now },
  }
);

const MissingPerson = mongoose.models.MissingPerson ||
  mongoose.model<IMissingPerson>("MissingPerson", missingPersonSchema);


// ==================== HELPER FUNCTIONS ====================

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Get nearest organizations within specified radius (default 40km)
function getNearestOrganizations(
  lat: number,
  lon: number,
  organizations: IOrganization[], // Use the interface type
  radiusKm: number = 40
): OrganizationWithDistance[] {
  return organizations
    .map((org) => ({
      name: org.name,
      email: org.email,
      type: org.type,
      lat: org.lat,
      lon: org.lon,
      phone: org.phone,
      address: org.address,
      distance: calculateDistance(lat, lon, org.lat, org.lon),
    }))
    .filter((org) => org.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

// Configure email transporter
function createEmailTransporter() {
  // Ensure SMTP_USER and SMTP_PASSWORD are set in your .env.local file
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

// ==================== EMAIL NOTIFICATION FUNCTION ====================

/**
 * Sends "Missing Person" alert emails to a list of recipients.
 */
async function sendMissingPersonAlerts(
  recipients: OrganizationWithDistance[],
  personData: MissingPersonRequest
): Promise<{ success: boolean; sent: number; failed: number }> {
  const transporter = createEmailTransporter();
  let sent = 0;
  let failed = 0;

  const emailPromises = recipients.map(async (recipient) => {
    const mailOptions = {
      from: `Missing Person Alert <${process.env.SMTP_USER}>`,
      to: 'hrushikeshsarangi7@gmail.com', // HARDCODED: All emails go to this test address
      subject: `URGENT: MISSING PERSON - ${personData.name} - Last Seen ${recipient.distance.toFixed(1)}km from ${recipient.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
            .header { 
              background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%);
              color: white; 
              padding: 30px 20px; 
              text-align: center;
            }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .content { padding: 20px; background-color: #ffffff; }
            .info-box { 
              background-color: #f8f9fa; 
              padding: 20px; 
              margin: 15px 0; 
              border-left: 4px solid #dc3545;
              border-radius: 4px;
            }
            .info-row { 
              margin: 10px 0; 
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child { border-bottom: none; }
            .info-label { 
              font-weight: bold; 
              color: #495057;
              display: inline-block;
              min-width: 140px;
            }
            .info-value { color: #212529; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
              color: white !important; 
              text-decoration: none; 
              border-radius: 5px; 
              margin-top: 15px;
              font-weight: bold;
            }
            .alert-box {
              background-color: #fff3cd;
              border: 1px solid #ffeeba;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer { 
              text-align: center; 
              padding: 20px; 
              background-color: #f8f9fa;
              color: #6c757d; 
              font-size: 12px;
            }
            .distance-badge {
              background-color: #dc3545;
              color: white;
              padding: 5px 12px;
              border-radius: 15px;
              font-size: 14px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1><span style="font-size: 30px;">!</span> URGENT: MISSING PERSON</h1>
              <p>Please be on the lookout for the following individual</p>
            </div>
            
            <div class="content">
              <div class="info-box">
                <h2 style="margin-top: 0; color: #dc3545; font-size: 20px;">
                  👤 Missing Person Details
                </h2>
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value" style="font-size: 16px; font-weight: bold; color: #dc3545;">${personData.name}</span>
                </div>
                ${personData.age ? `<div class="info-row"><span class="info-label">Age:</span><span class="info-value">${personData.age}</span></div>` : ''}
                ${personData.gender ? `<div class="info-row"><span class="info-label">Gender:</span><span class="info-value">${personData.gender}</span></div>` : ''}
                <div class="info-row">
                  <span class="info-label">Date Missing:</span>
                  <span class="info-value">${new Date(personData.dateMissing).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Place Last Seen:</span>
                  <span class="info-value">${personData.placeLastSeen}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Location:</span>
                  <span class="info-value">${personData.lat.toFixed(6)}°, ${personData.lon.toFixed(6)}°</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Distance:</span>
                  <span class="distance-badge">📍 ${recipient.distance.toFixed(2)} km from ${recipient.name}</span>
                </div>
              </div>
              
              <div class="info-box" style="border-left-color: #ffc107;">
                <h3 style="margin-top: 0; color: #b8860b; font-size: 18px;">
                  ℹ️ Description & Report Details
                </h3>
                ${personData.clothingDescription ? `<div class="info-row"><span class="info-label">Clothing:</span><span class="info-value">${personData.clothingDescription}</span></div>` : ''}
                ${personData.physicalFeatures ? `<div class="info-row"><span class="info-label">Features:</span><span class="info-value">${personData.physicalFeatures}</span></div>` : ''}
                ${personData.contactNumber ? `<div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${personData.contactNumber}</span></div>` : ''}
                ${personData.reportFiledBy?.name ? `
                  <div class="info-row">
                    <span class="info-label">Reported By:</span>
                    <span class="info-value">${personData.reportFiledBy.name} (${personData.reportFiledBy.designation || 'N/A'})</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Station:</span>
                    <span class="info-value">${personData.reportFiledBy.policeStation || 'N/A'}</span>
                  </div>
                ` : ''}
              </div>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="https://www.google.com/maps?q=${personData.lat},${personData.lon}" 
                   class="button" target="_blank" rel="noopener noreferrer">
                  📍 View Last Seen Location
                </a>
              </div>
              
              <div class="alert-box">
                <strong>⚡ ACTION REQUESTED:</strong><br>
                Please be on high alert for this individual. If seen, please:
                <ul style="margin: 10px 0 0 20px; padding: 0;">
                  <li>Contact local authorities immediately.</li>
                  <li>Provide assistance if safe to do so.</li>
                  <li>Report any sightings to the reporting police station.</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Missing Person Recovery System</strong></p>
              <p>This is an automated alert sent to: hrushikeshsarangi7@gmail.com</p>
              <p>Organization: ${recipient.name} (${recipient.type})</p>
              <p style="margin-top: 10px; font-size: 11px; color: #adb5bd;">
                Report ID: ${new Date().getTime()} | ${new Date().toISOString()}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
═══════════════════════════════════════════
! URGENT: MISSING PERSON ALERT
═══════════════════════════════════════════

PERSON DETAILS:
─────────────────────────────────────────
Name: ${personData.name}
${personData.age ? `Age: ${personData.age}` : ''}
${personData.gender ? `Gender: ${personData.gender}` : ''}
Date Missing: ${new Date(personData.dateMissing).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Last Seen: ${personData.placeLastSeen}
Location: ${personData.lat.toFixed(6)}°, ${personData.lon.toFixed(6)}°
Distance from ${recipient.name}: ${recipient.distance.toFixed(2)} km

DESCRIPTION:
─────────────────────────────────────────
Clothing: ${personData.clothingDescription || 'N/A'}
Features: ${personData.physicalFeatures || 'N/A'}
Contact: ${personData.contactNumber || 'N/A'}

REPORT DETAILS:
─────────────────────────────────────────
Reported By: ${personData.reportFiledBy?.name || 'N/A'} (${personData.reportFiledBy?.designation || 'N/A'})
Station: ${personData.reportFiledBy?.policeStation || 'N/A'}

LOCATION LINK:
─────────────────────────────────────────
→ View Last Seen Location: https://www.google.com/maps?q=${personData.lat},${personData.lon}

⚡ ACTION REQUESTED:
- Be on high alert for this individual.
- Contact local authorities immediately if seen.
- Report sightings to the reporting police station.

═══════════════════════════════════════════
Missing Person Recovery System - Automated Alert
Sent to: hrushikeshsarangi7@gmail.com
(Recipient: ${recipient.name})
═══════════════════════════════════════════
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      sent++;
      console.log(`✓ Alert sent for ${recipient.name} (${recipient.type})`);
    } catch (error) {
      failed++;
      console.error(`✗ Failed to send alert for ${recipient.name}:`, error);
    }
  });

  // Wait for all email sending attempts to complete
  await Promise.all(emailPromises);

  return { success: failed === 0, sent, failed };
}

// ==================== API ENDPOINT ====================

/**
 * API route handler for POST /api/report-missing
 * Receives a missing person report, saves it to the DB,
 * and triggers email alerts to nearby organizations.
 */
export async function POST(request: NextRequest) {
  try {
    const body: MissingPersonRequest = await request.json();

    // === 1. Validate Input ===
    if (!body.name || !body.dateMissing || !body.placeLastSeen || body.lat === undefined || body.lon === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, dateMissing, placeLastSeen, lat, lon' },
        { status: 400 }
      );
    }
    
    // Validate coordinates
    if (body.lat < -90 || body.lat > 90 || body.lon < -180 || body.lon > 180) {
      return NextResponse.json(
        { success: false, error: 'Invalid coordinates' },
        { status: 400 }
      );
    }
    
    // Validate email configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('Email configuration missing. Set SMTP_USER and SMTP_PASSWORD.');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Email service not set up.' },
        { status: 500 }
      );
    }
    
    console.log(`🚨 New missing person report received for: ${body.name}`);
    
    // === 2. Connect to DB & Save Report ===
    await connectToDatabase();
    
    const newReport = new MissingPerson({
      ...body,
      dateMissing: new Date(body.dateMissing), // Convert string date to Date object
    });
    await newReport.save();
    console.log(`✅ Report for ${newReport.name} (ID: ${newReport._id}) saved to database.`);

    // === 3. Fetch Organizations ===
    const allOrganizations = await Organization.find({ active: true });
    
    if (allOrganizations.length === 0) {
      console.warn(`Report ${newReport._id} saved, but no active organizations found to notify.`);
      return NextResponse.json({
        success: true,
        message: 'Report saved, but no active organizations found to notify.',
        notificationsSent: 0,
        reportId: newReport._id,
      }, { status: 200 }); // 200 OK, as the report was still saved.
    }
    
    console.log(`📊 Found ${allOrganizations.length} active organizations to check for proximity.`);

    // === 4. Find Nearby Organizations (40km radius) ===
    const nearbyOrganizations = getNearestOrganizations(body.lat, body.lon, allOrganizations, 40);
    
    if (nearbyOrganizations.length === 0) {
      console.log(`Report ${newReport._id} saved. No organizations found within 40km radius.`);
      return NextResponse.json({
        success: true,
        message: 'Report saved. No organizations found within 40km radius.',
        notificationsSent: 0,
        searchRadius: 40,
        reportId: newReport._id,
      }, { status: 200 });
    }
    
    console.log(`📧 Sending alerts to ${nearbyOrganizations.length} organizations for report ${newReport._id}...`);

    // === 5. Send Notifications ===
    // This is the corrected function name:
    const result = await sendMissingPersonAlerts(nearbyOrganizations, body);
    
    console.log(`Email sending complete for ${newReport._id}: ${result.sent} sent, ${result.failed} failed.`);
    
    // === 6. Return Final Response ===
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Report saved and all alerts sent successfully' 
        : `Report saved. Sent ${result.sent} alerts, ${result.failed} failed`,
      reportId: newReport._id,
      personName: body.name,
      notificationsSent: result.sent,
      notificationsFailed: result.failed,
      recipientCount: nearbyOrganizations.length,
      searchRadius: 40,
      recipients: nearbyOrganizations.slice(0, 10).map((org) => ({ // Send a sample of recipients
        name: org.name,
        type: org.type,
        distance: org.distance.toFixed(2) + ' km',
      })),
    }, { status: result.success ? 201 : 207 }); // 201 Created (and alerts sent), 207 Multi-Status (partially failed)
    
  } catch (error) {
    console.error('❌ Error processing missing person report:', error);
    
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error processing report',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}