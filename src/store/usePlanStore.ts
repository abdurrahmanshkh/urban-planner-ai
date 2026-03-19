// src/store/usePlanStore.ts
import { create } from 'zustand';
import { placeAmenities, generateRoads, calculateEconomics } from "@/lib/algorithms";
import { IDEAL_BLOCK_SIZE_METERS } from "@/lib/planningMath";

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
  isGenerating: boolean;
  
  // Demographics & Economics
  population: number;
  totalLandValue: number;
  landAreaHectares: number;
  blockSizeMeters: number;
  computedDevelopableAreaHectares: number;
  
  // Amenities (User selected counts)
  amenities: Record<string, number>;
  
  // Actions
  setGridData: (size: number, data: Record<string, GridCell>, developableAreaHectares?: number) => void;
  updateCell: (cellKey: string, updates: Partial<GridCell>) => void;
  setPopulation: (pop: number) => void;
  setTotalLandValue: (val: number) => void;
  setLandAreaHectares: (landArea: number) => void;
  setBlockSizeMeters: (blockSize: number) => void;
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
  landAreaHectares: 320,
  blockSizeMeters: IDEAL_BLOCK_SIZE_METERS,
  computedDevelopableAreaHectares: 0,
  
  amenities: {
    school: 0, hospital: 0, park: 0, supermarket: 0, bus_station: 0, community_center: 0,
  },

  setGridData: (size, data, developableAreaHectares) => set({ gridSize: size, gridData: data, computedDevelopableAreaHectares: developableAreaHectares ?? 0 }),
  updateCell: (cellKey, updates) =>
    set((state) => ({
      gridData: {
        ...state.gridData,
        [cellKey]: { ...state.gridData[cellKey], ...updates },
      },
    })),
  setPopulation: (pop) => set({ population: pop }),
  setTotalLandValue: (val) => set({ totalLandValue: val }),
  setLandAreaHectares: (landArea) => set({ landAreaHectares: landArea }),
  setBlockSizeMeters: (blockSize) => set({ blockSizeMeters: blockSize }),
  setAmenityCount: (type, count) =>
    set((state) => ({
      amenities: { ...state.amenities, [type]: count },
    })),
  setGridLocked: (locked) => set({ isGridLocked: locked }),
  generateCityPlan: async () => {
    set({ isGenerating: true }); // Start loading animation

    try {
      // Simulate a complex calculation delay for UX purposes (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const { gridSize, gridData, amenities, totalLandValue, blockSizeMeters } = get();

      // Step 1: Constraint-based Amenity Placement
      let newGrid = placeAmenities(gridSize, gridData, amenities);

      // Step 2: A* Road Routing
      newGrid = generateRoads(gridSize, newGrid);

      // Step 3: Proportional Economics Calculation
      newGrid = calculateEconomics(newGrid, totalLandValue, blockSizeMeters);

      // Commit the processed grid to state
      set({ gridData: newGrid });
    } catch (error) {
      console.error("Failed to generate city plan", error);
    } finally {
      set({ isGenerating: false }); // End loading animation, even on failure
    }
  },
  moveAmenity: (fromKey, toKey) => {
    const { gridData, totalLandValue, blockSizeMeters } = get();
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
    const finalizedGrid = calculateEconomics(newGrid, totalLandValue, blockSizeMeters);

    set({ gridData: finalizedGrid });
  },
}));
