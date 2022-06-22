import { createSelector, createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import type { RootState } from '~store';
import type { IdToType } from '~types';
import { SpaceType } from '../space/space';
import type { Twig } from './twig';

export interface TwigState {
  [SpaceType.FRAME]: {
    newTwigId: string;

    twigIdToTrue: IdToType<true>;
    twigIdToRequiresRerender: IdToType<Boolean>;

    shouldReloadTwigTree: boolean;
    idToChildIdToTrue: IdToType<IdToType<true>>;
    idToDescIdToTrue: IdToType<IdToType<true>>;

    windowIdToTwigIdToTrue: IdToType<IdToType<true>>;
    groupIdToTwigIdToTrue: IdToType<IdToType<true>>;
    tabIdToTwigIdToTrue: IdToType<IdToType<true>>;
  },
  [SpaceType.FOCUS]: {
    newTwigId: string;

    twigIdToTrue: IdToType<true>;
    twigIdToRequiresRerender: IdToType<Boolean>;

    shouldReloadTwigTree: boolean;
    idToChildIdToTrue: IdToType<IdToType<true>>;
    idToDescIdToTrue: IdToType<IdToType<true>>;

    windowIdToTwigIdToTrue: IdToType<IdToType<true>>;
    groupIdToTwigIdToTrue: IdToType<IdToType<true>>;
    tabIdToTwigIdToTrue: IdToType<IdToType<true>>;
  },
}

const initialState: TwigState = {
  [SpaceType.FRAME]: {
    newTwigId: '',

    twigIdToTrue: {},
    twigIdToRequiresRerender: {},

    shouldReloadTwigTree: false,
    idToChildIdToTrue: {},
    idToDescIdToTrue: {},

    windowIdToTwigIdToTrue: {},
    groupIdToTwigIdToTrue: {},
    tabIdToTwigIdToTrue: {},
  },
  [SpaceType.FOCUS]: {
    newTwigId: '',

    twigIdToTrue: {},
    twigIdToRequiresRerender: {},

    shouldReloadTwigTree: false,
    idToChildIdToTrue: {},
    idToDescIdToTrue: {},

    windowIdToTwigIdToTrue: {},
    groupIdToTwigIdToTrue: {},
    tabIdToTwigIdToTrue: {},
  }
};

export const twigSlice: Slice<TwigState> = createSlice({
  name: 'twig',
  initialState,
  reducers: {
    addTwigs: (state, action: PayloadAction<{space: SpaceType, twigs: Twig[]}>) => {
      const twigIdToTrue: IdToType<true> = {
        ...state[action.payload.space].twigIdToTrue,
      };

      const windowIdToTwigIdToTrue: IdToType<IdToType<true>> = {
        ...state[action.payload.space].windowIdToTwigIdToTrue,
      };
      const groupIdToTwigIdToTrue: IdToType<IdToType<true>> = {
        ...state[action.payload.space].groupIdToTwigIdToTrue,
      };
      const tabIdToTwigIdToTrue: IdToType<IdToType<true>> = {
        ...state[action.payload.space].tabIdToTwigIdToTrue,
      };
      action.payload.twigs.forEach(twig => {
        twigIdToTrue[twig.id] = true;

        if (twig.tabId) {
          tabIdToTwigIdToTrue[twig.tabId] = {
            ...(tabIdToTwigIdToTrue[twig.tabId] || {}),
            [twig.id]: true 
          };
        }
        else if (twig.groupId) {
          groupIdToTwigIdToTrue[twig.groupId] = {
            ...(groupIdToTwigIdToTrue[twig.groupId] || {}),
            [twig.id]: true 
          };
        }
        else if (twig.windowId) {
          windowIdToTwigIdToTrue[twig.windowId] = {
            ...(windowIdToTwigIdToTrue[twig.windowId] || {}),
            [twig.id]: true,
          };
        }
      });
      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          twigIdToTrue,
          windowIdToTwigIdToTrue,
          groupIdToTwigIdToTrue,
          tabIdToTwigIdToTrue,
          shouldReloadTwigTree: true,
        }
      };
    },
    removeTwigs: (state, action: PayloadAction<{space: SpaceType, twigs: Twig[]}>) => {
      console.log(action);
      const twigIdToTrue: IdToType<true> = {
        ...state[action.payload.space].twigIdToTrue,
      }

      const windowIdToTwigIdToTrue: IdToType<IdToType<true>> = {
        ...state[action.payload.space].windowIdToTwigIdToTrue,
      };
      const groupIdToTwigIdToTrue: IdToType<IdToType<true>> = {
        ...state[action.payload.space].groupIdToTwigIdToTrue,
      };
      const tabIdToTwigIdToTrue: IdToType<IdToType<true>> = {
        ...state[action.payload.space].tabIdToTwigIdToTrue,
      };
      action.payload.twigs.forEach(twig => {
        delete twigIdToTrue[twig.id];

        delete (windowIdToTwigIdToTrue[twig.windowId] || {})[twig.id];
        if (windowIdToTwigIdToTrue[twig.windowId] && Object.keys(windowIdToTwigIdToTrue[twig.windowId]).length === 0) {
          delete windowIdToTwigIdToTrue[twig.windowId];
        }

        delete (groupIdToTwigIdToTrue[twig.groupId] || {})[twig.id];
        if (groupIdToTwigIdToTrue[twig.groupId] && Object.keys(groupIdToTwigIdToTrue[twig.groupId]).length === 0) {
          delete groupIdToTwigIdToTrue[twig.groupId];
        }

        delete (tabIdToTwigIdToTrue[twig.tabId] || {})[twig.id];
        if (tabIdToTwigIdToTrue[twig.windowId] && Object.keys(tabIdToTwigIdToTrue[twig.windowId]).length === 0) {
          delete tabIdToTwigIdToTrue[twig.tabId];
        }
      });
      return {
        ...state, 
        [action.payload.space]: {
          ...state[action.payload.space],
          twigIdToTrue,
          windowIdToTwigIdToTrue,
          groupIdToTwigIdToTrue,
          tabIdToTwigIdToTrue,
          shouldReloadTwigTree: true,
        }
      }
    },
    setRequiresRerender: (state, action: PayloadAction<{space: SpaceType, twigId: string, requiresRerender: boolean}>) => {
      const twigIdToRequiresRerender = {
        ...state[action.payload.space].twigIdToRequiresRerender,
        [action.payload.twigId]: action.payload.requiresRerender,
      };
      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          twigIdToRequiresRerender,
        }
      }
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
    startNewTwig: (state, action: PayloadAction<{space: SpaceType, newTwigId: string}>) => {
      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          newTwigId: action.payload.newTwigId,
        }
      };
    },
    finishNewTwig: (state, action: PayloadAction<{space: SpaceType}>) => {
      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          newTwigId: '',
        }
      };
    },
    resetTwigs: (state, action: PayloadAction<SpaceType>) => {
      return {
        ...state,
        [action.payload]: {
          twigId: '',
          newTwigId: '',

          twigIdToTrue: {},
          twigIdToRequiresRerender: {},

          shouldReloadTwigTree: false,
          idToDescIdToTrue: {},
          idToChildIdToTrue: {},
          
          windowIdToTwigIdToTrue: {},
          groupIdToTwigIdToTrue: {},
          tabIdToTwigIdToTrue: {},
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
  },
});

