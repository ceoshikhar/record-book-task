"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { cellMounted, cellUnmounted } from "@/store/perfSlice";
import { SkeletonCellRenderer } from "./SkeletonCellRenderer";

export function TrackedCellRenderer(props: any) {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(cellMounted({ rowId: props.node.id }));

        return () => {
            dispatch(cellUnmounted({ rowId: props.node.id }));
        };
    }, [dispatch, props.node.id]);

    if (props.data?.__loading__ && !props.value) {
        return <SkeletonCellRenderer />;
    }

    return <span>{props.value}</span>;
}
