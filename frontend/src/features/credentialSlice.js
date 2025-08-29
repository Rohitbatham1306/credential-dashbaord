import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setUserStatus } from './authSlice';
import api from '../services/api';

export const fetchMyCredentials = createAsyncThunk('credentials/fetchMine', async (_, { rejectWithValue, dispatch }) => {
  try { const { data } = await api.get('/credentials'); if (data?.status) dispatch(setUserStatus(data.status)); return data.items || data; }
  catch (e) { return rejectWithValue('Failed to load'); }
});

export const confirmAssignment = createAsyncThunk('credentials/confirm', async (assignmentId, { rejectWithValue, dispatch }) => {
  try { 
    const { data } = await api.post(`/credentials/${assignmentId}/confirm`); 
    if (data?.status) dispatch(setUserStatus(data.status)); 
    return { assignmentId, message: 'Credential confirmed successfully!' }; 
  }
  catch (e) { return rejectWithValue('Confirm failed'); }
});

export const reportAssignment = createAsyncThunk('credentials/report', async ({ assignmentId, note }, { rejectWithValue, dispatch }) => {
  try { 
    const { data } = await api.post(`/credentials/${assignmentId}/report`, { note }); 
    if (data?.status) dispatch(setUserStatus(data.status)); 
    return { assignmentId, message: 'Issue reported successfully!' }; 
  }
  catch (e) { return rejectWithValue('Report failed'); }
});

const slice = createSlice({
  name: 'credentials',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyCredentials.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMyCredentials.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchMyCredentials.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(confirmAssignment.fulfilled, (state, action) => {
        const item = state.items.find(i => i.assignmentId === action.payload.assignmentId);
        if (item) { item.confirmed = true; item.problematic = false; }
      })
      .addCase(reportAssignment.fulfilled, (state, action) => {
        const item = state.items.find(i => i.assignmentId === action.payload.assignmentId);
        if (item) { item.problematic = true; }
      });
  }
});

export default slice.reducer;

