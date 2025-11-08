import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import mongoose, { Schema, Document } from 'mongoose';

// ==================== TYPES ====================

// No request body is needed
// interface UnidentifiedBodyRequest {}

// Interface for organizations (no distance calculated)
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

// New Schema for Unidentified Body Reports
// SIMPLIFIED: No parameters, just a log entry
interface IUnidentifiedBody extends Document {
  createdAt: Date;
}

const unidentifiedBodySchema = new Schema<IUnidentifiedBody>(
  {
    createdAt: { type: Date, default: Date.now },
  }
);

const UnidentifiedBody = mongoose.models.UnidentifiedBody ||
  mongoose.model<IUnidentifiedBody>("UnidentifiedBody", unidentifiedBodySchema);


// ==================== HELPER FUNCTIONS ====================

// NOTE: Proximity functions (calculateDistance, toRadians, getNearestOrganizations)
// are no longer needed for this route as we are notifying ALL organizations.

// Configure email transporter
function createEmailTransporter() {
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
 * Sends "Unidentified Body" alert emails to ALL recipients.
 * SIMPLIFIED: No location data is passed.
 */
async function sendUnidentifiedBodyAlerts(
  recipients: IOrganization[] // Takes the full organization list
): Promise<{ success: boolean; sent: number; failed: number }> {
  const transporter = createEmailTransporter();
  let sent = 0;
  let failed = 0;

  const emailPromises = recipients.map(async (recipient) => {
    const mailOptions = {
      from: `Official Notification <${process.env.SMTP_USER}>`,
      to: 'hrushikeshsarangi7@gmail.com', // HARDCODED: All emails go to this test address
      subject: `NOTIFICATION: Unidentified Body Reported`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
            .header { 
              background: linear-gradient(135deg, #495057 0%, #212529 100%);
              color: white; 
              padding: 30px 20px; 
              text-align: center;
            }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; background-color: #ffffff; text-align: center; }
            .alert-text {
              font-size: 18px;
              color: #212529;
              margin-bottom: 25px;
            }
            .info-text {
              font-size: 14px;
              color: #6c757d;
              margin-bottom: 15px;
            }
            .footer { 
              text-align: center; 
              padding: 20px; 
              background-color: #f8f9fa;
              color: #6c757d; 
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1><span style="font-size: 30px;">i</span> OFFICIAL NOTIFICATION</h1>
            </div>
            
            <div class="content">
              <p class="alert-text">
                This is an official alert to inform you that an unidentified body has been reported.
              </p>
              <p class="info-text">
                Please check your local jurisdiction and cross-reference any missing person reports.
              </p>
              <p class="info-text">
                Contact local authorities for further information.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Official Coordination System</strong></p>
              <p>This is an automated alert sent to: hrushikeshsarangi7@gmail.com</p>
              <p>Organization: ${recipient.name} (${recipient.type})</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
═══════════════════════════════════════════
i OFFICIAL NOTIFICATION: UNIDENTIFIED BODY
═══════════════════════════════════════════

This is an official alert to inform you that an unidentified body has been reported.

Please check your local jurisdiction and cross-reference any missing person reports.

Contact local authorities for further information.

═══════════════════════════════════════════
Official Coordination System - Automated Alert
(Recipient: ${recipient.name})
═══════════════════════════════════════════
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      sent++;
      console.log(`✓ Unidentified Body Alert sent for ${recipient.name} (${recipient.type})`);
    } catch (error) {
      failed++;
      console.error(`✗ Failed to send Unidentified Body Alert for ${recipient.name}:`, error);
    }
  });

  await Promise.all(emailPromises);
  return { success: failed === 0, sent, failed };
}

// ==================== API ENDPOINT ====================

/**
 * API route handler for POST /api/report-unidentified
 * Receives a parameter-less request, logs it,
 * and notifies ALL active organizations.
 */
export async function POST(request: NextRequest) {
  try {
    // === 1. Validate Input ===
    // No input to validate as per user request.
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('Email configuration missing. Set SMTP_USER and SMTP_PASSWORD.');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Email service not set up.' },
        { status: 500 }
      );
    }
    
    console.log(`ℹ️ New generic unidentified body report received.`);
    
    // === 2. Connect to DB & Save Report ===
    await connectToDatabase();
    
    // SIMPLIFIED: Just create a log entry
    const newReport = new UnidentifiedBody({});
    await newReport.save();
    console.log(`✅ Generic Report ${newReport._id} saved to database.`);

    // === 3. Fetch ALL Organizations ===
    const allOrganizations = await Organization.find({ active: true });
    
    if (allOrganizations.length === 0) {
      console.warn(`Report ${newReport._id} saved, but no active organizations found to notify.`);
      return NextResponse.json({
        success: true,
        message: 'Report saved, but no active organizations found to notify.',
        notificationsSent: 0,
        reportId: newReport._id,
      }, { status: 200 });
    }
    
    console.log(`📊 Found ${allOrganizations.length} active organizations to notify.`);

    // === 4. Send Notifications to ALL ===
    // We are not finding "nearest" orgs, but sending to all.
    const result = await sendUnidentifiedBodyAlerts(allOrganizations);
    
    console.log(`Email sending complete for ${newReport._id}: ${result.sent} sent, ${result.failed} failed.`);
    
    // === 5. Return Final Response ===
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Report saved and all alerts sent successfully' 
        : `Report saved. Sent ${result.sent} alerts, ${result.failed} failed`,
      reportId: newReport._id,
      notificationsSent: result.sent,
      notificationsFailed: result.failed,
      recipientCount: allOrganizations.length,
    }, { status: result.success ? 201 : 207 });
    
  } catch (error) {
    console.error('❌ Error processing unidentified body report:', error);
    
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
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