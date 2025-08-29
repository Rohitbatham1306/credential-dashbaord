import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

const accessToken = localStorage.getItem('accessToken');
const refreshTokenFromStorage = localStorage.getItem('refreshToken');
const user = JSON.parse(localStorage.getItem('user') || 'null');

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async ({ email, name, password, role }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', { email, name, password, role });
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Register failed');
  }
});

export const verifyEmail = createAsyncThunk('auth/verifyEmail', async (token, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/auth/verify-email/${token}`);
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Email verification failed');
  }
});

export const resendVerification = createAsyncThunk('auth/resendVerification', async (email, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/resend-verification', { email });
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to resend verification email');
  }
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (email, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to process password reset request');
  }
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ token, password }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Password reset failed');
  }
});

export const refreshTokens = createAsyncThunk('auth/refreshTokens', async (_, { getState, rejectWithValue }) => {
  try {
    const { refreshToken } = getState().auth;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const { data } = await api.post('/auth/refresh-token', { refreshToken });
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Token refresh failed');
  }
});

export const changePassword = createAsyncThunk('auth/changePassword', async ({ currentPassword, newPassword }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to change password');
  }
});

const slice = createSlice({
  name: 'auth',
  initialState: { 
    accessToken: accessToken || null, 
    refreshToken: refreshTokenFromStorage || null,
    user: user || null, 
    status: 'idle', 
    error: null,
    message: null
  },
  reducers: {
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.message = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
    setUserStatus(state, action) {
      if (state.user) {
        state.user.status = action.payload;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    clearError(state) {
      state.error = null;
    },
    clearMessage(state) {
      state.message = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => { 
        state.status = 'loading'; 
        state.error = null; 
        state.message = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.error = null;
        state.message = null;
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => { 
        state.status = 'failed'; 
        state.error = action.payload; 
        state.message = null;
      })
      
      // Register
      .addCase(register.pending, (state) => { 
        state.status = 'loading'; 
        state.error = null; 
        state.message = null;
      })
      .addCase(register.fulfilled, (state, action) => { 
        state.status = 'succeeded'; 
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => { 
        state.status = 'failed'; 
        state.error = action.payload; 
        state.message = null;
      })
      
      // Email verification
      .addCase(verifyEmail.pending, (state) => { 
        state.status = 'loading'; 
        state.error = null; 
        state.message = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => { 
        state.status = 'succeeded'; 
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => { 
        state.status = 'failed'; 
        state.error = action.payload; 
        state.message = null;
      })
      
      // Resend verification
      .addCase(resendVerification.pending, (state) => { 
        state.status = 'loading'; 
        state.error = null; 
        state.message = null;
      })
      .addCase(resendVerification.fulfilled, (state, action) => { 
        state.status = 'succeeded'; 
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(resendVerification.rejected, (state, action) => { 
        state.status = 'failed'; 
        state.error = action.payload; 
        state.message = null;
      })
      
      // Forgot password
      .addCase(forgotPassword.pending, (state) => { 
        state.status = 'loading'; 
        state.error = null; 
        state.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => { 
        state.status = 'succeeded'; 
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => { 
        state.status = 'failed'; 
        state.error = action.payload; 
        state.message = null;
      })
      
      // Reset password
      .addCase(resetPassword.pending, (state) => { 
        state.status = 'loading'; 
        state.error = null; 
        state.message = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => { 
        state.status = 'succeeded'; 
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => { 
        state.status = 'failed'; 
        state.error = action.payload; 
        state.message = null;
      })
      
      // Refresh token
      .addCase(refreshTokens.pending, (state) => { 
        state.status = 'loading'; 
        state.error = null; 
        state.message = null;
      })
      .addCase(refreshTokens.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
        state.message = null;
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(refreshTokens.rejected, (state, action) => { 
        state.error = action.payload; 
        state.message = null;
        // Don't change status on token refresh failure
      })
      
      // Change password
      .addCase(changePassword.pending, (state) => { 
        state.status = 'loading'; 
        state.error = null; 
        state.message = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => { 
        state.status = 'succeeded'; 
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => { 
        state.status = 'failed'; 
        state.error = action.payload; 
        state.message = null;
      });
  }
});

export const { logout, setUserStatus, clearError, clearMessage } = slice.actions;
export default slice.reducer;

