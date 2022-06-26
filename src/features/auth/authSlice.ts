import { createSlice, PayloadAction, Slice } from "@reduxjs/toolkit";
import type { RootState } from '~store';

export interface AuthState {
  isDone: boolean;
  isInit: boolean;
  isValid: boolean;
  interval: ReturnType<typeof setInterval> | null;
  sessionId: string;
}

const initialState: AuthState = {
  isDone: false,
  isInit: false,
  isValid: false,
  interval: null,
  sessionId: '',
};

export const authSlice: Slice<AuthState> = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthIsDone: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        isDone: action.payload
      }
    },
    setTokenIsInit: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        isInit: action.payload,
      };
    },
    setTokenIsValid: (state, action) => {
      return {
        ...state,
        isValid: action.payload,
      };
    },
    setTokenInterval: (state, action: PayloadAction<ReturnType<typeof setInterval> | null>) => {
      return {
        ...state,
        interval: action.payload,
      };
    },
    setSessionId: (state, action: PayloadAction<string>) => {
      return {
        ...state,
        sessionId: action.payload,
      };
    },
    setLogout: (state, action) => {
      console.log('omgomg')
      return {
        ...state,
        isDone: false,
        isValid: false,
      };
    }
  },
  extraReducers: (builder) => {
    builder.addDefaultCase(state => state)
  },
});

export const {
  setAuthIsDone,
  setTokenIsInit, 
  setTokenIsValid,
  setTokenInterval,
  setSessionId,
  setLogout,
} = authSlice.actions;

export const selectAuthIsDone = (state: RootState) => state.auth.isDone;
export const selectTokenIsInit = (state: RootState) => state.auth.isInit;
export const selectTokenIsValid = (state: RootState) => state.auth.isValid;
export const selectTokenInterval = (state: RootState) => state.auth.interval;
export const selectSessionId = (state: RootState) => state.auth.sessionId;

export default authSlice.reducer