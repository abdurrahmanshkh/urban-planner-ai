// src/lib/planningMath.ts
// All constants aligned with URDPFI 2014, IRC:86-1983, IPHS, and 15-minute city standards.

export const AMENITY_CONFIG = {
  school: {
    id: 'school', name: 'School', ratio: 7500, icon: '🏫', color: '#4f46e5',
    minGrid: 3, capexCr: 12, opexCr: 1.5,
    description: 'URDPFI: 1 Senior Secondary per 7,500 pop'
  },
  hospital: {
    id: 'hospital', name: 'Hospital', ratio: 50000, icon: '🏥', color: '#e11d48',
    minGrid: 5, capexCr: 35, opexCr: 3.5,
    description: 'URDPFI/IPHS: 1 Community Hospital per 50,000 pop'
  },
  park: {
    id: 'park', name: 'Park', ratio: 10000, icon: '🌳', color: '#10b981',
    minGrid: 4, capexCr: 2, opexCr: 0.3,
    description: 'URDPFI: 1 Neighbourhood Park per 10,000 pop (12 sqm/person)'
  },
  supermarket: {
    id: 'supermarket', name: 'Supermarket', ratio: 10000, icon: '🏪', color: '#f59e0b',
    minGrid: 4, capexCr: 3, opexCr: 0.8,
    description: 'URDPFI: 1 Market/Shopping per 10,000 pop'
  },
  bus_station: {
    id: 'bus_station', name: 'Bus Station', ratio: 15000, icon: '🚌', color: '#3b82f6',
    minGrid: 5, capexCr: 5, opexCr: 0.5,
    description: '15-min City: Transit stop within 800m for all residents'
  },
  community_center: {
    id: 'community_center', name: 'Community Center', ratio: 25000, icon: '🏛️', color: '#8b5cf6',
    minGrid: 6, capexCr: 5, opexCr: 0.5,
    description: 'URDPFI: 1 Socio-cultural facility per 25,000 pop'
  }
};

// Block Size Constraints (meters)
export const IDEAL_BLOCK_SIZE_METERS = 110;
export const MIN_BLOCK_SIZE_METERS = 80;
export const MAX_BLOCK_SIZE_METERS = 150;

// URDPFI Standards
export const URDPFI_GREEN_COVER_SQM_PER_PERSON = 12; // URDPFI recommends 10-12 sqm; using stricter 12 sqm target

// IRC:86-1983 Road Capacity Standards (PCU per lane per hour)
export const ROAD_CAPACITY_PCU_PER_LANE_HR = {
  arterial: 1200,   // IRC standard for urban arterial
  collector: 900,    // IRC standard for urban collector
  local: 500         // Local roads serve access, not throughput
};

// Traffic Generation Standards (Indian CMP estimates)
export const TRIPS_PER_PERSON_PER_DAY = 1.4;  // Indian urban average from CMP studies (range 1.2-1.6)
export const PEAK_HOUR_TRAFFIC_RATIO = 0.12;  // Peak hour captures ~12% of daily trips

// CPHEEO Water Supply Standards
export const WATER_DEMAND_LPCD = 135;          // Liters Per Capita Per Day (CPHEEO domestic standard)
export const WASTEWATER_GENERATION_RATIO = 0.8; // 80% of water supply becomes wastewater

// Density Constraints
export const MIN_GRID_SIZE = 10;
export const MAX_GRID_SIZE = 80;
export const TARGET_MAX_PEOPLE_PER_HECTARE = 250; // URDPFI allows 175-300 pph for general urban areas

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function getBlockAreaSqm(blockSizeMeters: number): number {
  const safeBlockSize = clamp(blockSizeMeters, MIN_BLOCK_SIZE_METERS, MAX_BLOCK_SIZE_METERS);
  return safeBlockSize * safeBlockSize;
}

export function getBlockAreaHectares(blockSizeMeters: number): number {
  return getBlockAreaSqm(blockSizeMeters) / 10_000;
}

export function calculateTargetDevelopableBlocks(landAreaHectares: number, blockSizeMeters: number): number {
  const areaSqm = Math.max(0, landAreaHectares) * 10_000;
  return Math.max(1, Math.round(areaSqm / getBlockAreaSqm(blockSizeMeters)));
}

export function estimateGridResolution(
  landAreaHectares: number,
  blockSizeMeters: number,
  developableFillRatio: number
): number {
  const targetDevelopableBlocks = calculateTargetDevelopableBlocks(landAreaHectares, blockSizeMeters);
  const safeFillRatio = clamp(developableFillRatio || 0.45, 0.08, 0.95);
  const totalCellsNeeded = Math.ceil(targetDevelopableBlocks / safeFillRatio);
  return clamp(Math.ceil(Math.sqrt(totalCellsNeeded)), MIN_GRID_SIZE, MAX_GRID_SIZE);
}

export function getServiceRadiusInCells(serviceRadiusMeters: number, blockSizeMeters: number): number {
  return Math.max(1, Math.round(serviceRadiusMeters / Math.max(1, blockSizeMeters)));
}

export function calculateIdealAmenities(population: number, gridSize: number): Record<string, number> {
  const idealCounts: Record<string, number> = {};
  
  Object.values(AMENITY_CONFIG).forEach(amenity => {
    // Calculate based on population ratio
    const popRequirement = Math.ceil(population / amenity.ratio);
    // Ensure grid minimums are met (e.g., at least 1 park if grid is larger than 4x4)
    const gridRequirement = gridSize >= amenity.minGrid ? 1 : 0;
    
    idealCounts[amenity.id] = Math.max(popRequirement, gridRequirement);
  });
  
  return idealCounts;
}
