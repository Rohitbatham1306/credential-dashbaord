import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import credentialReducer from '../features/credentialSlice';
import adminReducer from '../features/adminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    credentials: credentialReducer,
    admin: adminReducer,
  },
});

export default store;

