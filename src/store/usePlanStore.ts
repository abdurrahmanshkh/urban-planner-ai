// src/store/usePlanStore.ts
import { create } from 'zustand';
import { placeAmenities, generateRoads, calculateEconomics } from "@/lib/algorithms";

export type CellType = 'residential' | 'amenity' | 'disabled' | 'road';

export interface GridCell {
  x: number;
  y: number;
  type: CellType;
  amenityType?: string;
  accessibilityScore?: number;
  landValue?: number;
}

interface PlanState {
  // Grid State
  gridSize: number;
  gridData: Record<string, GridCell>;
  isGridLocked: boolean;
  
  // Demographics & Economics
  population: number;
  totalLandValue: number;
  
  // Amenities (User selected counts)
  amenities: Record<string, number>;
  
  // Actions
  setGridData: (size: number, data: Record<string, GridCell>) => void;
  updateCell: (cellKey: string, updates: Partial<GridCell>) => void;
  setPopulation: (pop: number) => void;
  setTotalLandValue: (val: number) => void;
  setAmenityCount: (type: string, count: number) => void;
  setGridLocked: (locked: boolean) => void;
  generateCityPlan: () => void;
}

export const usePlanStore = create<PlanState>((set) => ({
  gridSize: 15,
  gridData: {},
  isGridLocked: false,
  
  population: 50000,
  totalLandValue: 500000000, // ₹50 Crore default
  
  amenities: {
    school: 0,
    hospital: 0,
    park: 0,
    supermarket: 0,
    bus_station: 0,
    community_center: 0,
  },

  setGridData: (size, data) => set({ gridSize: size, gridData: data }),
  updateCell: (cellKey, updates) =>
    set((state) => ({
      gridData: {
        ...state.gridData,
        [cellKey]: { ...state.gridData[cellKey], ...updates },
      },
    })),
  setPopulation: (pop) => set({ population: pop }),
  setTotalLandValue: (val) => set({ totalLandValue: val }),
  setAmenityCount: (type, count) =>
    set((state) => ({
      amenities: { ...state.amenities, [type]: count },
    })),
  setGridLocked: (locked) => set({ isGridLocked: locked }),
  generateCityPlan: () => {
    const { gridSize, gridData, amenities, totalLandValue } = get();
    
    // Step 1: Constraint-based Amenity Placement
    let newGrid = placeAmenities(gridSize, gridData, amenities);
    
    // Step 2: A* Road Routing
    newGrid = generateRoads(gridSize, newGrid);
    
    // Step 3: Proportional Economics Calculation
    newGrid = calculateEconomics(newGrid, totalLandValue);
    
    // Commit the processed grid to state
    set({ gridData: newGrid });
  },
}));