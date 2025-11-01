import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { routeAPI } from '@/lib/api/routes';
import { RouteOption, RouteRequest, Location, TransportMode } from '@/lib/types';
import type { RootState } from '@/lib/store';

interface RouteState {
  searchParams: {
    origin: Location | null;
    destination: Location | null;
    modes: TransportMode[];
    departureTime?: Date;
  };
  routes: RouteOption[];
  selectedRoute: RouteOption | null;
  loading: boolean;
  error: string | null;
}

const initialState: RouteState = {
  searchParams: {
    origin: null,
    destination: null,
    modes: [TransportMode.WALKING, TransportMode.BUS, TransportMode.METRO],
  },
  routes: [],
  selectedRoute: null,
  loading: false,
  error: null,
};

// Async thunk
export const searchRoutes = createAsyncThunk(
  'route/search',
  async (request: RouteRequest, { rejectWithValue }) => {
    try {
      const response = await routeAPI.search(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Rota arama başarısız');
    }
  }
);

const routeSlice = createSlice({
  name: 'route',
  initialState,
  reducers: {
    setOrigin: (state, action: PayloadAction<Location>) => {
      state.searchParams.origin = action.payload;
    },
    setDestination: (state, action: PayloadAction<Location>) => {
      state.searchParams.destination = action.payload;
    },
    setModes: (state, action: PayloadAction<TransportMode[]>) => {
      state.searchParams.modes = action.payload;
    },
    setDepartureTime: (state, action: PayloadAction<Date | undefined>) => {
      state.searchParams.departureTime = action.payload;
    },
    setSelectedRoute: (state, action: PayloadAction<RouteOption | null>) => {
      state.selectedRoute = action.payload;
    },
    swapLocations: (state) => {
      const temp = state.searchParams.origin;
      state.searchParams.origin = state.searchParams.destination;
      state.searchParams.destination = temp;
    },
    clearRoutes: (state) => {
      state.routes = [];
      state.selectedRoute = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchRoutes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.routes = action.payload.routes;
        state.selectedRoute = action.payload.routes[0] || null;
      })
      .addCase(searchRoutes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.routes = [];
        state.selectedRoute = null;
      });
  },
});

export const {
  setOrigin,
  setDestination,
  setModes,
  setDepartureTime,
  setSelectedRoute,
  swapLocations,
  clearRoutes,
  clearError,
} = routeSlice.actions;

// Selectors
export const selectRoute = (state: RootState) => state.route;
export const selectRoutes = (state: RootState) => state.route.routes;
export const selectSelectedRoute = (state: RootState) => state.route.selectedRoute;
export const selectSearchParams = (state: RootState) => state.route.searchParams;
export const selectRouteLoading = (state: RootState) => state.route.loading;
export const selectRouteError = (state: RootState) => state.route.error;

export default routeSlice.reducer;
