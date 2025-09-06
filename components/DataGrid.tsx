"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    EventApiModule,
    HighlightChangesModule,
    ScrollApiModule,
} from "ag-grid-community";

import "ag-grid-community/styles/ag-theme-alpine.css";

import {
    colMounted,
    colsInMemory,
    colUnmounted,
    rowsInMemory,
} from "@/store/perfSlice";
import { PerformanceTracker } from "@/components/PerformanceTracker";
import { TrackedCellRenderer } from "@/components/TrackedCellRenderer";
import { useLatest } from "@/hooks/useLatest";

ModuleRegistry.registerModules([
    ColumnApiModule,
    RowApiModule,
    InfiniteRowModelModule,
    EventApiModule,
    HighlightChangesModule,
    ScrollApiModule,
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
const ROW_BUFFER = 10;

export function DataGrid() {
    const dispatch = useDispatch();

    const gridRef = useRef<AgGridReact | null>(null);

    const [colPage, setColPage] = useState(0);
    const colPageLatestRef = useLatest(colPage);

    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
    const columnDefsLatestRef = useLatest(columnDefs);

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

    const largestEndRow = useRef(0);

    const onGridReady = useCallback(
        (event: GridReadyEvent) => {
            const dataSource: IDatasource = {
                rowCount: undefined,
                getRows: async (gridParams) => {
                    const rowPage = Math.floor(
                        gridParams.startRow / ROWS_PER_PAGE
                    );
                    const colPage = colPageLatestRef.current;

                    console.log("fetching page…", {
                        rowPage,
                        colPage,
                    });

                    const skeletonRows = Array.from(
                        { length: gridParams.endRow - gridParams.startRow },
                        () => ({ __loading__: true })
                    );

                    gridParams.successCallback(skeletonRows, -1);

                    try {
                        const res = await fetch(
                            `/api/data?rowPage=${rowPage}&colPage=${colPage}&rowsPerPage=${ROWS_PER_PAGE}&colsPerPage=${COLS_PER_PAGE}`
                        );

                        const apiData: ApiResponse = await res.json();

                        setColumnDefs(apiData.colDefs);
                        dispatch(colsInMemory(apiData.colDefs.length));

                        let lastRow = -1;
                        if (gridParams.endRow >= apiData.meta.totalRows) {
                            lastRow = apiData.meta.totalRows;
                        }

                        if (gridParams.endRow > largestEndRow.current) {
                            largestEndRow.current = gridParams.endRow;
                        }

                        dispatch(rowsInMemory(largestEndRow.current));

                        gridParams.successCallback(apiData.rows, lastRow);
                    } catch {
                        gridParams.failCallback();
                    }
                },
            };

            event.api.setGridOption("datasource", dataSource);
        },
        [colPageLatestRef, dispatch]
    );

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
                const nextPage = colPageLatestRef.current + 1;

                const res = await fetch(
                    `/api/data?rowPage=0&colPage=${nextPage}&rowsPerPage=${ROWS_PER_PAGE}&colsPerPage=${COLS_PER_PAGE}`
                );

                const apiData: ApiResponse = await res.json();
                setColumnDefs(apiData.colDefs);

                colPageLatestRef.current = nextPage;
                setColPage(nextPage);

                event.api.refreshInfiniteCache();
            }
        },
        [colPageLatestRef, columnDefs]
    );

    function highlightCell(rowId: number, colId: string) {
        const rowNode = gridRef.current?.api.getRowNode(rowId.toString());
        if (!rowNode) return;

        gridRef.current?.api.flashCells({
            rowNodes: [rowNode],
            columns: [colId],
        });
    }

    useEffect(() => {
        const grid = gridRef.current;

        const ws = new WebSocket("ws://localhost:8080");

        ws.onopen = () => {
            console.log("✅ WebSocket connected");

            if (!grid) return;

            // Simulate updates every 3s (for demo only)
            setInterval(() => {
                const visibleCols: string[] = [];

                const range = grid.api.getHorizontalPixelRange();
                grid.api.getAllDisplayedVirtualColumns().forEach((col: any) => {
                    const left = col.getLeft();
                    const right = left + col.getActualWidth();

                    // Make sure that the column is fully visible.
                    if (left > range.left && right < range.right) {
                        visibleCols.push(col.getColId());
                    }
                });

                const visibleRows = grid.api.getRenderedNodes();
                if (!visibleRows?.length) return;

                const visisbleRowIds: number[] = [];
                visibleRows.forEach((row) =>
                    visisbleRowIds.push(Number(row.data.id))
                );

                const visibleRowStartID = visisbleRowIds[0];
                const visibleRowEndID =
                    visisbleRowIds[visisbleRowIds.length - 1];

                let randomIdIdx = Math.floor(
                    Math.random() * visisbleRowIds.length
                );

                // As we render buffer of 100 rows, we want to make sure
                // we are selecting a row that is fully visible.
                const rowIdAtRandomIdx = visisbleRowIds[randomIdIdx];
                if (rowIdAtRandomIdx < visibleRowStartID + ROW_BUFFER) {
                    randomIdIdx = randomIdIdx + ROW_BUFFER + 2;
                } else if (rowIdAtRandomIdx > visibleRowEndID - ROW_BUFFER) {
                    randomIdIdx = randomIdIdx - ROW_BUFFER - 2;
                }

                if (randomIdIdx > visibleRows.length - ROW_BUFFER / 2) {
                    randomIdIdx = randomIdIdx - ROW_BUFFER;
                }

                const randomId = visisbleRowIds[randomIdIdx];
                const randomField =
                    visibleCols[Math.floor(Math.random() * visibleCols.length)];

                // Sending the update event with a row ID and column field that is
                // currently in the viewport, so that it's easier to see the updates.
                const update = {
                    id: randomId,
                    field: randomField,
                    value: (Math.random() * 100).toFixed(2),
                };

                ws.send(JSON.stringify(update));
            }, 3000);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("WebSocket message:", data);

            if (gridRef.current?.api) {
                const rowNode = gridRef.current.api.getRowNode(
                    data.id.toString()
                );

                if (rowNode) {
                    rowNode.setDataValue(data.field, data.value);

                    // Highlight the updated cell
                    highlightCell(data.id, data.field);
                }
            }
        };

        return () => ws.close();
    }, [columnDefsLatestRef]);

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
            <div style={{ width: "100%", height: "100%" }}>
                <AgGridReact
                    ref={gridRef}
                    columnDefs={columnDefs.map(
                        (col) =>
                            ({
                                ...col,
                                cellRenderer: TrackedCellRenderer,
                            } as ColDef)
                    )}
                    defaultColDef={defaultColDef}
                    rowBuffer={ROW_BUFFER}
                    rowModelType={"infinite"}
                    cacheBlockSize={ROWS_PER_PAGE}
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