export const {
  startNewTwig,
  finishNewTwig,
  addTwigs,
  removeTwigs,
  setTwigTree,
  resetTwigs,
  setRequiresRerender,
  setShouldReloadTwigTree,
} = twigSlice.actions;

export const selectNewTwigId = (space: SpaceType) => (state: RootState) => state.twig[space].newTwigId;

export const selectTwigIdToTrue = (space: SpaceType) => (state: RootState) => state.twig[space].twigIdToTrue;
export const selectTwigIdToRequiresRerender = (space: SpaceType) => (state: RootState) => state.twig[space].twigIdToRequiresRerender;

export const selectShouldReloadTwigTree = (space: SpaceType) => (state: RootState) => state.twig[space].shouldReloadTwigTree;
export const selectIdToChildIdToTrue = (space: SpaceType) => (state: RootState) => state.twig[space].idToChildIdToTrue;
export const selectIdToDescIdToTrue = (space: SpaceType) => (state: RootState) => state.twig[space].idToDescIdToTrue;

export const selectWindowIdToTwigIdToTrue = (space: SpaceType) => (state: RootState) => state.twig[space].windowIdToTwigIdToTrue;
export const selectGroupIdToTwigIdToTrue = (space: SpaceType) => (state: RootState) => state.twig[space].groupIdToTwigIdToTrue;
export const selectTabIdToTwigIdToTrue = (space: SpaceType) => (state: RootState) => state.twig[space].tabIdToTwigIdToTrue;

export const selectChildIdToTrue: any = createSelector(
  [
    (state, space, twigId) => selectIdToChildIdToTrue(space)(state),
    (state, space, twigId) => twigId,
  ],
  (idToChildToTrue, twigId) => (idToChildToTrue || {})[twigId],
)

export const selectRequiresRerender: any = createSelector(
  [
    (state, space, twigId) => selectTwigIdToRequiresRerender(space)(state),
    (state, space, twigId) => twigId,
  ],
  (twigIdToRequiresRerender, twigId) => {
    if (twigIdToRequiresRerender) {
      return twigIdToRequiresRerender[twigId]
    }
    return false;
  },
)



export default twigSlice.reducer