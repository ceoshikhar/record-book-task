import { NextRequest, NextResponse } from "next/server";
import { faker } from "@faker-js/faker";

const TOTAL_ROWS = 300_000;
const TOTAL_COLS = 300;

function generateCell(row: number, col: number): string {
    // Generate a "cell" value deterministically.
    // Same row/col => same data.
    faker.seed(row * TOTAL_COLS + col);
    return faker.word.sample();
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const rowPage = parseInt(searchParams.get("rowPage") || "0", 10);
    const colPage = parseInt(searchParams.get("colPage") || "0", 10);
    const rowsPerPage = parseInt(searchParams.get("rowsPerPage") || "50", 10);
    const colsPerPage = parseInt(searchParams.get("colsPerPage") || "20", 10);

    const startRow = rowPage * rowsPerPage;
    const endRow = Math.min(startRow + rowsPerPage, TOTAL_ROWS);

    const startCol = 0; // Always starting from the first column for simplicity.
    const endCol = Math.min(startCol + colsPerPage * (colPage + 1), TOTAL_COLS);

    const colDefs = [];

    for (let c = startCol; c < endCol; c++) {
        colDefs.push({
            field: `col${c}`,
            headerName: `Column ${c}`,
        });
    }

    const rows: Record<string, string | number>[] = [];

    for (let r = startRow; r < endRow; r++) {
        const row: Record<string, string | number> = { id: r };

        for (let c = startCol; c < endCol; c++) {
            row[`col${c}`] = generateCell(r, c);
        }

        rows.push(row);
    }

    return NextResponse.json({
        rows,
        colDefs,
        meta: {
            totalRows: TOTAL_ROWS,
            totalCols: TOTAL_COLS,
            rowPage,
            colPage,
            rowsPerPage,
            colsPerPage,
        },
    });
}
