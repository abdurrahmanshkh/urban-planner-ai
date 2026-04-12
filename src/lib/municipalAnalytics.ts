// src/lib/municipalAnalytics.ts
// All calculations aligned with URDPFI 2014, IRC, CPHEEO, and HCM LOS standards.

import {
  AMENITY_CONFIG,
  URDPFI_GREEN_COVER_SQM_PER_PERSON,
  ROAD_CAPACITY_PCU_PER_LANE_HR,
  TRIPS_PER_PERSON_PER_DAY,
  PEAK_HOUR_TRAFFIC_RATIO,
  WATER_DEMAND_LPCD,
  WASTEWATER_GENERATION_RATIO,
  getBlockAreaSqm
} from "./planningMath";
import type { RoadSegment } from "@/lib/algorithms";

// ─── Environmental Impact (URDPFI Green Cover Standard) ─────────────────────

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
    score: Math.min(10, Math.max(0, (totalParkAreaSqm / Math.max(1, requiredGreenCoverSqm)) * 10))
  };
  return metrics;
}

// ─── Budget Forecast (CapEx / OpEx) ─────────────────────────────────────────

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

// ─── Traffic Load Analysis (IRC / HCM LOS Standards) ────────────────────────

export type TrafficLOS = 'Free Flow (LOS A-B)' | 'Stable Flow (LOS C)' | 'Near Capacity (LOS D)' | 'At Capacity (LOS E)' | 'Oversaturated (LOS F)';

function classifyLOS(vcRatio: number): TrafficLOS {
  if (vcRatio <= 0.4) return 'Free Flow (LOS A-B)';
  if (vcRatio <= 0.6) return 'Stable Flow (LOS C)';
  if (vcRatio <= 0.8) return 'Near Capacity (LOS D)';
  if (vcRatio <= 1.0) return 'At Capacity (LOS E)';
  return 'Oversaturated (LOS F)';
}

export function calculateTrafficLoad(population: number, roadNetwork: Record<string, RoadSegment>) {
  const totalDailyTrips = population * TRIPS_PER_PERSON_PER_DAY;
  const peakHourTrips = totalDailyTrips * PEAK_HOUR_TRAFFIC_RATIO;

  // Group road segments by their lineKey (each line = one road corridor)
  const corridors = new Map<string, RoadSegment[]>();
  Object.values(roadNetwork).forEach(road => {
    const segments = corridors.get(road.lineKey) || [];
    segments.push(road);
    corridors.set(road.lineKey, segments);
  });

  const numCorridors = corridors.size;
  if (numCorridors === 0) {
    return {
      dailyTrips: totalDailyTrips,
      peakHourTrips,
      networkCapacityPCU: 0,
      avgVCRatio: 0,
      worstVCRatio: 0,
      status: 'Free Flow (LOS A-B)' as TrafficLOS,
      numCorridors: 0,
    };
  }

  // Calculate per-corridor V/C ratio
  // Assume trips distribute roughly evenly across available corridors
  const tripsPerCorridor = peakHourTrips / numCorridors;

  let totalNetworkCapacity = 0;
  let worstVCRatio = 0;
  let sumVCRatios = 0;

  corridors.forEach((segments) => {
    // A corridor's capacity is determined by its weakest (most constrained) segment
    // since traffic must pass through all segments along a route
    const minCapacity = Math.min(
      ...segments.map(seg => {
        const capacityPerLane = ROAD_CAPACITY_PCU_PER_LANE_HR[
          seg.roadClass as keyof typeof ROAD_CAPACITY_PCU_PER_LANE_HR
        ] || ROAD_CAPACITY_PCU_PER_LANE_HR.local;
        return seg.laneCount * capacityPerLane;
      })
    );

    totalNetworkCapacity += minCapacity;
    const corridorVC = tripsPerCorridor / Math.max(1, minCapacity);
    sumVCRatios += corridorVC;
    worstVCRatio = Math.max(worstVCRatio, corridorVC);
  });

  const avgVCRatio = sumVCRatios / numCorridors;
  const status = classifyLOS(avgVCRatio);

  return {
    dailyTrips: totalDailyTrips,
    peakHourTrips,
    networkCapacityPCU: totalNetworkCapacity,
    avgVCRatio,
    worstVCRatio,
    status,
    numCorridors,
  };
}

// ─── Water & Sanitation Demand (CPHEEO Standards) ───────────────────────────

export function calculateWaterDemand(population: number) {
  const dailyDemandLiters = population * WATER_DEMAND_LPCD;
  const dailyDemandMLD = dailyDemandLiters / 1_000_000; // Million Liters per Day
  const wastewaterMLD = dailyDemandMLD * WASTEWATER_GENERATION_RATIO;

  return {
    dailyDemandMLD: Number(dailyDemandMLD.toFixed(2)),
    wastewaterMLD: Number(wastewaterMLD.toFixed(2)),
    lpcd: WATER_DEMAND_LPCD,
    // STP capacity needed (round up to nearest 0.5 MLD)
    stpCapacityMLD: Number((Math.ceil(wastewaterMLD * 2) / 2).toFixed(1)),
  };
}
