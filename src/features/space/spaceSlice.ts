import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import { resetTwigs } from '~features/twigs/twigSlice';
import { resetUsers } from '~features/user/userSlice';
import { RootState, store } from '~store';
import { DragState, ScrollState, SpaceType } from './space';

export interface SpaceState {
  space: SpaceType;
  [SpaceType.FRAME]: {
    isOpen: boolean;
  }
  [SpaceType.FOCUS]: {
    isOpen: boolean;
  }
}

const initialState: SpaceState = {
  space: SpaceType.FRAME,
  [SpaceType.FRAME]: {
    isOpen: true,
  },
  [SpaceType.FOCUS]: {
    isOpen: false,
  },
};

export const spaceSlice: Slice<SpaceState> = createSlice({
  name: 'space',
  initialState,
  reducers: {
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
  },
  extraReducers: (builder) => {
    builder.addDefaultCase(state => state)
  },
});

export const {
  setSpace,
  setIsOpen,
} = spaceSlice.actions;

export const resetSpace = (space: SpaceType) => {
  console.log('resetSpace', space);
  store.dispatch(resetUsers(space));
  store.dispatch(resetTwigs(space));
  //store.dispatch(resetArrows(space));
}


export const selectSpace = (state: RootState) => state.space.space;
export const selectIsOpen = (space: SpaceType) => (state: RootState) => state.space[space].isOpen;

export default spaceSlice.reducer