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
  generateCityPlan: () => Promise<void>; // <-- UPDATED to Promise
  moveAmenity: (fromKey: string, toKey: string) => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  gridSize: 15,
  gridData: {},
  isGridLocked: false,
  isGenerating: false, // <-- NEW
  
  population: 50000,
  totalLandValue: 500000000,
  
  amenities: {
    school: 0, hospital: 0, park: 0, supermarket: 0, bus_station: 0, community_center: 0,
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
  generateCityPlan: async () => {
    set({ isGenerating: true }); // Start loading animation
    
    // Simulate a complex calculation delay for UX purposes (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const { gridSize, gridData, amenities, totalLandValue } = get();
    
    // Step 1: Constraint-based Amenity Placement
    let newGrid = placeAmenities(gridSize, gridData, amenities);
    
    // Step 2: A* Road Routing
    newGrid = generateRoads(gridSize, newGrid);
    
    // Step 3: Proportional Economics Calculation
    newGrid = calculateEconomics(newGrid, totalLandValue);

    // Commit the processed grid to state
    set({ gridData: newGrid, isGenerating: false }); // End loading animation
  },
  moveAmenity: (fromKey, toKey) => {
    const { gridData, totalLandValue } = get();
    const fromCell = gridData[fromKey];
    const toCell = gridData[toKey];

    // Basic validation: Ensure we are moving an amenity to a residential block
    if (!fromCell || !toCell || fromCell.type !== 'amenity' || toCell.type === 'disabled' || toCell.type === 'road') {
      return;
    }

    // Clone the grid to mutate
    const newGrid = { ...gridData };

    // Move the amenity
    newGrid[toKey] = { ...toCell, type: 'amenity', amenityType: fromCell.amenityType };
    
    // Reset the old cell to residential
    newGrid[fromKey] = { ...fromCell, type: 'residential', amenityType: undefined };

    // Instantly recalculate the economics (Heatmap & Accessibility)
    const finalizedGrid = calculateEconomics(newGrid, totalLandValue);

    set({ gridData: finalizedGrid });
  },
}));