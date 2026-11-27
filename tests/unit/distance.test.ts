import { describe, it, expect } from "vitest";
import { calculateRouteDistance } from "@/lib/maps/googleMaps";

describe("Distance & Commute Calculator Logic", () => {
  it("should calculate realistic driving distance and commute duration between two coordinates", async () => {
    // Koramangala 5th Block (12.9352, 77.6245) to Electronic City Phase 1 (12.8452, 77.6602) (~14-16 km)
    const result = await calculateRouteDistance(12.9352, 77.6245, 12.8452, 77.6602, "driving");

    expect(result).toBeDefined();
    expect(result.distanceKm).toBeGreaterThan(10);
    expect(result.distanceKm).toBeLessThan(25);
    expect(result.durationMinutes).toBeGreaterThan(15);
    expect(result.distanceText).toContain("km");
  });

  it("should estimate walking duration proportionally longer than driving", async () => {
    // Indiranagar 100ft Rd to Sony World Junction Koramangala (~5 km)
    const driving = await calculateRouteDistance(12.9719, 77.6412, 12.9352, 77.6245, "driving");
    const walking = await calculateRouteDistance(12.9719, 77.6412, 12.9352, 77.6245, "walking");

    expect(walking.distanceKm).toBeGreaterThan(3);
    expect(walking.durationMinutes).toBeGreaterThan(driving.durationMinutes);
  });
});
