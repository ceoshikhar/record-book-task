"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AgGridReact } from "ag-grid-react";
import {
    ModuleRegistry,
    ColDef,
    BodyScrollEndEvent,
    InfiniteRowModelModule,
    ValidationModule,
    GridReadyEvent,
    IDatasource,
    ColumnApiModule,
    RowApiModule,
    VirtualColumnsChangedEvent,
} from "ag-grid-community";

import "ag-grid-community/styles/ag-theme-alpine.css";

import { colMounted, colUnmounted } from "@/store/perfSlice";
import { PerformanceTracker } from "@/components/PerformanceTracker";
import { TrackedCellRenderer } from "@/components/TrackedCellRenderer";

ModuleRegistry.registerModules([
    ColumnApiModule,
    RowApiModule,
    InfiniteRowModelModule,
    ...(process.env.NODE_ENV !== "production" ? [ValidationModule] : []), // IDK what this does but it was in the example. Maybe bettter console error logs?
]);

type ApiResponse = {
    rows: Record<string, any>[];
    colDefs: ColDef[];
    meta: {
        totalRows: number;
        totalCols: number;
        rowPage: number;
        colPage: number;
        rowsPerPage: number;
        colsPerPage: number;
    };
};

const ROWS_PER_PAGE = 100;
const COLS_PER_PAGE = 20;

export function DataGrid() {
    const dispatch = useDispatch();

    const [colPage, setColPage] = useState(0);
    const colPageRef = useRef(colPage);
    colPageRef.current = colPage;

    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
            minWidth: 169,
            sortable: false,
        };
    }, []);

    const prevDisplayedColsRef = useRef<string[]>([]);

    const onVirtualColumnsChanged = useCallback(
        (event: VirtualColumnsChangedEvent<unknown>) => {
            const displayedCols = event.api
                .getAllDisplayedVirtualColumns()
                .map((col: any) => col.getColId());

            const prevDisplayedCols = prevDisplayedColsRef.current;

            // Newly mounted columns.
            displayedCols.forEach((id) => {
                if (!prevDisplayedCols.includes(id)) {
                    dispatch(colMounted());
                }
            });

            // Unmounted columns.
            prevDisplayedCols.forEach((id) => {
                if (!displayedCols.includes(id)) {
                    dispatch(colUnmounted());
                }
            });

            prevDisplayedColsRef.current = displayedCols;
        },
        [dispatch]
    );

    const onGridReady = useCallback((event: GridReadyEvent) => {
        const dataSource: IDatasource = {
            rowCount: undefined,
            getRows: async (gridParams) => {
                const rowPage = Math.floor(gridParams.startRow / ROWS_PER_PAGE);
                const colPage = colPageRef.current;

                console.log("fetching page…", {
                    rowPage,
                    colPage,
                });

                try {
                    const res = await fetch(
                        `/api/data?rowPage=${rowPage}&colPage=${colPage}&rowsPerPage=${ROWS_PER_PAGE}&colsPerPage=${COLS_PER_PAGE}`
                    );
                    const apiData: ApiResponse = await res.json();
                    const colDefs = apiData.colDefs.map((col) => ({
                        ...col,
                        cellRenderer: TrackedCellRenderer,
                    }));
                    setColumnDefs(colDefs);

                    let lastRow = -1;
                    if (gridParams.endRow >= apiData.meta.totalRows) {
                        lastRow = apiData.meta.totalRows;
                    }

                    gridParams.successCallback(apiData.rows, lastRow);
                } catch {
                    gridParams.failCallback();
                }
            },
        };

        event.api.setGridOption("datasource", dataSource);
    }, []);

    const onBodyScrollEnd = useCallback(
        async (event: BodyScrollEndEvent) => {
            // We ignore vertical scrolls because this callback
            // is to handle column (horizontal) pagination.
            if (event.direction === "vertical") return;

            const displayed = event.api.getAllDisplayedVirtualColumns();
            if (!displayed.length) return;

            const lastCol = displayed[displayed.length - 1];
            const lastColId = lastCol.getColId();

            const lastLoadedCol = columnDefs[columnDefs.length - 1];

            if (lastColId === lastLoadedCol.field) {
                const nextPage = colPageRef.current + 1;

                const res = await fetch(
                    `/api/data?rowPage=0&colPage=${nextPage}&rowsPerPage=${ROWS_PER_PAGE}&colsPerPage=${COLS_PER_PAGE}`
                );
                const apiData: ApiResponse = await res.json();
                const colDefs = apiData.colDefs.map((col) => ({
                    ...col,
                    cellRenderer: TrackedCellRenderer,
                }));
                setColumnDefs(colDefs);
                colPageRef.current = nextPage;
                setColPage(nextPage);

                // Force the grid to have the data for all cells in the new columns.
                event.api.refreshInfiniteCache();
            }
        },
        [columnDefs]
    );

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
            <div style={{ width: "100%", height: "100%" }}>
                <AgGridReact
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowBuffer={10}
                    rowModelType={"infinite"}
                    cacheBlockSize={100}
                    maxBlocksInCache={10}
                    onGridReady={onGridReady}
                    onBodyScrollEnd={onBodyScrollEnd}
                    onVirtualColumnsChanged={onVirtualColumnsChanged}
                />
            </div>

            <PerformanceTracker />
        </div>
    );
}
