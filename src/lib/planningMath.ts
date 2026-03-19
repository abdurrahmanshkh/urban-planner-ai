// src/lib/planningMath.ts
export const AMENITY_CONFIG = {
  school: { id: 'school', name: 'School', ratio: 18000, icon: '🏫', color: '#4f46e5', minGrid: 3 },
  hospital: { id: 'hospital', name: 'Hospital', ratio: 75000, icon: '🏥', color: '#e11d48', minGrid: 5 },
  park: { id: 'park', name: 'Park', ratio: 25000, icon: '🌳', color: '#10b981', minGrid: 4 },
  supermarket: { id: 'supermarket', name: 'Supermarket', ratio: 25000, icon: '🏪', color: '#f59e0b', minGrid: 4 },
  bus_station: { id: 'bus_station', name: 'Bus Station', ratio: 40000, icon: '🚌', color: '#3b82f6', minGrid: 5 },
  community_center: { id: 'community_center', name: 'Community Center', ratio: 40000, icon: '🏛️', color: '#8b5cf6', minGrid: 6 }
};

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