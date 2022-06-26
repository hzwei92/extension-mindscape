import { createSelector, createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import type { RootState } from '~store';
import type { IdToType } from '~types';
import { SpaceType } from '../space/space';
import type { Twig } from './twig';

export interface TwigState {
  [SpaceType.FRAME]: {
    newTwigId: string;

    twigIdToTrue: IdToType<true>;
    twigIdToPosReady: IdToType<boolean>;

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
    twigIdToPosReady: IdToType<boolean>;

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
    twigIdToPosReady: {},

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
    twigIdToPosReady: {},

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
      console.log(action);
      const twigIdToTrue: IdToType<true> = {
        ...state[action.payload.space].twigIdToTrue,
      };

      const twigIdToPosReady: IdToType<boolean> = {
        ...state[action.payload.space].twigIdToPosReady,
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
        twigIdToPosReady[twig.id] = false;

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
          twigIdToPosReady,
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
      };

      const twigIdToPosReady: IdToType<boolean> = {
        ...state[action.payload.space].twigIdToPosReady,
      };

      const windowIdToTwigIdToTrue: IdToType<IdToType<true>> = Object.keys(state[action.payload.space].windowIdToTwigIdToTrue)
        .reduce((acc, windowId) => {
          acc[windowId] = Object.keys(state[action.payload.space].windowIdToTwigIdToTrue[windowId] || {})
            .reduce((acc, twigId) => {
              acc[twigId] = true
              return acc;
            }, {});
          return acc;
        }, {});
        
      const groupIdToTwigIdToTrue: IdToType<IdToType<true>> = Object.keys(state[action.payload.space].groupIdToTwigIdToTrue)
      .reduce((acc, groupId) => {
        acc[groupId] = Object.keys(state[action.payload.space].groupIdToTwigIdToTrue[groupId] || {})
          .reduce((acc, twigId) => {
            acc[twigId] = true
            return acc;
          }, {});
        return acc;
      }, {});
      
      const tabIdToTwigIdToTrue: IdToType<IdToType<true>> = Object.keys(state[action.payload.space].tabIdToTwigIdToTrue)
      .reduce((acc, tabId) => {
        acc[tabId] = Object.keys(state[action.payload.space].tabIdToTwigIdToTrue[tabId] || {})
          .reduce((acc, twigId) => {
            acc[twigId] = true
            return acc;
          }, {});
        return acc;
      }, {});
      
      action.payload.twigs.forEach(twig => {
        delete twigIdToTrue[twig.id];

        delete twigIdToPosReady[twig.id];

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
          twigIdToPosReady,
          windowIdToTwigIdToTrue,
          groupIdToTwigIdToTrue,
          tabIdToTwigIdToTrue,
          shouldReloadTwigTree: true,
        }
      }
    },
    setPosReady: (state, action: PayloadAction<{space: SpaceType, twigId: string, posReady: boolean}>) => {
      const twigIdToPosReady = {
        ...state[action.payload.space].twigIdToPosReady,
        [action.payload.twigId]: action.payload.posReady,
      };
      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          twigIdToPosReady,
        }
      }
    },
    setAllPosReadyFalse: (state, action: PayloadAction<SpaceType>) => {
      const twigIdToPosReady = Object.keys(state[action.payload].twigIdToPosReady || {})
        .reduce((acc, twigId) => {
          acc[twigId] = false;
          return acc;
        }, {});

      return {
        ...state,
        [action.payload]: {
          ...state[action.payload],
          twigIdToPosReady,
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
          twigIdToPosReady: {},

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
  extraReducers: (builder) => {
    builder.addDefaultCase(state => state)
  },
});

export const {
  startNewTwig,
  finishNewTwig,
  addTwigs,
  removeTwigs,
  setTwigTree,
  resetTwigs,
  setPosReady,
  setAllPosReadyFalse,
  setShouldReloadTwigTree,
} = twigSlice.actions;

export const selectNewTwigId = (space: SpaceType) => (state: RootState) => state.twig[space].newTwigId;

export const selectTwigIdToTrue = (space: SpaceType) => (state: RootState) => state.twig[space].twigIdToTrue;
export const selectTwigIdToPosReady = (space: SpaceType) => (state: RootState) => state.twig[space].twigIdToPosReady;

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
  (idToChildToTrue, twigId) => (idToChildToTrue || {})[twigId] || {},
)

export const selectPosReady: any = createSelector(
  [
    (state, space, twigId) => selectTwigIdToPosReady(space)(state),
    (state, space, twigId) => twigId,
  ],
  (twigIdToPosReady, twigId) => {
    if (twigIdToPosReady) {
      return twigIdToPosReady[twigId]
    }
    return false;
  },
)



export default twigSlice.reducer