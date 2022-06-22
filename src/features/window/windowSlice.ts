import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import type { RootState } from '~store';
import type { PaletteMode} from '@mui/material';
import { getAppBarWidth, getColor } from '~utils';

export interface WindowState {
  palette: PaletteMode;
}

const initialState: WindowState = {
  palette: 'dark',
};

export const windowSlice: Slice = createSlice({
  name: 'window',
  initialState,
  reducers: {
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

export const { setPalette, togglePalette } = windowSlice.actions;

export const selectPalette = (state: RootState) => state.window.palette;
export const selectColor = (isDim: boolean) => (state: RootState) => getColor(state.window.palette, isDim);

export default windowSlice.reducer;