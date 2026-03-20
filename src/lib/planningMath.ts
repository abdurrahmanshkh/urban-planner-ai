// src/lib/planningMath.ts
export const AMENITY_CONFIG = {
  school: { id: 'school', name: 'School', ratio: 18000, icon: '🏫', color: '#4f46e5', minGrid: 3 },
  hospital: { id: 'hospital', name: 'Hospital', ratio: 75000, icon: '🏥', color: '#e11d48', minGrid: 5 },
  park: { id: 'park', name: 'Park', ratio: 25000, icon: '🌳', color: '#10b981', minGrid: 4 },
  supermarket: { id: 'supermarket', name: 'Supermarket', ratio: 25000, icon: '🏪', color: '#f59e0b', minGrid: 4 },
  bus_station: { id: 'bus_station', name: 'Bus Station', ratio: 40000, icon: '🚌', color: '#3b82f6', minGrid: 5 },
  community_center: { id: 'community_center', name: 'Community Center', ratio: 40000, icon: '🏛️', color: '#8b5cf6', minGrid: 6 }
};

export const IDEAL_BLOCK_SIZE_METERS = 110;
export const MIN_BLOCK_SIZE_METERS = 80;
export const MAX_BLOCK_SIZE_METERS = 150;

export const MIN_GRID_SIZE = 10;
export const MAX_GRID_SIZE = 80;

export const TARGET_MAX_PEOPLE_PER_HECTARE = 180;

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
