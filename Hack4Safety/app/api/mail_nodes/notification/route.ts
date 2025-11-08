import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import mongoose, { Schema, Document } from 'mongoose';

// ==================== TYPES ====================
interface NotificationRequest {
  name: string;
  lat: number;
  lon: number;
}

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
    await mongoose.connect(process.env.MONGO_URI!, {
      dbName: "test",
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

// ==================== MONGOOSE MODELS ====================

// Organization Schema
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

// Notification Schema - For Missing Person Found Reports
interface INotification extends Document {
  name: string;
  lat: number;
  lon: number;
  status: 'pending' | 'sent' | 'failed';
  notificationsSent?: number;
  notificationsFailed?: number;
  recipientCount?: number;
}

const NotificationSchema = new Schema<INotification>(
  {
    name: { type: String, required: true, trim: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lon: { type: Number, required: true, min: -180, max: 180 },
    status: { 
      type: String, 
      enum: ['pending', 'sent', 'failed'], 
      default: 'pending' 
    },
    notificationsSent: { type: Number, default: 0 },
    notificationsFailed: { type: Number, default: 0 },
    recipientCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Post-save middleware to trigger notifications automatically when missing person is found
NotificationSchema.post('save', async function (doc: INotification) {
  if (this.isNew && doc.status === 'pending') {
    try {
      console.log('🆕 Missing person found! Triggering email alerts...');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: doc.name,
            lat: doc.lat,
            lon: doc.lon,
          }),
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email notifications sent:', result);
        
        // Update without triggering another save hook
        await Notification.updateOne(
          { _id: doc._id },
          {
            status: 'sent',
            notificationsSent: result.notificationsSent || 0,
            notificationsFailed: result.notificationsFailed || 0,
            recipientCount: result.recipientCount || 0,
          }
        );
      } else {
        console.error('❌ Failed to send notifications');
        await Notification.updateOne({ _id: doc._id }, { status: 'failed' });
      }
    } catch (error) {
      console.error('❌ Error triggering notifications:', error);
      await Notification.updateOne({ _id: doc._id }, { status: 'failed' });
    }
  }
});

const Notification = mongoose.models.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema);

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
  organizations: any[],
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
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

// ==================== EMAIL NOTIFICATION FUNCTION ====================
async function sendNotifications(
  recipients: OrganizationWithDistance[],
  personData: NotificationRequest
): Promise<{ success: boolean; sent: number; failed: number }> {
  const transporter = createEmailTransporter();
  
  let sent = 0;
  let failed = 0;
  
  const emailPromises = recipients.map(async (recipient) => {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'hrushikeshsarangi7@gmail.com', // All emails sent to this address
      subject: `🔍 MISSING PERSON FOUND - ${personData.name} - ${recipient.distance.toFixed(1)}km from ${recipient.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { 
              background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
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
              border-left: 4px solid #007bff;
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
              background: linear-gradient(135deg, #28a745 0%, #218838 100%);
              color: white !important; 
              text-decoration: none; 
              border-radius: 5px; 
              margin-top: 15px;
              font-weight: bold;
            }
            .alert-box {
              background-color: #d1ecf1;
              border: 1px solid #bee5eb;
              border-left: 4px solid #17a2b8;
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
              background-color: #17a2b8;
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
              <h1>🔍 MISSING PERSON FOUND</h1>
              <p>Urgent notification for emergency services</p>
            </div>
            
            <div class="content">
              <div class="info-box">
                <h2 style="margin-top: 0; color: #007bff; font-size: 20px;">
                  👤 Person Found - Details
                </h2>
                
                <div class="info-row">
                  <span class="info-label">Person's Name:</span>
                  <span class="info-value" style="font-size: 16px; font-weight: bold; color: #007bff;">${personData.name}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Found Location:</span>
                  <span class="info-value">${personData.lat.toFixed(6)}°, ${personData.lon.toFixed(6)}°</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Distance:</span>
                  <span class="distance-badge">📍 ${recipient.distance.toFixed(2)} km from ${recipient.name}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Reported Time:</span>
                  <span class="info-value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                </div>
              </div>
              
              <div class="info-box" style="border-left-color: #28a745;">
                <h3 style="margin-top: 0; color: #28a745; font-size: 18px;">
                  🏥 Responding Organization
                </h3>
                <div class="info-row">
                  <span class="info-label">Organization:</span>
                  <span class="info-value">${recipient.name}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Type:</span>
                  <span class="info-value">${recipient.type.toUpperCase()}</span>
                </div>
                ${recipient.address ? `
                <div class="info-row">
                  <span class="info-label">Address:</span>
                  <span class="info-value">${recipient.address}</span>
                </div>
                ` : ''}
                ${recipient.phone ? `
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${recipient.phone}</span>
                </div>
                ` : ''}
              </div>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="https://www.google.com/maps/dir/?api=1&origin=${recipient.lat},${recipient.lon}&destination=${personData.lat},${personData.lon}" 
                   class="button">
                  🗺️ Get Directions to Location
                </a>
                <br>
                <a href="https://www.google.com/maps?q=${personData.lat},${personData.lon}" 
                   class="button" style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);">
                  📍 View Location on Map
                </a>
              </div>
              
              <div class="alert-box">
                <strong>⚡ IMMEDIATE ACTION REQUIRED:</strong><br>
                A missing person has been found at the coordinates above. Please:
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Dispatch emergency response team immediately</li>
                  <li>Contact the person's family/authorities</li>
                  <li>Provide necessary assistance</li>
                  <li>Coordinate with other responding organizations</li>
                  <li>Update the coordination center on arrival</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Missing Person Recovery System</strong></p>
              <p>This is an automated notification sent to: hrushikeshsarangi7@gmail.com</p>
              <p>Organization: ${recipient.name} (${recipient.type})</p>
              <p style="margin-top: 10px; font-size: 11px; color: #adb5bd;">
                Report ID: ${Date.now()} | ${new Date().toISOString()}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
═══════════════════════════════════════════
🔍 MISSING PERSON FOUND - URGENT NOTIFICATION
═══════════════════════════════════════════

PERSON DETAILS:
─────────────────────────────────────────
Name: ${personData.name}
Found Location: ${personData.lat.toFixed(6)}°, ${personData.lon.toFixed(6)}°
Distance from ${recipient.name}: ${recipient.distance.toFixed(2)} km
Time Found: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

RESPONDING ORGANIZATION:
─────────────────────────────────────────
Organization: ${recipient.name}
Type: ${recipient.type.toUpperCase()}
${recipient.address ? `Address: ${recipient.address}` : ''}
${recipient.phone ? `Phone: ${recipient.phone}` : ''}

LOCATION LINKS:
─────────────────────────────────────────
→ View location: https://www.google.com/maps?q=${personData.lat},${personData.lon}
→ Get directions: https://www.google.com/maps/dir/?api=1&origin=${recipient.lat},${recipient.lon}&destination=${personData.lat},${personData.lon}

⚡ IMMEDIATE ACTION REQUIRED:
- Dispatch emergency response team immediately
- Contact person's family/authorities
- Provide necessary assistance
- Coordinate with other responding organizations

═══════════════════════════════════════════
Missing Person Recovery System - Automated Notification
Sent to: hrushikeshsarangi7@gmail.com
═══════════════════════════════════════════
      `,
    };
    
    try {
      await transporter.sendMail(mailOptions);
      sent++;
      console.log(`✓ Email sent for ${recipient.name} (${recipient.type})`);
    } catch (error) {
      failed++;
      console.error(`✗ Failed to send email for ${recipient.name}:`, error);
    }
  });
  
  await Promise.all(emailPromises);
  
  return { success: failed === 0, sent, failed };
}

