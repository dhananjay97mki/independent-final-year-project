import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import citiesAPI from '../api/cities.api';

// Async thunks
export const fetchCityIntel = createAsyncThunk(
  'city/fetchCityIntel',
  async (cityId, { rejectWithValue }) => {
    try {
      const response = await citiesAPI.getCityIntel(cityId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch city intel');
    }
  }
);

export const fetchCityTips = createAsyncThunk(
  'city/fetchCityTips',
  async ({ cityId, ...params }, { rejectWithValue }) => {
    try {
      const response = await citiesAPI.getCityTips(cityId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch city tips');
    }
  }
);

export const fetchCityMembers = createAsyncThunk(
  'city/fetchCityMembers',
  async ({ cityId, ...params }, { rejectWithValue }) => {
    try {
      const response = await citiesAPI.getCityMembers(cityId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch city members');
    }
  }
);

export const addCityTip = createAsyncThunk(
  'city/addCityTip',
  async ({ cityId, tipData }, { rejectWithValue }) => {
    try {
      const response = await citiesAPI.addCityTip(cityId, tipData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add city tip');
    }
  }
);

const initialState = {
  cityData: null,
  tips: [],
  members: [],
  nearCities: [],
  loading: false,
  error: null,
  pagination: null
};

const citySlice = createSlice({
  name: 'city',
  initialState,
  reducers: {
    clearCityData: (state) => {
      state.cityData = null;
      state.tips = [];
      state.members = [];
    },
    setCityData: (state, action) => {
      state.cityData = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch city intel
      .addCase(fetchCityIntel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCityIntel.fulfilled, (state, action) => {
        state.loading = false;
        state.cityData = action.payload.city;
        if (action.payload.tips) {
          state.tips = action.payload.tips;
        }
      })
      .addCase(fetchCityIntel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch city tips
      .addCase(fetchCityTips.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCityTips.fulfilled, (state, action) => {
        state.loading = false;
        state.tips = action.payload.tips || action.payload;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchCityTips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch city members
      .addCase(fetchCityMembers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCityMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload.members || action.payload;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchCityMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add city tip
      .addCase(addCityTip.pending, (state) => {
        state.loading = true;
      })
      .addCase(addCityTip.fulfilled, (state, action) => {
        state.loading = false;
        state.tips.unshift(action.payload);
      })
      .addCase(addCityTip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCityData, setCityData } = citySlice.actions;

export default citySlice.reducer;
