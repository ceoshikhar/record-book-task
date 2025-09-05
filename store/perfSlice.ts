import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PerfState {
    cellsMounted: number;
    cellsUnmounted: number;
    rowsMounted: number;
    rowsUnmounted: number;
    colsMounted: number;
    colsUnmounted: number;
    activeRowCells: Record<string, number>;
}

const initialState: PerfState = {
    cellsMounted: 0,
    cellsUnmounted: 0,
    rowsMounted: 0,
    rowsUnmounted: 0,
    colsMounted: 0,
    colsUnmounted: 0,
    activeRowCells: {},
};

const perfSlice = createSlice({
    name: "perf",
    initialState,
    reducers: {
        cellMounted(state, action: PayloadAction<{ rowId: string }>) {
            state.cellsMounted++;

            const rowId = action.payload.rowId;
            if (!state.activeRowCells[rowId]) {
                state.activeRowCells[rowId] = 0;
                state.rowsMounted++; // first cell => row mounted
            }
            state.activeRowCells[rowId]++;
        },
        cellUnmounted(state, action: PayloadAction<{ rowId: string }>) {
            state.cellsUnmounted++;

            const rowId = action.payload.rowId;
            if (state.activeRowCells[rowId]) {
                state.activeRowCells[rowId]--;
                if (state.activeRowCells[rowId] === 0) {
                    delete state.activeRowCells[rowId];
                    state.rowsUnmounted++; // last cell gone => row unmounted
                }
            }
        },
        colMounted(state) {
            state.colsMounted++;
        },
        colUnmounted(state) {
            state.colsUnmounted++;
        },
        reset(state) {
            Object.assign(state, initialState);
        },
    },
});

export const { cellMounted, cellUnmounted, colMounted, colUnmounted, reset } =
    perfSlice.actions;

export default perfSlice.reducer;
