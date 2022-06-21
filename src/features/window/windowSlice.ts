import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import type { RootState } from '~store';
import type { PaletteMode} from '@mui/material';
import { MOBILE_WIDTH } from '~constants';
import { getAppBarWidth, getColor } from '~utils';

export interface WindowState {
  palette: PaletteMode;
  width: number;
  height: number;
}

const initialState: WindowState = {
  palette: 'dark',
  width: 0,
  height: 0,
};

export const windowSlice: Slice = createSlice({
  name: 'window',
  initialState,
  reducers: {
    setSize: (state, action: PayloadAction<{width: number, height: number}>) => {
      return {
        ...state,
        width: action.payload.width,
        height: action.payload.height,
      };
    },
    setPalette: (state, action: PayloadAction<PaletteMode>) => {
      return {
        ...state,
        palette: action.payload
      };
    },
    togglePalette: (state) => {
      console.log('hello')
      return {
        ...state,
        palette: state.palette === 'dark' ? 'light' : 'dark',
      };
    },
  },
});

export const { setSize, setPalette, togglePalette } = windowSlice.actions;

export const selectWidth = (state: RootState) => state.window.width;
export const selectHeight = (state: RootState) => state.window.height;
export const selectPalette = (state: RootState) => state.window.palette;
export const selectColor = (isDim: boolean) => (state: RootState) => getColor(state.window.palette, isDim);
export const selectAppBarWidth = (state: RootState) => getAppBarWidth(state.window.width);

export default windowSlice.reducer;