// ==================== API ENDPOINTS ====================

// POST endpoint to handle missing person found notifications
export async function POST(request: NextRequest) {
  try {
    const body: NotificationRequest = await request.json();
    
    // Validate input
    if (!body.name || body.lat === undefined || body.lon === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, lat, lon' },
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
      return NextResponse.json(
        { success: false, error: 'Email configuration missing. Set SMTP_USER and SMTP_PASSWORD.' },
        { status: 500 }
      );
    }
    
    console.log('🔍 Missing person found:', body);
    
    // Connect to database
    await connectToDatabase();
    
    // Fetch active organizations
    const allOrganizations = await Organization.find({ active: true });
    
    if (allOrganizations.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active organizations found in database',
        notificationsSent: 0,
      });
    }
    
    console.log(`📊 Found ${allOrganizations.length} active organizations`);
    
    // Get nearby organizations (40km radius)
    const nearbyOrganizations = getNearestOrganizations(body.lat, body.lon, allOrganizations, 40);
    
    if (nearbyOrganizations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No organizations found within 40km radius',
        notificationsSent: 0,
        searchRadius: 40,
      });
    }
    
    console.log(`📧 Sending notifications to ${nearbyOrganizations.length} organizations...`);
    
    // Send notifications
    const result = await sendNotifications(nearbyOrganizations, body);
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'All notifications sent successfully' 
        : `Sent ${result.sent} notifications, ${result.failed} failed`,
      personName: body.name,
      notificationsSent: result.sent,
      notificationsFailed: result.failed,
      recipientCount: nearbyOrganizations.length,
      searchRadius: 40,
      recipients: nearbyOrganizations.slice(0, 10).map((org) => ({
        name: org.name,
        type: org.type,
        distance: org.distance.toFixed(2) + ' km',
      })),
    }, { status: result.success ? 200 : 207 });
    
  } catch (error) {
    console.error('❌ Error processing notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const orgCount = await Organization.countDocuments({ active: true });
    const notificationCount = await Notification.countDocuments();
    const recentFound = await Notification.countDocuments({ 
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
    });
    
    return NextResponse.json({
      status: 'ok',
      message: 'Missing Person Recovery System is operational',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        activeOrganizations: orgCount,
        totalReports: notificationCount,
        foundLast24Hours: recentFound,
      },
      configuration: {
        smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD),
        notificationRadius: '40 km',
        recipientEmail: 'hrushikeshsarangi7@gmail.com',
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Service running but database connection failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}