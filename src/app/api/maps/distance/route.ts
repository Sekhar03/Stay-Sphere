import { NextRequest, NextResponse } from "next/server";
import { calculateDistanceSchema } from "@/lib/validators";
import { calculateRouteDistance } from "@/lib/maps/googleMaps";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = calculateDistanceSchema.parse(body);

    const result = await calculateRouteDistance(
      data.originLat,
      data.originLng,
      data.destLat,
      data.destLng,
      data.mode
    );

    return NextResponse.json({
      success: true,
      data: result,
      googleMapsNavigationUrl: `https://www.google.com/maps/dir/?api=1&origin=${data.originLat},${data.originLng}&destination=${data.destLat},${data.destLng}&travelmode=${data.mode}`,
    });
  } catch (error: any) {
    if (error?.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Distance calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate distance" }, { status: 500 });
  }
}
