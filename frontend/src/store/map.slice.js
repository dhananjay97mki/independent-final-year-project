import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import mapAPI from '../api/map.api';

// Async thunks
export const fetchHeatData = createAsyncThunk(
  'map/fetchHeatData',
  async (params, { rejectWithValue }) => {
    try {
      const response = await mapAPI.getHeat(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch heat data');
    }
  }
);

export const fetchClusters = createAsyncThunk(
  'map/fetchClusters',
  async (params, { rejectWithValue }) => {
    try {
      const response = await mapAPI.getClusters(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch clusters');
    }
  }
);

export const shareLocation = createAsyncThunk(
  'map/shareLocation',
  async (locationData, { rejectWithValue }) => {
    try {
      const response = await mapAPI.shareLocation(locationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to share location');
    }
  }
);

export const fetchUserLocations = createAsyncThunk(
  'map/fetchUserLocations',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await mapAPI.getUserLocations(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch user locations');
    }
  }
);

const initialState = {
  heatData: [],
  clusters: [],
  userLocations: [],
  bounds: null,
  filters: {
    companyId: '',
    department: '',
    batch: '',
    role: ''
  },
  loading: false,
  error: null,
  locationSharing: false
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setMapBounds: (state, action) => {
      state.bounds = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearMapData: (state) => {
      state.heatData = [];
      state.clusters = [];
      state.userLocations = [];
    },
    setLocationSharing: (state, action) => {
      state.locationSharing = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch heat data
      .addCase(fetchHeatData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHeatData.fulfilled, (state, action) => {
        state.loading = false;
        state.heatData = action.payload;
      })
      .addCase(fetchHeatData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch clusters
      .addCase(fetchClusters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClusters.fulfilled, (state, action) => {
        state.loading = false;
        state.clusters = action.payload;
      })
      .addCase(fetchClusters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Share location
      .addCase(shareLocation.pending, (state) => {
        state.loading = true;
      })
      .addCase(shareLocation.fulfilled, (state) => {
        state.loading = false;
        state.locationSharing = true;
      })
      .addCase(shareLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch user locations
      .addCase(fetchUserLocations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.userLocations = action.payload;
      })
      .addCase(fetchUserLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  setMapBounds, 
  setFilters, 
  clearFilters, 
  clearMapData, 
  setLocationSharing 
} = mapSlice.actions;

export default mapSlice.reducer;
