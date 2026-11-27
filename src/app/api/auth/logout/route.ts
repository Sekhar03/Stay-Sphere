export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { TOKEN_COOKIE_NAME } from "@/lib/auth/jwt";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out successfully" });
  res.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: "",
    path: "/",
    expires: new Date(0),
  });
  return res;
}
