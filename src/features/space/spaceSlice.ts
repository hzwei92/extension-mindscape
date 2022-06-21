import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import { resetTwigs } from '~features/twigs/twigSlice';
import { RootState, store } from '~store';
import { DragState, ScrollState, SpaceType } from './space';

export interface SpaceState {
  space: SpaceType;
  isResizing: boolean;
  frameWidth: number;
  [SpaceType.FRAME]: {
    isOpen: boolean;
    scale: number;
    scroll: ScrollState;
    drag: DragState;
  }
  [SpaceType.FOCUS]: {
    isOpen: boolean;
    scale: number;
    scroll: ScrollState;
    drag: DragState;
  }
}

const initialState: SpaceState = {
  space: SpaceType.FRAME,
  isResizing: false,
  frameWidth: 0,
  [SpaceType.FRAME]: {
    isOpen: true,
    scale: 0.75,
    drag: {
      isScreen: false,
      twigId: '',
      dx: 0,
      dy: 0,
      targetTwigId: '',
    },
    scroll: {
      left: 0,
      top: 0,
    },
  },
  [SpaceType.FOCUS]: {
    isOpen: false,
    scale: 0.75,
    drag: {
      isScreen: false,
      twigId: '',
      dx: 0,
      dy: 0,
      targetTwigId: '',
    },
    scroll: {
      left: 0,
      top: 0,
    },
  },
};

export const spaceSlice: Slice<SpaceState> = createSlice({
  name: 'space',
  initialState,
  reducers: {
    setIsResizing: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        isResizing: action.payload,
      };
    },
    setFrameWidth: (state, action: PayloadAction<number>) => {
      return {
        ...state,
        frameWidth: action.payload,
      }
    },
    setSpace: (state, action: PayloadAction<SpaceType>) => {
      return {
        ...state,
        space: action.payload,
        [action.payload]: {
          ...state[action.payload],
          isOpen: true
        },
      };
    },
    setIsOpen: (state, action: PayloadAction<{space: SpaceType, isOpen: boolean}>) => {
      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          isOpen: action.payload.isOpen
        },
      };
    },
    setScale: (state, action: PayloadAction<{space: SpaceType, scale: number}>) => {
      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          scale: action.payload.scale,
        },
      }
    },
    setScroll: (state, action: PayloadAction<{space: SpaceType, scroll: ScrollState}>) => {
      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          scroll: action.payload.scroll,
        },
      }
    },
    setDrag: (state, action: PayloadAction<{space: SpaceType, drag: DragState}>) => {
      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          drag: action.payload.drag,
        },
      }
    },
  }
});

export const {
  setSpace,
  setIsOpen,
  setScale,
  setScroll,
  setDrag,
  setFrameWidth,
  setIsResizing,
} = spaceSlice.actions;

export const resetSpace = (space: SpaceType) => {
  console.log('resetSpace', space);
  //store.dispatch(resetUsers(space));
  //store.dispatch(resetArrows(space));
  store.dispatch(resetTwigs(space));
}


export const selectSpace = (state: RootState) => state.space.space;
export const selectIsOpen = (space: SpaceType) => (state: RootState) => state.space[space].isOpen;
export const selectScale = (space: SpaceType) => (state: RootState) => state.space[space].scale;
export const selectScroll = (space: SpaceType) => (state: RootState) => state.space[space].scroll;
export const selectDrag = (space: SpaceType) => (state: RootState) => state.space[space].drag;

export const selectIsResizing = (state: RootState) => state.space.isResizing;
export const selectFrameWidth = (state: RootState) => state.space.frameWidth;


export default spaceSlice.reducer