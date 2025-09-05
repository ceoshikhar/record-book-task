import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PerfState {
    cellsMounted: number;
    cellsUnmounted: number;
    rowsMounted: number;
    rowsUnmounted: number;
    colsMounted: number;
    colsUnmounted: number;
}

const initialState: PerfState = {
    cellsMounted: 0,
    cellsUnmounted: 0,
    rowsMounted: 0,
    rowsUnmounted: 0,
    colsMounted: 0,
    colsUnmounted: 0,
};

const perfSlice = createSlice({
    name: "perf",
    initialState,
    reducers: {
        cellMounted(state) {
            state.cellsMounted++;
        },
        cellUnmounted(state) {
            state.cellsUnmounted++;
        },
        rowMounted(state) {
            state.rowsMounted++;
        },
        rowUnmounted(state) {
            state.rowsUnmounted++;
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

export const {
    cellMounted,
    cellUnmounted,
    rowMounted,
    rowUnmounted,
    colMounted,
    colUnmounted,
    reset,
} = perfSlice.actions;

export default perfSlice.reducer;
