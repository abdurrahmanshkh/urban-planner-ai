// src/store/usePlanStore.ts
import { create } from 'zustand';

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
  gridSize: number;
  gridData: Record<string, GridCell>;
  setGridData: (size: number, data: Record<string, GridCell>) => void;
  updateCell: (cellKey: string, updates: Partial<GridCell>) => void;
}

export const usePlanStore = create<PlanState>((set) => ({
  gridSize: 10,
  gridData: {},
  setGridData: (size, data) => set({ gridSize: size, gridData: data }),
  updateCell: (cellKey, updates) =>
    set((state) => ({
      gridData: {
        ...state.gridData,
        [cellKey]: { ...state.gridData[cellKey], ...updates },
      },
    })),
}));