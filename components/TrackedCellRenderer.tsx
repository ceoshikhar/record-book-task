"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { cellMounted, cellUnmounted } from "@/store/perfSlice";

export default function TrackedCellRenderer(props: any) {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(cellMounted());

        return () => {
            dispatch(cellUnmounted());
        };
    }, [dispatch]);

    return <span>{props.value}</span>;
}
