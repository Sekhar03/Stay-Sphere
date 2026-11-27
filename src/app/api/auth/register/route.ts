export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth/jwt";
import { Role, PropertyVerificationStatus } from "@/lib/constants";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await enforceRateLimit(req, "auth:register", 10, 60);
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists by email or phone
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email.toLowerCase().trim() },
          ...(validatedData.phone ? [{ phone: validatedData.phone.trim() }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email or phone number already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(validatedData.password);
    const role = validatedData.role as Role;

    // Create user and all KYC/property details atomically in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // User is created with isActive: false (pending admin approval)
      const user = await tx.user.create({
        data: {
          name: validatedData.name.trim(),
          email: validatedData.email.toLowerCase().trim(),
          phone: validatedData.phone?.trim() || null,
          passwordHash,
          role,
          isActive: false, // Inactive until admin approves
        },
      });

      if (role === Role.PG_OWNER) {
        // Create Owner KYC Profile
        const ownerProfile = await tx.ownerProfile.create({
          data: {
            userId: user.id,
            companyName:
              validatedData.companyName?.trim() ||
              validatedData.propertyName?.trim() ||
              `${validatedData.name}'s Living`,
            panNumber: validatedData.panNumber?.trim().toUpperCase() || null,
            gstNumber: validatedData.gstNumber?.trim().toUpperCase() || null,
            bankAccountName: validatedData.bankAccountName?.trim() || validatedData.name.trim(),
            bankAccountNumber: validatedData.bankAccountNumber?.trim() || null,
            bankIfscCode: validatedData.bankIfscCode?.trim().toUpperCase() || null,
            kycDocUrl:
              validatedData.kycDocUrl?.trim() ||
              validatedData.propertyDocUrl?.trim() ||
              null,
            isKycVerified: false,
          },
        });

        // If rent home property details were provided during owner signup, create the property
        const propertyName =
          validatedData.propertyName?.trim() ||
          validatedData.companyName?.trim() ||
          `${validatedData.name}'s PG`;

        const baseSlug = propertyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        const slug = `${baseSlug || "stay"}-${Math.random().toString(36).substring(2, 7)}`;

        const images =
          Array.isArray(validatedData.images) && validatedData.images.length > 0
            ? validatedData.images.filter((img) => typeof img === "string" && img.trim().length > 0)
            : [
                "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
              ];

        const property = await tx.pGProperty.create({
          data: {
            ownerId: ownerProfile.id,
            slug,
            name: propertyName,
            description:
              validatedData.propertyDescription?.trim() ||
              `Spacious and premium ${validatedData.propertyType || "PG"} accommodation managed by ${validatedData.name}. Fully equipped with modern amenities and verified facilities.`,
            propertyType: validatedData.propertyType || "PG",
            genderPreference: validatedData.genderPreference || "COED",
            foodOption: validatedData.foodOption || "THREE_MEALS",
            menuItems: JSON.stringify(validatedData.menuItems || {}),
            noticePeriodDays: validatedData.noticePeriodDays || 30,
            gateClosingTime: validatedData.gateClosingTime || "22:30",
            rules: JSON.stringify([
              "No smoking inside rooms",
              "Visitors allowed in common lounge till 9 PM",
              "Maintain quiet hours after 10 PM",
            ]),
            startingRent: validatedData.startingRent || 7500,
            securityDeposit: validatedData.securityDeposit || 10000,
            maintenanceCharges: validatedData.maintenanceCharges || 0,
            electricityCharges: validatedData.electricityCharges || "As per sub-meter consumption",
            isPublished: false, // Not published until admin approves
            verificationStatus: PropertyVerificationStatus.PENDING_VERIFICATION,
            address: {
              create: {
                addressLine1:
                  validatedData.addressLine1?.trim() || "Main Road, Near Tech Park",
                addressLine2: validatedData.addressLine2?.trim() || null,
                landmark: validatedData.landmark?.trim() || null,
                locality: validatedData.locality?.trim() || "Koramangala",
                area: validatedData.area?.trim() || validatedData.locality?.trim() || "City Center",
                city: validatedData.city?.trim() || "Bangalore",
                state: validatedData.state?.trim() || "Karnataka",
                pincode: validatedData.pincode?.trim() || "560034",
                latitude: validatedData.latitude || 12.9352,
                longitude: validatedData.longitude || 77.6245,
              },
            },
            media: {
              create: images.map((url, idx) => ({
                url,
                isCover: idx === 0,
                sortOrder: idx,
                caption: idx === 0 ? "Cover Photo" : `Property Photo ${idx + 1}`,
              })),
            },
          },
        });

        // Link amenities if provided
        if (Array.isArray(validatedData.amenityIds) && validatedData.amenityIds.length > 0) {
          // Find valid amenity IDs in DB
          const validAmenities = await tx.amenity.findMany({
            where: { id: { in: validatedData.amenityIds } },
            select: { id: true },
          });

          if (validAmenities.length > 0) {
            await tx.propertyAmenity.createMany({
              data: validAmenities.map((a) => ({
                propertyId: property.id,
                amenityId: a.id,
              })),
            });
          }
        } else {
          // Attach first 4-6 amenities as standard default facilities
          const standardAmenities = await tx.amenity.findMany({ take: 6, select: { id: true } });
          if (standardAmenities.length > 0) {
            await tx.propertyAmenity.createMany({
              data: standardAmenities.map((a) => ({
                propertyId: property.id,
                amenityId: a.id,
              })),
            });
          }
        }

        // Create rooms & beds configured during owner signup
        const configuredRooms =
          Array.isArray(validatedData.rooms) && validatedData.rooms.length > 0
            ? validatedData.rooms
            : [
                {
                  roomNumber: "101",
                  floorNumber: 1,
                  sharingType: "DOUBLE" as const,
                  bedCount: 2,
                  monthlyRent: validatedData.startingRent || 7500,
                  securityDeposit: validatedData.securityDeposit || 10000,
                  hasAttachedBath: true,
                  hasBalcony: false,
                  hasAirCondition: true,
                },
              ];

        const bedLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (const roomConfig of configuredRooms) {
          const createdRoom = await tx.room.create({
            data: {
              propertyId: property.id,
              roomNumber: roomConfig.roomNumber.trim(),
              floorNumber: Number(roomConfig.floorNumber) || 0,
              sharingType: roomConfig.sharingType || "DOUBLE",
              monthlyRent: Number(roomConfig.monthlyRent) || validatedData.startingRent || 7500,
              securityDeposit:
                Number(roomConfig.securityDeposit) ?? validatedData.securityDeposit ?? 10000,
              hasAttachedBath: Boolean(roomConfig.hasAttachedBath),
              hasBalcony: Boolean(roomConfig.hasBalcony),
              hasAirCondition: Boolean(roomConfig.hasAirCondition),
            },
          });

          const bedCount = Math.max(1, Number(roomConfig.bedCount) || 1);
          const bedsToCreate = Array.from({ length: bedCount }).map((_, bIdx) => ({
            roomId: createdRoom.id,
            bedNumber: bIdx < 26 ? bedLetters[bIdx] : `B${bIdx + 1}`,
            status: "AVAILABLE",
          }));

          await tx.bed.createMany({
            data: bedsToCreate,
          });
        }
      } else {
        // Customer / Tenant KYC Profile
        const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
        await tx.tenantProfile.create({
          data: {
            userId: user.id,
            emergencyContact: validatedData.emergencyContact?.trim() || null,
            idProofType: validatedData.idProofType?.trim() || "Aadhaar Card",
            idProofNumber: validatedData.idProofNumber?.trim() || null,
            idProofDocumentUrl: validatedData.idProofDocumentUrl?.trim() || null,
            isKycVerified: false,
            kycStatus: "PENDING",
            tcAcceptedAt: validatedData.tcAccepted ? new Date() : null,
            tcAcceptedIp: validatedData.tcAccepted ? clientIp : null,
            tcVersion: validatedData.tcAccepted ? (validatedData.tcVersion || "v1.0-2026") : null,
          },
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_REGISTERED_PENDING_APPROVAL",
          entityType: "USER",
          entityId: user.id,
          metadata: JSON.stringify({
            role: user.role,
            email: user.email,
            name: user.name,
            pendingApproval: true,
          }),
        },
      });

      return user;
    });

    // NOTE: We deliberately DO NOT issue an auth session token or cookie here!
    // The account remains inactive until approved by an administrator.
    // Upon admin approval, the user's login details will be sent to their email.

    return NextResponse.json(
      {
        success: true,
        pendingApproval: true,
        message:
          "Account and KYC details submitted successfully. Your profile is currently under administrator review. Once verified and approved, your login credentials will be sent directly to your registered email address.",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isActive: false,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.errors) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to submit registration. Please verify your details." },
      { status: 500 }
    );
  }
}
