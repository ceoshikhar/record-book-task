"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "@/store";

export function Providers({ children }: { children: React.ReactNode }) {
    // Important: create QueryClient inside useState so it’s stable across renders.
    // I had no clue this was a thing with NextJS?
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <Provider store={store}>{children}</Provider>
        </QueryClientProvider>
    );
}
