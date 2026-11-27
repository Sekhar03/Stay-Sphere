/**
 * Google Maps Routes & Distance Matrix calculation service
 */

interface DistanceCalculationResult {
  distanceKm: number;
  durationMinutes: number;
  durationText: string;
  distanceText: string;
  source: "GOOGLE_MAPS_API" | "ROUTING_FALLBACK";
}

/**
 * Calculates road route distance and travel duration between two coordinates
 */
export async function calculateRouteDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: "driving" | "walking" | "transit" | "bicycling" = "driving"
): Promise<DistanceCalculationResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (apiKey && !apiKey.includes("ReplaceWithYours")) {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=${mode}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.rows?.[0]?.elements?.[0]?.status === "OK") {
        const element = data.rows[0].elements[0];
        const meters = element.distance.value;
        const seconds = element.duration.value;

        return {
          distanceKm: parseFloat((meters / 1000).toFixed(1)),
          durationMinutes: Math.ceil(seconds / 60),
          distanceText: element.distance.text,
          durationText: element.duration.text,
          source: "GOOGLE_MAPS_API",
        };
      }
    } catch (err) {
      console.warn("Google Maps Distance Matrix call failed, falling back to road network estimate:", err);
    }
  }

  // Realistic Indian urban road tortuosity factor (1.28x line of sight) & average urban speed
  const dLat = (destLat - originLat) * (Math.PI / 180);
  const dLng = (destLng - originLng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(originLat * (Math.PI / 180)) *
      Math.cos(destLat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const earthRadiusKm = 6371;
  const straightLineDistance = earthRadiusKm * c;

  // Road factor
  const roadDistanceKm = parseFloat((straightLineDistance * 1.28).toFixed(1));
  const avgSpeedKmh = mode === "walking" ? 4.5 : mode === "bicycling" ? 12 : 28; // 28 km/h typical city driving
  const durationMinutes = Math.max(1, Math.ceil((roadDistanceKm / avgSpeedKmh) * 60));

  return {
    distanceKm: roadDistanceKm,
    durationMinutes,
    distanceText: `${roadDistanceKm} km`,
    durationText: `${durationMinutes} mins`,
    source: "ROUTING_FALLBACK",
  };
}
