import { NextResponse } from "next/server";
import { getLiveRiskData } from "@/lib/live-data";
import { logger } from "@/app/utils/logger";

export const revalidate = 120;

export async function GET() {
  logger.debug("api/live", "Incoming request");
  const data = await getLiveRiskData();
  logger.info("api/live", "Returning live payload", { fetchedAtIso: data.fetchedAtIso, topRiskCity: data.metrics.topRiskCity });
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "s-maxage=120, stale-while-revalidate=240",
    },
  });
}
