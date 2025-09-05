import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PerfState {
    activeRowCells: Record<string, number>;
    cellsMounted: number;
    cellsUnmounted: number;
    rowsMounted: number;
    rowsUnmounted: number;
    colsMounted: number;
    colsUnmounted: number;
    rowsInMemory: number;
    colsInMemory: number;
}

const initialState: PerfState = {
    activeRowCells: {},
    cellsMounted: 0,
    cellsUnmounted: 0,
    rowsMounted: 0,
    rowsUnmounted: 0,
    colsMounted: 0,
    colsUnmounted: 0,
    rowsInMemory: 0,
    colsInMemory: 0,
};

const perfSlice = createSlice({
    name: "perf",
    initialState,
    reducers: {
        cellMounted(state, action: PayloadAction<{ rowId: string }>) {
            state.cellsMounted++;

            const rowId = action.payload.rowId;

            // Check if we have already rendered a cell for this row.
            if (!state.activeRowCells[rowId]) {
                state.activeRowCells[rowId] = 0;
                state.rowsMounted++;
            }

            state.activeRowCells[rowId]++;
        },
        cellUnmounted(state, action: PayloadAction<{ rowId: string }>) {
            state.cellsUnmounted++;

            const rowId = action.payload.rowId;
            if (state.activeRowCells[rowId]) {
                state.activeRowCells[rowId]--;

                // Have we unmounted all cells for this row?
                if (state.activeRowCells[rowId] === 0) {
                    delete state.activeRowCells[rowId];
                    state.rowsUnmounted++;
                }
            }
        },
        colMounted(state) {
            state.colsMounted++;
        },
        colUnmounted(state) {
            state.colsUnmounted++;
        },
        rowsInMemory(state, action: PayloadAction<number>) {
            state.rowsInMemory = action.payload;
        },
        colsInMemory(state, action: PayloadAction<number>) {
            state.colsInMemory = action.payload;
        },
    },
});

export const {
    cellMounted,
    cellUnmounted,
    colMounted,
    colUnmounted,
    rowsInMemory,
    colsInMemory,
} = perfSlice.actions;

export default perfSlice.reducer;
