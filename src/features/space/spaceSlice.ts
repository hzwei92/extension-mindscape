import { createAction, createSelector, createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import type { Twig } from '~features/twigs/twig';
import { resetTwigs } from '~features/twigs/twigSlice';
import { resetUsers } from '~features/user/userSlice';
import { RootState, store } from '~store';
import type { IdToType } from '~types';
import { SpaceType } from './space';

const addTwigs = createAction<{space: SpaceType, twigs: Twig[]}>('twig/addTwigs');
const removeTwigs = createAction<{space: SpaceType, twigs: Twig[]}>('twig/removeTwigs');

export interface SpaceState {
  space: SpaceType;
  [SpaceType.FRAME]: {
    isOpen: boolean;
    shouldReloadTwigTree: boolean;
    idToChildIdToTrue: IdToType<IdToType<true>>;
    idToDescIdToTrue: IdToType<IdToType<true>>;
  }
  [SpaceType.FOCUS]: {
    isOpen: boolean;
    shouldReloadTwigTree: boolean;
    idToChildIdToTrue: IdToType<IdToType<true>>;
    idToDescIdToTrue: IdToType<IdToType<true>>;
  }
}

const initialState: SpaceState = {
  space: SpaceType.FRAME,
  [SpaceType.FRAME]: {
    isOpen: true,
    shouldReloadTwigTree: false,
    idToChildIdToTrue: {},
    idToDescIdToTrue: {},
  },
  [SpaceType.FOCUS]: {
    isOpen: false,
    shouldReloadTwigTree: false,
    idToChildIdToTrue: {},
    idToDescIdToTrue: {},
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
    setShouldReloadTwigTree: (state, action: PayloadAction<{space: SpaceType, shouldReloadTwigTree: boolean}>) => {
      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          shouldReloadTwigTree: action.payload.shouldReloadTwigTree,
        },
      };
    },
    setTwigTree: (state, action: PayloadAction<{space: SpaceType, idToChildIdToTrue: IdToType<IdToType<true>>, idToDescIdToTrue: IdToType<IdToType<true>>}>) => {
      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          idToChildIdToTrue: action.payload.idToChildIdToTrue,
          idToDescIdToTrue: action.payload.idToDescIdToTrue,
          shouldReloadTwigTree: false,
        }
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addTwigs, (state, action) => {
        return {
          ...state,
          [action.payload.space]: {
            ...state[action.payload.space],
            shouldReloadTwigTree: true,
          }
        }
      })
      .addCase(removeTwigs, (state, action) => {
        return {
          ...state,
          [action.payload.space]: {
            ...state[action.payload.space],
            shouldReloadTwigTree: true,
          }
        }
      })
      .addDefaultCase(state => state)
  },
});

export const {
  setSpace,
  setIsOpen,
  setShouldReloadTwigTree,
  setTwigTree,
} = spaceSlice.actions;

export const resetSpace = (space: SpaceType) => {
  console.log('resetSpace', space);
  store.dispatch(resetUsers(space));
  store.dispatch(resetTwigs(space));
  //store.dispatch(resetArrows(space));
}


export const selectSpace = (state: RootState) => state.space.space;
export const selectIsOpen = (space: SpaceType) => (state: RootState) => state.space[space].isOpen;

export const selectShouldReloadTwigTree = (space: SpaceType) => (state: RootState) => state.space[space].shouldReloadTwigTree;
export const selectIdToChildIdToTrue = (space: SpaceType) => (state: RootState) => state.space[space].idToChildIdToTrue;
export const selectIdToDescIdToTrue = (space: SpaceType) => (state: RootState) => state.space[space].idToDescIdToTrue;


export const selectChildIdToTrue: any = createSelector(
  [
    (state, space, twigId) => selectIdToChildIdToTrue(space)(state),
    (state, space, twigId) => twigId,
  ],
  (idToChildToTrue, twigId) => (idToChildToTrue || {})[twigId] || {},
);


export default spaceSlice.reducer