import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import companiesAPI from '../api/companies.api';

// Async thunks
export const fetchCompanyData = createAsyncThunk(
  'company/fetchCompanyData',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await companiesAPI.getCompanyBySlug(slug);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch company data');
    }
  }
);

export const fetchCompanyMembers = createAsyncThunk(
  'company/fetchCompanyMembers',
  async ({ slug, ...params }, { rejectWithValue }) => {
    try {
      const response = await companiesAPI.getCompanyMembers(slug, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch company members');
    }
  }
);

export const followCompany = createAsyncThunk(
  'company/followCompany',
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await companiesAPI.followCompany(companyId);
      return { companyId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to follow company');
    }
  }
);

export const unfollowCompany = createAsyncThunk(
  'company/unfollowCompany',
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await companiesAPI.unfollowCompany(companyId);
      return { companyId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to unfollow company');
    }
  }
);

const initialState = {
  companyData: null,
  members: [],
  popularCompanies: [],
  loading: false,
  error: null,
  pagination: null,
  isFollowing: false
};

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    clearCompanyData: (state) => {
      state.companyData = null;
      state.members = [];
      state.isFollowing = false;
    },
    setCompanyData: (state, action) => {
      state.companyData = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch company data
      .addCase(fetchCompanyData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyData.fulfilled, (state, action) => {
        state.loading = false;
        state.companyData = action.payload;
      })
      .addCase(fetchCompanyData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch company members
      .addCase(fetchCompanyMembers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCompanyMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload.members || action.payload;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchCompanyMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Follow company
      .addCase(followCompany.fulfilled, (state, action) => {
        state.isFollowing = true;
      })
      
      // Unfollow company
      .addCase(unfollowCompany.fulfilled, (state, action) => {
        state.isFollowing = false;
      });
  }
});

export const { clearCompanyData, setCompanyData } = companySlice.actions;

export default companySlice.reducer;
