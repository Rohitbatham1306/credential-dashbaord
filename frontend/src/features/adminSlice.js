import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchOverview = createAsyncThunk('admin/overview', async () => {
  const { data } = await api.get('/admin/overview');
  return data;
});

const slice = createSlice({
  name: 'admin',
  initialState: { users: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverview.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchOverview.fulfilled, (state, action) => { state.status = 'succeeded'; state.users = action.payload; })
      .addCase(fetchOverview.rejected, (state) => { state.status = 'failed'; state.error = 'Failed to load'; });
  }
});

export default slice.reducer;

