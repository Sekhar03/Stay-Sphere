import nodemailer from "nodemailer";
import prisma from "@/lib/db/prisma";

const smtpHost = process.env.SMTP_HOST || "smtp.resend.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
const smtpUser = process.env.SMTP_USER || "resend";
const smtpPass = process.env.SMTP_PASS || "";
const fromAddress = process.env.EMAIL_FROM || "StaySphere <no-reply@staysphere.in>";

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  template: string;
  rentScheduleId?: string;
}

export async function sendEmail({ to, subject, html, template, rentScheduleId }: EmailOptions) {
  try {
    // If SMTP pass is not configured, simulate delivery and log to DB
    if (!smtpPass || smtpPass.includes("dummy")) {
      console.log(`[Email Simulation] To: ${to} | Subject: ${subject} | Template: ${template}`);
      await prisma.emailLog.create({
        data: {
          recipientEmail: to,
          template,
          subject,
          rentScheduleId,
          status: "SENT_SIMULATED",
        },
      });
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    await prisma.emailLog.create({
      data: {
        recipientEmail: to,
        template,
        subject,
        rentScheduleId,
        status: "SENT",
      },
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorDetails = error instanceof Error ? error.message : "Unknown error";
    console.error("Email delivery failed:", errorDetails);

    await prisma.emailLog.create({
      data: {
        recipientEmail: to,
        template,
        subject,
        rentScheduleId,
        status: "FAILED",
        errorDetails,
      },
    });

    return { success: false, error: errorDetails };
  }
}

// -----------------------------------------------------------------
// Professional HTML Email Templates
// -----------------------------------------------------------------

export function getRentReminderTemplate(params: {
  tenantName: string;
  propertyName: string;
  roomNumber: string;
  amount: number;
  dueDate: string;
  status: "UPCOMING" | "DUE_TODAY" | "OVERDUE";
  payUrl: string;
}) {
  const { tenantName, propertyName, roomNumber, amount, dueDate, status, payUrl } = params;

  let headerColor = "#2563eb"; // Blue
  let alertText = "Upcoming Monthly Rent Reminder";

  if (status === "DUE_TODAY") {
    headerColor = "#d97706"; // Amber
    alertText = "Rent Due Today";
  } else if (status === "OVERDUE") {
    headerColor = "#dc2626"; // Red
    alertText = "Urgent: Rent Payment Overdue";
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: ${headerColor}; padding: 30px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 700; }
        .body { padding: 32px 24px; }
        .details-box { background: #f1f5f9; border-radius: 8px; padding: 18px; margin: 24px 0; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 15px; }
        .btn { display: block; width: 220px; margin: 28px auto 0; background: #2563eb; color: #ffffff !important; text-align: center; padding: 14px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
        .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 20px 24px; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>StaySphere</h1>
          <p style="margin: 0; opacity: 0.9;">${alertText}</p>
        </div>
        <div class="body">
          <p>Hi <strong>${tenantName}</strong>,</p>
          <p>This is a notification regarding your monthly accommodation dues for <strong>${propertyName}</strong> (Room: ${roomNumber}).</p>
          
          <div class="details-box">
            <div class="row"><span>Due Date:</span> <strong>${dueDate}</strong></div>
            <div class="row"><span>Total Payable:</span> <strong style="color: #2563eb; font-size: 18px;">₹${amount.toLocaleString("en-IN")}</strong></div>
          </div>

          <p>To avoid any late fees or disruptions to your amenities, please complete your payment online via Razorpay using the link below:</p>
          
          <a href="${payUrl}" class="btn">Pay Rent Online</a>
        </div>
        <div class="footer">
          StaySphere Automated Billing Engine • Secured by UPI Gateway & SSL<br />
          If you have already paid this bill offline, please notify your PG manager.
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getBookingConfirmationTemplate(params: {
  tenantName: string;
  propertyName: string;
  bookingRef: string;
  checkInDate: string;
  amountPaid: number;
  roomDetails: string;
}) {
  const { tenantName, propertyName, bookingRef, checkInDate, amountPaid, roomDetails } = params;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: #059669; padding: 30px 24px; text-align: center; color: #ffffff; }
        .body { padding: 32px 24px; }
        .details-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin: 24px 0; }
        .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 20px 24px; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 style="margin: 0;">StaySphere</h1>
          <p style="margin: 6px 0 0; opacity: 0.95;">Booking Confirmed 🎉</p>
        </div>
        <div class="body">
          <p>Congratulations <strong>${tenantName}</strong>,</p>
          <p>Your stay at <strong>${propertyName}</strong> is confirmed. Here are your booking details:</p>
          <div class="details-box">
            <p style="margin: 4px 0;"><strong>Booking Ref:</strong> ${bookingRef}</p>
            <p style="margin: 4px 0;"><strong>Room:</strong> ${roomDetails}</p>
            <p style="margin: 4px 0;"><strong>Check-in Date:</strong> ${checkInDate}</p>
            <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${amountPaid.toLocaleString("en-IN")}</p>
          </div>
          <p>Please remember to bring your government ID proof for check-in verification.</p>
        </div>
        <div class="footer">
          StaySphere India • Discover, Tour in 3D & Book Verified PGs
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getAccountApprovalTemplate(params: {
  userName: string;
  userEmail: string;
  role: string;
  loginUrl: string;
  propertyName?: string;
  temporaryPassword?: string;
}) {
  const { userName, userEmail, role, loginUrl, propertyName, temporaryPassword } = params;
  const isOwner = role === "PG_OWNER";
  const roleName = isOwner ? "PG Property Owner & Host" : "StaySphere Resident";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 36px 28px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .badge { display: inline-block; margin-top: 10px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: 600; }
        .body { padding: 32px 28px; font-size: 15px; line-height: 1.6; }
        .welcome { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .credentials-box { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .cred-row:last-child { border-bottom: none; }
        .cred-label { color: #64748b; font-weight: 500; }
        .cred-value { font-weight: 700; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .btn { display: block; text-align: center; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 16px; margin: 28px auto 0; max-width: 260px; box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
        .notice { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #1e40af; margin-top: 20px; }
        .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 24px; border-top: 1px solid #f1f5f9; background: #fafafa; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>StaySphere</h1>
          <div class="badge">Account Approved & Verified</div>
        </div>
        <div class="body">
          <div class="welcome">Welcome aboard, ${userName}!</div>
          <p>
            Great news! Your account registration and KYC documentation have been reviewed and <strong>approved by the administrator</strong>. 
            ${propertyName ? `Your listing for <strong>${propertyName}</strong> is now cleared and published!` : "You now have full verified access to our platform."}
          </p>

          <div class="credentials-box">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
              Your Account Login Details
            </div>
            <div class="cred-row">
              <span class="cred-label">Registered Email:</span>
              <span class="cred-value">${userEmail}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Account Role:</span>
              <span class="cred-value" style="color: #2563eb;">${roleName}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Verification Status:</span>
              <span class="cred-value" style="color: #059669;">APPROVED & ACTIVE</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Password:</span>
              <span class="cred-value">${temporaryPassword || "Your password created during registration"}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Portal Sign-in:</span>
              <span class="cred-value"><a href="${loginUrl}" style="color: #2563eb; text-decoration: none;">${loginUrl}</a></span>
            </div>
          </div>

          <p style="font-size: 14px; color: #475569;">
            ${isOwner 
              ? "You can now log in to your <strong>Owner Portal</strong> to manage room inventory, view site visit appointments, track tenant rent dues, and manage automated payouts."
              : "You can now log in to your <strong>Resident Dashboard</strong> to browse verified stays, book beds with instant digital agreements, and pay monthly rent online."
            }
          </p>

          <a href="${loginUrl}" class="btn">Sign In to Your Account</a>

          <div class="notice">
            🔒 <strong>Security Tip:</strong> Keep your login credentials confidential. You can update your password anytime under your Account Settings.
          </div>
        </div>
        <div class="footer">
          StaySphere Support Team • Questions? Email us at support@staysphere.in<br />
          StaySphere Technologies Pvt. Ltd.
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getAccountRejectionTemplate(params: {
  userName: string;
  userEmail: string;
  rejectionReason: string;
  supportEmail?: string;
}) {
  const { userName, userEmail, rejectionReason, supportEmail = "support@staysphere.in" } = params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: #dc2626; padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .body { padding: 32px 24px; font-size: 15px; line-height: 1.6; }
        .box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 18px; margin: 20px 0; color: #991b1b; }
        .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 20px 24px; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>StaySphere</h1>
          <p style="margin: 6px 0 0; opacity: 0.95;">Account Application Status Update</p>
        </div>
        <div class="body">
          <p>Dear <strong>${userName}</strong>,</p>
          <p>Thank you for submitting your account and KYC details for verification on StaySphere.</p>
          <p>Upon reviewing your submitted documentation, our administrative team was unable to approve your application at this time.</p>
          
          <div class="box">
            <strong>Reason for Action:</strong>
            <p style="margin: 8px 0 0;">${rejectionReason}</p>
          </div>

          <p>If you believe this is in error or if you have revised KYC / property documentation to submit, please reply directly to this email or contact support at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
        </div>
        <div class="footer">
          StaySphere Verification & Compliance Desk
        </div>
      </div>
    </body>
    </html>
  `;
}
