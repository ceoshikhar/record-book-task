import { configureStore } from "@reduxjs/toolkit";

import perfReducer from "@/store/perfSlice";

export const store = configureStore({
    reducer: {
        perf: perfReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
