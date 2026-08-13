import { create } from "zustand";
import type { TwinAssetId, TwinMode, TwinSimulationOverrides } from "./types";

interface TwinInteractionState {
  mode: TwinMode;
  selectedAssetId: TwinAssetId | null;
  simulationOverrides: TwinSimulationOverrides;
  setMode: (mode: TwinMode) => void;
  selectAsset: (assetId: TwinAssetId) => void;
  closeAssetPanel: () => void;
  startSimulation: (overrides: TwinSimulationOverrides) => void;
  returnToLatest: () => void;
}

const initialState = {
  mode: "live" as const,
  selectedAssetId: null,
  simulationOverrides: {} as TwinSimulationOverrides,
};

export const useTwinStore = create<TwinInteractionState>((set) => ({
  ...initialState,
  setMode: (mode) =>
    set((state) => ({
      mode,
      simulationOverrides: mode === "simulation" ? state.simulationOverrides : {},
    })),
  selectAsset: (assetId) =>
    set((state) => ({ selectedAssetId: state.selectedAssetId === assetId ? null : assetId })),
  closeAssetPanel: () => set({ selectedAssetId: null }),
  startSimulation: (simulationOverrides) => set({ mode: "simulation", simulationOverrides }),
  returnToLatest: () => set({ mode: "live", simulationOverrides: {} }),
}));

export function resetTwinStore(): void {
  useTwinStore.setState(initialState);
}
