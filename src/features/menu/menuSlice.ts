import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import type { RootState } from '~store';
import { MOBILE_WIDTH, MENU_WIDTH } from '~constants';
import { MenuMode } from './menu';
import { getAppBarWidth } from '~utils';

export interface MenuState {
  mode: MenuMode;
  isResizing: boolean;
  width: number;
}

const initialState: MenuState = {
  mode: MenuMode.NONE,
  isResizing: false,
  width: MENU_WIDTH,
};

export const menuSlice: Slice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setMenuMode: (state, action: PayloadAction<{mode: MenuMode, toggle:boolean}>) => {
      console.log('hello', action)
      return {
        ...state,
        mode: action.payload.toggle
          ? action.payload.mode === state.mode
            ? MenuMode.NONE
            : action.payload.mode
          : action.payload.mode,
      };
    },
    setMenuIsResizing: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        isResizing: action.payload,
      }
    },
    setMenuWidth: (state, action: PayloadAction<number>) => {
      return {
        ...state,
        width: action.payload,
      }
    },
  },
});

export const { setMenuMode, setMenuIsResizing, setMenuWidth } = menuSlice.actions;

export const selectMenuMode = (state: RootState) => state.menu.mode;
export const selectMenuIsResizing = (state: RootState) => state.menu.isResizing;
export const selectMenuWidth = (state: RootState) => state.menu.width;
export const selectActualMenuWidth = (state: RootState) => state.menu.mode === MenuMode.NONE
  ? 0
  : state.menu.width;

export default menuSlice.reducer