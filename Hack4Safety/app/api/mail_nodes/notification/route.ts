import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// ==================== TYPES ====================
interface NotificationRequest {
  image: File;
  lat: number;
  lon: number;
}

interface Organization {
  name: string;
  email: string;
  type: 'hospital' | 'municipality' | 'ngo';
  lat: number;
  lon: number;
  phone?: string;
  address?: string;
}

interface OrganizationWithDistance extends Organization {
  distance: number;
}

// ==================== HARDCODED ORGANIZATIONS ====================
// Replace this with your actual organization data
const ORGANIZATIONS: Organization[] = [
  {
    name: 'City General Hospital',
    email: 'contact@cityhospital.com',
    type: 'hospital',
    lat: 22.2587,
    lon: 84.8537,
    address: 'Main Road, Rourkela',
    phone: '+91-1234567890',
  },
  {
    name: 'Municipal Corporation',
    email: 'info@municipality.gov',
    type: 'municipality',
    lat: 22.2497,
    lon: 84.8500,
    address: 'Civil Township, Rourkela',
    phone: '+91-0987654321',
  },
  // Add more organizations as needed
];

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
      user: "senapatiashwani47@gmail.com",
      pass: "itpyloblbzojkfup",
    },
  });
}

// Convert File to base64 for email attachment
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

// ==================== EMAIL NOTIFICATION FUNCTION ====================
async function sendNotifications(
  recipients: OrganizationWithDistance[],
  imageFile: File,
  lat: number,
  lon: number
): Promise<{ success: boolean; sent: number; failed: number }> {
  const transporter = createEmailTransporter();
  
  let sent = 0;
  let failed = 0;
  
  // Convert image to base64 for attachment
  const imageBase64 = await fileToBase64(imageFile);
  const imageName = imageFile.name || 'found-person.jpg';
  const imageMimeType = imageFile.type || 'image/jpeg';
  
  const emailPromises = recipients.map(async (recipient) => {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'hrushikeshsarangi7@gmail.com', // All emails sent to this address
      subject: `🔍 MISSING PERSON FOUND - ${recipient.distance.toFixed(1)}km from ${recipient.name}`,
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
            .image-box {
              text-align: center;
              margin: 20px 0;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 8px;
            }
            .image-box img {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
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
              <div class="image-box">
                <h3 style="margin-top: 0; color: #007bff;">📸 Person Found - Photo Attached</h3>
                <p style="color: #6c757d; font-size: 14px;">The image of the found person is attached to this email</p>
              </div>

              <div class="info-box">
                <h2 style="margin-top: 0; color: #007bff; font-size: 20px;">
                  📍 Location Details
                </h2>
                
                <div class="info-row">
                  <span class="info-label">Found Location:</span>
                  <span class="info-value">${lat.toFixed(6)}°, ${lon.toFixed(6)}°</span>
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
                <a href="https://www.google.com/maps/dir/?api=1&origin=${recipient.lat},${recipient.lon}&destination=${lat},${lon}" 
                   class="button">
                  🗺️ Get Directions to Location
                </a>
                <br>
                <a href="https://www.google.com/maps?q=${lat},${lon}" 
                   class="button" style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);">
                  📍 View Location on Map
                </a>
              </div>
              
              <div class="alert-box">
                <strong>⚡ IMMEDIATE ACTION REQUIRED:</strong><br>
                A missing person has been found at the coordinates above. Please:
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Dispatch emergency response team immediately</li>
                  <li>Review the attached photo to identify the person</li>
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

LOCATION DETAILS:
─────────────────────────────────────────
Found Location: ${lat.toFixed(6)}°, ${lon.toFixed(6)}°
Distance from ${recipient.name}: ${recipient.distance.toFixed(2)} km
Time Found: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

📸 PHOTO: Attached to this email

RESPONDING ORGANIZATION:
─────────────────────────────────────────
Organization: ${recipient.name}
Type: ${recipient.type.toUpperCase()}
${recipient.address ? `Address: ${recipient.address}` : ''}
${recipient.phone ? `Phone: ${recipient.phone}` : ''}

LOCATION LINKS:
─────────────────────────────────────────
→ View location: https://www.google.com/maps?q=${lat},${lon}
→ Get directions: https://www.google.com/maps/dir/?api=1&origin=${recipient.lat},${recipient.lon}&destination=${lat},${lon}

⚡ IMMEDIATE ACTION REQUIRED:
- Dispatch emergency response team immediately
- Review attached photo to identify the person
- Contact person's family/authorities
- Provide necessary assistance
- Coordinate with other responding organizations

═══════════════════════════════════════════
Missing Person Recovery System - Automated Notification
Sent to: hrushikeshsarangi7@gmail.com
═══════════════════════════════════════════
      `,
      attachments: [
        {
          filename: imageName,
          content: imageBase64,
          encoding: 'base64',
          contentType: imageMimeType,
        }
      ],
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

// ==================== API ENDPOINT ====================

// POST endpoint to handle missing person found notifications
export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const lat = parseFloat(formData.get('lat') as string);
    const lon = parseFloat(formData.get('lon') as string);
    
    // Validate input
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image file is required' },
        { status: 400 }
      );
    }
    
    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { success: false, error: 'Valid latitude and longitude are required' },
        { status: 400 }
      );
    }
    
    // Validate coordinates
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
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
    
    console.log('🔍 Missing person found at:', lat, lon);
    
    // Use hardcoded organizations
    if (ORGANIZATIONS.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No organizations configured',
        notificationsSent: 0,
      });
    }
    
    console.log(`📊 Found ${ORGANIZATIONS.length} organizations`);
    
    // Get nearby organizations (40km radius)
    const nearbyOrganizations = getNearestOrganizations(lat, lon, ORGANIZATIONS, 40);
    
    if (nearbyOrganizations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No organizations found within 40km radius',
        notificationsSent: 0,
        searchRadius: 40,
      });
    }
    
    console.log(`📧 Sending notifications to ${nearbyOrganizations.length} organizations...`);
    
    // Send notifications with image
    const result = await sendNotifications(nearbyOrganizations, image, lat, lon);
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'All notifications sent successfully' 
        : `Sent ${result.sent} notifications, ${result.failed} failed`,
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