import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/jwt";
import { Role } from "@/lib/constants";

// GET /api/user/kyc - get current user's KYC details & verification status
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === Role.PG_OWNER) {
      let owner = await prisma.ownerProfile.findUnique({
        where: { userId: session.userId },
        select: {
          id: true,
          companyName: true,
          panNumber: true,
          gstNumber: true,
          bankAccountNumber: true,
          bankIfscCode: true,
          bankAccountName: true,
          kycDocUrl: true,
          isKycVerified: true,
          rejectionReason: true,
        },
      });

      if (!owner) {
        owner = await prisma.ownerProfile.findUnique({
          where: { id: session.userId },
          select: {
            id: true,
            companyName: true,
            panNumber: true,
            gstNumber: true,
            bankAccountNumber: true,
            bankIfscCode: true,
            bankAccountName: true,
            kycDocUrl: true,
            isKycVerified: true,
            rejectionReason: true,
          },
        });
      }

      return NextResponse.json({
        role: session.role,
        profile: owner,
        status: owner?.isKycVerified
          ? "VERIFIED"
          : owner?.rejectionReason
          ? "REJECTED"
          : owner?.panNumber
          ? "PENDING_VERIFICATION"
          : "NOT_SUBMITTED",
      });
    }

    if (session.role === Role.CUSTOMER_TENANT) {
      let tenant = await prisma.tenantProfile.findUnique({
        where: { userId: session.userId },
        select: {
          id: true,
          emergencyContact: true,
          idProofType: true,
          idProofNumber: true,
          idProofDocumentUrl: true,
          isKycVerified: true,
          rejectionReason: true,
        },
      });

      if (!tenant) {
        tenant = await prisma.tenantProfile.findUnique({
          where: { id: session.userId },
          select: {
            id: true,
            emergencyContact: true,
            idProofType: true,
            idProofNumber: true,
            idProofDocumentUrl: true,
            isKycVerified: true,
            rejectionReason: true,
          },
        });
      }

      return NextResponse.json({
        role: session.role,
        profile: tenant,
        status: tenant?.isKycVerified
          ? "VERIFIED"
          : tenant?.rejectionReason
          ? "REJECTED"
          : tenant?.idProofNumber
          ? "PENDING_VERIFICATION"
          : "NOT_SUBMITTED",
      });
    }

    return NextResponse.json({
      role: session.role,
      status: "VERIFIED",
    });
  } catch (error) {
    console.error("Fetch user KYC status error:", error);
    return NextResponse.json({ error: "Failed to fetch KYC status" }, { status: 500 });
  }
}

// POST /api/user/kyc - submit/update KYC documents for verification
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (session.role === Role.PG_OWNER) {
      const {
        companyName,
        panNumber,
        gstNumber,
        bankAccountNumber,
        bankIfscCode,
        bankAccountName,
        kycDocUrl,
      } = body;

      if (!panNumber || !bankAccountNumber || !bankIfscCode) {
        return NextResponse.json(
          { error: "PAN number, bank account number and IFSC code are required for owner verification." },
          { status: 400 }
        );
      }

      let owner = await prisma.ownerProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!owner) {
        owner = await prisma.ownerProfile.findUnique({
          where: { id: session.userId },
        });
      }

      if (!owner) {
        return NextResponse.json({ error: "Owner profile not found" }, { status: 404 });
      }

      const updated = await prisma.ownerProfile.update({
        where: { id: owner.id },
        data: {
          companyName: companyName || undefined,
          panNumber,
          gstNumber: gstNumber || null,
          bankAccountNumber,
          bankIfscCode,
          bankAccountName: bankAccountName || null,
          kycDocUrl: kycDocUrl || null,
          isKycVerified: false, // Reset to false pending admin approval
          rejectionReason: null, // Clear any previous rejection
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: owner.userId,
          action: "OWNER_KYC_SUBMITTED",
          entityType: "OWNER_PROFILE",
          entityId: updated.id,
          metadata: JSON.stringify({ panNumber, bankAccountNumber: "***" }),
        },
      });

      return NextResponse.json({
        success: true,
        message: "KYC documents submitted successfully. Admin will review and verify your details.",
        profile: updated,
      });
    }

    if (session.role === Role.CUSTOMER_TENANT) {
      const {
        emergencyContact,
        idProofType,
        idProofNumber,
        idProofDocumentUrl,
      } = body;

      if (!idProofType || !idProofNumber) {
        return NextResponse.json(
          { error: "ID Proof Type (Aadhaar/PAN/Passport) and ID number are required." },
          { status: 400 }
        );
      }

      let tenant = await prisma.tenantProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!tenant) {
        tenant = await prisma.tenantProfile.findUnique({
          where: { id: session.userId },
        });
      }

      if (!tenant) {
        return NextResponse.json({ error: "Tenant profile not found" }, { status: 404 });
      }

      const updated = await prisma.tenantProfile.update({
        where: { id: tenant.id },
        data: {
          emergencyContact: emergencyContact || undefined,
          idProofType,
          idProofNumber,
          idProofDocumentUrl: idProofDocumentUrl || null,
          isKycVerified: false, // Reset to false pending admin approval
          rejectionReason: null, // Clear any previous rejection
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: tenant.userId,
          action: "TENANT_KYC_SUBMITTED",
          entityType: "TENANT_PROFILE",
          entityId: updated.id,
          metadata: JSON.stringify({ idProofType, idProofNumber: "***" }),
        },
      });

      return NextResponse.json({
        success: true,
        message: "KYC documents submitted successfully. Admin will verify before final check-in.",
        profile: updated,
      });
    }

    return NextResponse.json({ error: "Only owners and tenants can submit KYC" }, { status: 400 });
  } catch (error) {
    console.error("Submit user KYC error:", error);
    return NextResponse.json({ error: "Failed to submit KYC details" }, { status: 500 });
  }
}
