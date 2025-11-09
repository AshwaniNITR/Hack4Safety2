import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// ==================== TYPES ====================

interface PersonFoundRequest {
  email: string;
}

// ==================== HELPER FUNCTIONS ====================

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
 * Sends "Person Found" alert email to the provided recipient.
 */
async function sendPersonFoundAlert(
  recipientEmail: string
): Promise<{ success: boolean; sent: number; failed: number }> {
  const transporter = createEmailTransporter();
  let sent = 0;
  let failed = 0;

  const mailOptions = {
    from: `Official Notification <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: `NOTIFICATION: Person Found`,
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
              This is an official alert to inform you that a person has been found.
            </p>
            <p class="info-text">
              Please check with local authorities for further details and verification.
            </p>
            <p class="info-text">
              Contact the relevant department if this matches any ongoing reports.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>Official Coordination System</strong></p>
            <p>This is an automated alert sent to: ${recipientEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
═══════════════════════════════════════════
i OFFICIAL NOTIFICATION: PERSON FOUND
═══════════════════════════════════════════

This is an official alert to inform you that a person has been found.

Please check with local authorities for further details and verification.

Contact the relevant department if this matches any ongoing reports.

═══════════════════════════════════════════
Official Coordination System - Automated Alert
(Recipient: ${recipientEmail})
═══════════════════════════════════════════
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    sent++;
    console.log(`✓ Person Found Alert sent to ${recipientEmail}`);
  } catch (error) {
    failed++;
    console.error(`✗ Failed to send Person Found Alert to ${recipientEmail}:`, error);
  }

  return { success: failed === 0, sent, failed };
}

// ==================== API ENDPOINT ====================

/**
 * API route handler for POST /api/report-person-found
 * Receives an email in the request body and sends a notification to it.
 */
export async function POST(request: NextRequest) {
  try {
    // === 1. Validate Input ===
    const body: PersonFoundRequest = await request.json();
    
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required in the request body.' },
        { status: 400 }
      );
    }
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('Email configuration missing. Set SMTP_USER and SMTP_PASSWORD.');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Email service not set up.' },
        { status: 500 }
      );
    }
    
    console.log(`ℹ️ New person found report for email: ${body.email}`);
    
    // === 2. Send Notification ===
    const result = await sendPersonFoundAlert(body.email);
    
    console.log(`Email sending complete: ${result.sent} sent, ${result.failed} failed.`);
    
    // === 3. Return Final Response ===
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Alert sent successfully' 
        : `Sent ${result.sent} alert, ${result.failed} failed`,
      notificationsSent: result.sent,
      notificationsFailed: result.failed,
    }, { status: result.success ? 200 : 207 });
    
  } catch (error) {
    console.error('❌ Error processing person found report:', error);
    
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