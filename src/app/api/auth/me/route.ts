import { NextResponse } from "next/server";
import { getServerSession, TOKEN_COOKIE_NAME } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatarUrl: true,
      ownerProfile: true,
      staffProfile: {
        include: {
          property: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      tenantProfile: {
        include: {
          currentBed: {
            include: {
              room: {
                include: {
                  property: true,
                },
              },
            },
          },
          allocations: {
            where: { isActive: true },
            take: 1,
            include: {
              bed: {
                include: {
                  room: {
                    include: {
                      property: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ user });
}
