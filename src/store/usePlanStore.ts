// src/store/usePlanStore.ts
import { create } from 'zustand';
import {
  placeAmenities,
  calculateEconomics,
  generateRoadNetwork,
  calculateRoadAreaHectares,
  RoadSegment,
} from "@/lib/algorithms";
import { IDEAL_BLOCK_SIZE_METERS, TARGET_MAX_PEOPLE_PER_HECTARE, calculateIdealAmenities } from "@/lib/planningMath";

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
  roadNetwork: Record<string, RoadSegment>;
  roadAreaHectares: number;
  isGridLocked: boolean;
  isGenerating: boolean;
  initMode: 'map' | 'manual' | null;
  
  // Demographics & Economics
  population: number;
  totalLandValue: number;
  landAreaHectares: number;
  blockSizeMeters: number;
  computedDevelopableAreaHectares: number;
  isPopulationEdited: boolean;
  isLandValueEdited: boolean;
  isAmenitiesEdited: boolean;
  
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
  toggleBlockAvailability: (cellKey: string) => void;
  setInitMode: (mode: 'map' | 'manual' | null) => void;
  resetProject: () => void;
  clearAmenities: () => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  gridSize: 15,
  gridData: {},
  roadNetwork: {},
  roadAreaHectares: 0,
  isGridLocked: false,
  isGenerating: false, // <-- NEW
  initMode: null,
  
  population: 50000,
  totalLandValue: 500000000,
  landAreaHectares: 320,
  blockSizeMeters: IDEAL_BLOCK_SIZE_METERS,
  computedDevelopableAreaHectares: 0,
  isPopulationEdited: false,
  isLandValueEdited: false,
  isAmenitiesEdited: false,
  
  amenities: calculateIdealAmenities(50000, 15),

  setGridData: (size, data, developableAreaHectares) => {
    const { blockSizeMeters } = get();
    
    // Accurately compute the modeled area based solely on active blocks
    const activeCellsCount = Object.values(data).filter(c => c.type !== 'disabled').length;
    const modeledAreaHectares = activeCellsCount * ((blockSizeMeters * blockSizeMeters) / 10000);
    
    const estimatedDevelopable = developableAreaHectares ?? (modeledAreaHectares * 0.7);
    const idealPop = Math.round(estimatedDevelopable * TARGET_MAX_PEOPLE_PER_HECTARE * 0.8) || 1000;

    const roadNetwork = generateRoadNetwork(data, idealPop);
    const roadAreaHectares = calculateRoadAreaHectares(roadNetwork, blockSizeMeters);
    const inferredDevelopableArea = Math.max(0, modeledAreaHectares - roadAreaHectares);
    const finalDevelopable = Math.max(0, developableAreaHectares ?? inferredDevelopableArea);
    const finalPop = Math.round(finalDevelopable * TARGET_MAX_PEOPLE_PER_HECTARE * 0.8) || 1000;

    set({
      gridSize: size,
      gridData: data,
      roadNetwork,
      roadAreaHectares,
      computedDevelopableAreaHectares: finalDevelopable,
      landAreaHectares: modeledAreaHectares,
      population: finalPop,
      totalLandValue: Math.round(finalDevelopable * 20000000), // ₹2Cr per hectare default
      isPopulationEdited: false,
      isLandValueEdited: false,
      isAmenitiesEdited: false,
      amenities: calculateIdealAmenities(finalPop, size),
    });
  },
  updateCell: (cellKey, updates) =>
    set((state) => ({
      gridData: {
        ...state.gridData,
        [cellKey]: { ...state.gridData[cellKey], ...updates },
      },
    })),
  setPopulation: (pop) => {
    const { isAmenitiesEdited, gridSize } = get();
    const updates: Partial<PlanState> = { population: pop, isPopulationEdited: true };
    if (!isAmenitiesEdited) {
      updates.amenities = calculateIdealAmenities(pop, gridSize);
    }
    set(updates);
  },
  setTotalLandValue: (val) => set({ totalLandValue: val, isLandValueEdited: true }),
  setLandAreaHectares: (landArea) => set({ landAreaHectares: landArea }),
  setBlockSizeMeters: (blockSize) => set({ blockSizeMeters: blockSize }),
  setAmenityCount: (type, count) =>
    set((state) => ({
      amenities: { ...state.amenities, [type]: count },
      isAmenitiesEdited: true,
    })),
  setGridLocked: (locked) => set({ isGridLocked: locked }),
  generateCityPlan: async () => {
    set({ isGenerating: true }); // Start loading animation

    try {
      // Simulate a complex calculation delay for UX purposes (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const { gridSize, gridData, amenities, totalLandValue, blockSizeMeters, landAreaHectares, population } = get();

      // Step 1: Constraint-based Amenity Placement
      let newGrid = placeAmenities(gridSize, gridData, amenities, blockSizeMeters);

      // Step 2: Dynamic road network generation between all active blocks
      const roadNetwork = generateRoadNetwork(newGrid, population);
      const roadAreaHectares = calculateRoadAreaHectares(roadNetwork, blockSizeMeters);

      // Step 3: Proportional Economics Calculation
      newGrid = calculateEconomics(newGrid, totalLandValue, blockSizeMeters, roadNetwork);

      // Commit the processed grid to state
      set({
        gridData: newGrid,
        roadNetwork,
        roadAreaHectares,
        computedDevelopableAreaHectares: Math.max(0, landAreaHectares - roadAreaHectares),
      });
    } catch (error) {
      console.error("Failed to generate city plan", error);
    } finally {
      set({ isGenerating: false }); // End loading animation, even on failure
    }
  },
  moveAmenity: (fromKey, toKey) => {
    const { gridData, totalLandValue, blockSizeMeters, landAreaHectares, population } = get();
    const fromCell = gridData[fromKey];
    const toCell = gridData[toKey];

    // Basic validation: Ensure we are moving an amenity to a residential block
    if (
      !fromCell ||
      !toCell ||
      fromCell.type !== 'amenity' ||
      toCell.type !== 'residential'
    ) {
      return;
    }

    // Clone the grid to mutate
    const newGrid = { ...gridData };

    // Move the amenity
    newGrid[toKey] = { ...toCell, type: 'amenity', amenityType: fromCell.amenityType };
    
    // Reset the old cell to residential
    newGrid[fromKey] = { ...fromCell, type: 'residential', amenityType: undefined };

    // Instantly recalculate the economics (Heatmap & Accessibility)
    const roadNetwork = generateRoadNetwork(newGrid, population);
    const roadAreaHectares = calculateRoadAreaHectares(roadNetwork, blockSizeMeters);
    const finalizedGrid = calculateEconomics(newGrid, totalLandValue, blockSizeMeters, roadNetwork);

    set({
      gridData: finalizedGrid,
      roadNetwork,
      roadAreaHectares,
      computedDevelopableAreaHectares: Math.max(0, landAreaHectares - roadAreaHectares),
    });
  },
  toggleBlockAvailability: (cellKey) => {
    const { gridData, blockSizeMeters, population } = get();
    const target = gridData[cellKey];
    if (!target) return;
    if (target.type !== "residential" && target.type !== "disabled") return;

    const updatedType: GridCell["type"] = target.type === "disabled" ? "residential" : "disabled";
    const newGrid = {
      ...gridData,
      [cellKey]: {
        ...target,
        type: updatedType,
        amenityType: undefined,
        accessibilityScore: undefined,
        landValue: undefined,
      },
    };

    const activeCellsCount = Object.values(newGrid).filter(c => c.type !== 'disabled').length;
    const modeledAreaHectares = activeCellsCount * ((blockSizeMeters * blockSizeMeters) / 10000);

    const roadNetwork = generateRoadNetwork(newGrid, population);
    const roadAreaHectares = calculateRoadAreaHectares(roadNetwork, blockSizeMeters);
    const finalDevelopable = Math.max(0, modeledAreaHectares - roadAreaHectares);

    const { isPopulationEdited, isLandValueEdited, isAmenitiesEdited, gridSize } = get();
    const updates: Partial<PlanState> = {
      gridData: newGrid,
      roadNetwork,
      roadAreaHectares,
      landAreaHectares: modeledAreaHectares,
      computedDevelopableAreaHectares: finalDevelopable,
    };

    if (!isPopulationEdited) {
      updates.population = Math.round(finalDevelopable * TARGET_MAX_PEOPLE_PER_HECTARE * 0.8) || 1000;
    }
    if (!isLandValueEdited) {
      updates.totalLandValue = Math.round(finalDevelopable * 20000000);
    }
    if (!isAmenitiesEdited) {
      updates.amenities = calculateIdealAmenities(updates.population || population, gridSize);
    }

    set(updates);
  },
  setInitMode: (mode) => set({ initMode: mode }),
  resetProject: () => set({
    gridData: {},
    roadNetwork: {},
    roadAreaHectares: 0,
    isGridLocked: false,
    computedDevelopableAreaHectares: 0,
    initMode: null,
    isPopulationEdited: false,
    isLandValueEdited: false,
    isAmenitiesEdited: false,
    amenities: calculateIdealAmenities(50000, 15),
  }),
  clearAmenities: () => {
    const { gridData, blockSizeMeters, landAreaHectares, population } = get();
    const newGrid: Record<string, GridCell> = {};
    for (const key in gridData) {
      const cell = gridData[key];
      if (cell.type === 'amenity') {
        newGrid[key] = { ...cell, type: 'residential', amenityType: undefined, accessibilityScore: undefined, landValue: undefined };
      } else {
        newGrid[key] = { ...cell, accessibilityScore: undefined, landValue: undefined };
      }
    }
    const roadNetwork = generateRoadNetwork(newGrid, population);
    const roadAreaHectares = calculateRoadAreaHectares(roadNetwork, blockSizeMeters);

    set({
      gridData: newGrid,
      roadNetwork,
      roadAreaHectares,
      computedDevelopableAreaHectares: Math.max(0, landAreaHectares - roadAreaHectares),
    });
  },
}));
