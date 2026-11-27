import { Role } from "@/lib/constants";
import { getServerSession, JWTPayload } from "./jwt";
import { NextResponse } from "next/server";

export async function requireAuth(
  allowedRoles?: Role[],
  requiredPermission?: string
): Promise<{ user: JWTPayload } | { errorResponse: NextResponse }> {
  const session = await getServerSession();

  if (!session) {
    return {
      errorResponse: NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      ),
    };
  }

  // Super Admin has full platform access
  if (session.role === Role.SUPER_ADMIN) {
    return { user: session };
  }

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0) {
    // If PG_OWNER is allowed, PG_STAFF might also be allowed if permission matches or role is listed
    if (!allowedRoles.includes(session.role)) {
      return {
        errorResponse: NextResponse.json(
          { error: "Forbidden: You do not have permission to access this resource." },
          { status: 403 }
        ),
      };
    }
  }

  // If PG_STAFF, check granular permission if provided
  if (session.role === Role.PG_STAFF && requiredPermission) {
    const perms = session.permissions || [];
    if (!perms.includes(requiredPermission)) {
      return {
        errorResponse: NextResponse.json(
          { error: `Forbidden: Missing required staff permission: ${requiredPermission}` },
          { status: 403 }
        ),
      };
    }
  }

  return { user: session };
}
