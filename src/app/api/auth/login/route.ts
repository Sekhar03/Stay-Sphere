import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validators";
import { comparePassword, signToken, TOKEN_COOKIE_NAME } from "@/lib/auth/jwt";
import { Role } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = loginSchema.parse(body);
    const identifier = validatedData.email.trim();
    const isPhone = !identifier.includes("@");
    const digits = identifier.replace(/\D/g, "");

    const user = await prisma.user.findFirst({
      where: isPhone
        ? {
            OR: [
              { phone: identifier },
              { phone: digits },
              { phone: `+91${digits.slice(-10)}` },
              { phone: digits.slice(-10) },
              { email: `${digits}@staysphere.in` },
            ],
          }
        : { email: identifier.toLowerCase() },
      include: {
        ownerProfile: true,
        tenantProfile: true,
        staffProfile: {
          include: {
            property: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(validatedData.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    // Check if account has been approved by administrator
    if (!user.isActive) {
      const rejectionReason =
        user.ownerProfile?.rejectionReason || user.tenantProfile?.rejectionReason;

      if (rejectionReason) {
        return NextResponse.json(
          {
            error: `Your account application was not approved by admin: "${rejectionReason}". Please contact support@staysphere.in.`,
            status: "REJECTED",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Your account is pending verification and approval by the administrator. Once approved, your login confirmation and details will be sent to your registered email.",
          status: "PENDING_APPROVAL",
        },
        { status: 403 }
      );
    }

    let permissions: string[] = [];
    if (user.staffProfile?.permissions) {
      try {
        permissions = JSON.parse(user.staffProfile.permissions);
      } catch {
        permissions = [];
      }
    }

    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      ownerId: user.ownerProfile?.id || user.staffProfile?.ownerId || undefined,
      propertyId: user.staffProfile?.propertyId || undefined,
      staffRole: user.staffProfile?.staffRole,
      permissions,
    };

    const token = signToken(payload);

    let redirectUrl = "/dashboard";
    if (user.role === Role.SUPER_ADMIN) {
      redirectUrl = "/admin";
    } else if (user.role === Role.PG_OWNER) {
      redirectUrl = "/owner/dashboard";
    } else if (user.role === Role.PG_STAFF) {
      redirectUrl = "/staff/dashboard";
    }

    // Record login audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_LOGIN",
          entityType: "USER",
          entityId: user.id,
          metadata: JSON.stringify({ role: user.role, email: user.email }),
        },
      });
    } catch (auditErr) {
      // Non-blocking audit failure
      console.warn("Audit logging failed on login:", auditErr);
    }

    const res = NextResponse.json({
      message: "Signed in successfully",
      redirectUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffRole: user.staffProfile?.staffRole,
        property: user.staffProfile?.property,
      },
    });

    res.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    if (error?.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
