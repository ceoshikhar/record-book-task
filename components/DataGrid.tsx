"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
} from "ag-grid-community";

import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([
    InfiniteRowModelModule,
    ColumnApiModule,
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
                    const colDefs = apiData.colDefs;
                    setColumnDefs(colDefs);

                    // Calculate slice within the fetched page
                    const start = gridParams.startRow % ROWS_PER_PAGE;
                    const end =
                        start + (gridParams.endRow - gridParams.startRow);
                    const rowsThisPage = apiData.rows.slice(start, end);

                    let lastRow = -1;
                    if (gridParams.endRow >= apiData.meta.totalRows) {
                        lastRow = apiData.meta.totalRows;
                    }

                    gridParams.successCallback(rowsThisPage, lastRow);
                } catch {
                    gridParams.failCallback();
                }
            },
        };
        event.api.setGridOption("datasource", dataSource);
    }, []);

    const onBodyScrollEnd = useCallback(
        (event: BodyScrollEndEvent) => {
            // We ignore vertical scrolls because this callback
            // is to handle column (horizontal) pagination.
            if (event.direction === "vertical") return;

            const displayed = event.api.getAllDisplayedVirtualColumns();
            if (!displayed.length) return;

            const lastCol = displayed[displayed.length - 1];
            const lastColId = lastCol.getColId();

            // The ID of the last column we have in memory
            const lastLoadedCol = columnDefs[columnDefs.length - 1];

            if (lastColId === lastLoadedCol.field) {
                const nextPage = colPageRef.current + 1;

                fetch(
                    `/api/data?rowPage=0&colPage=${nextPage}&rowsPerPage=${ROWS_PER_PAGE}&colsPerPage=${COLS_PER_PAGE}`
                )
                    .then((r) => r.json())
                    .then((apiData) => {
                        setColumnDefs((prev) => [...prev, ...apiData.colDefs]);

                        colPageRef.current = nextPage;
                        setColPage(nextPage);

                        // Force the grid to have the data for all cells in the new columns.
                        event.api.refreshInfiniteCache();
                    });
            }
        },
        [columnDefs]
    );

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <div style={{ width: "100%", height: "100%" }}>
                <AgGridReact
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowBuffer={0}
                    rowModelType={"infinite"}
                    cacheBlockSize={100}
                    cacheOverflowSize={2}
                    maxConcurrentDatasourceRequests={1}
                    infiniteInitialRowCount={1000}
                    maxBlocksInCache={10}
                    onGridReady={onGridReady}
                    onBodyScrollEnd={onBodyScrollEnd}
                />
            </div>
        </div>
    );
}
