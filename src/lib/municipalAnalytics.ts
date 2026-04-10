// src/lib/municipalAnalytics.ts
import {
  AMENITY_CONFIG,
  URDPFI_GREEN_COVER_SQM_PER_PERSON,
  ROAD_CAPACITY_PCU_PER_LANE_HR,
  TRIPS_PER_PERSON_PER_DAY,
  PEAK_HOUR_TRAFFIC_RATIO,
  getBlockAreaSqm
} from "./planningMath";
import type { RoadSegment } from "@/lib/algorithms";

export function calculateEnvironmentalImpact(
  population: number,
  parkCount: number,
  blockSizeMeters: number
) {
  const blockAreaSqm = getBlockAreaSqm(blockSizeMeters);
  const totalParkAreaSqm = parkCount * blockAreaSqm;
  const requiredGreenCoverSqm = population * URDPFI_GREEN_COVER_SQM_PER_PERSON;

  const deficitSqm = requiredGreenCoverSqm - totalParkAreaSqm;
  const metrics = {
    providedSqmPerPerson: population > 0 ? totalParkAreaSqm / population : 0,
    requiredSqmPerPerson: URDPFI_GREEN_COVER_SQM_PER_PERSON,
    totalAreaSqm: totalParkAreaSqm,
    requiredAreaSqm: requiredGreenCoverSqm,
    deficitSqm: Math.max(0, deficitSqm),
    surplusSqm: Math.max(0, -deficitSqm),
    status: deficitSqm > 0 ? 'Deficit' : 'Surplus',
    score: Math.min(10, Math.max(0, (totalParkAreaSqm / requiredGreenCoverSqm) * 10))
  };
  return metrics;
}

export function calculateBudgetForecast(amenityActualCounts: Record<string, number>) {
  let totalCapExCr = 0;
  let totalOpExCr = 0;

  const amenityBreakdown: Array<{ name: string, count: number, capexCr: number, opexCr: number }> = [];

  Object.entries(amenityActualCounts).forEach(([id, count]) => {
    const config = AMENITY_CONFIG[id as keyof typeof AMENITY_CONFIG];
    if (!config) return;
    const itemCapEx = (config.capexCr || 0) * count;
    const itemOpEx = (config.opexCr || 0) * count;
    totalCapExCr += itemCapEx;
    totalOpExCr += itemOpEx;

    amenityBreakdown.push({ name: config.name, count, capexCr: itemCapEx, opexCr: itemOpEx });
  });

  return {
    totalCapExCr,
    totalOpExCr,
    amenityBreakdown
  };
}

export function calculateTrafficLoad(population: number, roadNetwork: Record<string, RoadSegment>) {
  const totalDailyTrips = population * TRIPS_PER_PERSON_PER_DAY;
  const peakHourTrips = totalDailyTrips * PEAK_HOUR_TRAFFIC_RATIO;

  let networkCapacityPCU = 0;
  Object.values(roadNetwork).forEach(road => {
    const capacityPerLane = ROAD_CAPACITY_PCU_PER_LANE_HR[road.roadClass as keyof typeof ROAD_CAPACITY_PCU_PER_LANE_HR] || ROAD_CAPACITY_PCU_PER_LANE_HR.local;
    networkCapacityPCU += road.laneCount * capacityPerLane;
  });

  // V/C Ratio (Volume / Capacity)
  // Assuming trips distribute roughly across available arteries
  const avgVCRatio = networkCapacityPCU > 0 ? (peakHourTrips / networkCapacityPCU) : 0;

  let status = "Smooth";
  if (avgVCRatio > 0.85) status = "Congested";
  else if (avgVCRatio > 0.6) status = "Moderate";

  return {
    dailyTrips: totalDailyTrips,
    peakHourTrips,
    networkCapacityPCU,
    avgVCRatio,
    status
  };
}
