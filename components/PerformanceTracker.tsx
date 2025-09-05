"use client";

import { useSelector } from "react-redux";

import { RootState } from "@/store";

export function PerformanceTracker() {
    const stats = useSelector((state: RootState) => state.perf);

    return (
        <div className="fixed bottom-2 right-2 bg-black/80 text-white text-xs p-3 rounded shadow space-y-1">
            <div>Cells mounted: {stats.cellsMounted}</div>
            <div>Cells unmounted: {stats.cellsUnmounted}</div>
            <div>Rows mounted: {stats.rowsMounted}</div>
            <div>Rows unmounted: {stats.rowsUnmounted}</div>
            <div>Cols mounted: {stats.colsMounted}</div>
            <div>Cols unmounted: {stats.colsUnmounted}</div>
            <div>Rows in memory: {stats.rowsInMemory}</div>
            <div>Cols in memory: {stats.colsInMemory}</div>
        </div>
    );
}
