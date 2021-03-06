import { createSelector, createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import { dirxml } from 'console';
import type { RootState } from '~store';
import type { IdToType } from '~types';
import { SpaceType } from '../space/space';
import type { PosType, Twig } from './twig';

export interface TwigState {
  [SpaceType.FRAME]: {
    newTwigId: string;

    idToTwig: IdToType<Twig>;
    twigIdToPos: IdToType<PosType>;
    twigIdToHeight: IdToType<number>;

    windowIdToTwigIdToTrue: IdToType<IdToType<true>>;
    groupIdToTwigIdToTrue: IdToType<IdToType<true>>;
    tabIdToTwigIdToTrue: IdToType<IdToType<true>>;
  },
  [SpaceType.FOCUS]: {
    newTwigId: string;

    idToTwig: IdToType<Twig>;
    twigIdToPos: IdToType<PosType>;
    twigIdToHeight: IdToType<number>;

    windowIdToTwigIdToTrue: IdToType<IdToType<true>>;
    groupIdToTwigIdToTrue: IdToType<IdToType<true>>;
    tabIdToTwigIdToTrue: IdToType<IdToType<true>>;
  },
}

const initialState: TwigState = {
  [SpaceType.FRAME]: {
    newTwigId: '',

    idToTwig: {},
    twigIdToPos: {},
    twigIdToHeight: {},

    windowIdToTwigIdToTrue: {},
    groupIdToTwigIdToTrue: {},
    tabIdToTwigIdToTrue: {},
  },
  [SpaceType.FOCUS]: {
    newTwigId: '',

    idToTwig: {},
    twigIdToPos: {},
    twigIdToHeight: {},

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
      const idToTwig: IdToType<Twig> = {
        ...state[action.payload.space].idToTwig,
      };

      const twigIdToPos: IdToType<PosType> = {
        ...state[action.payload.space].twigIdToPos,
      };

      const twigIdToHeight: IdToType<number> = {
        ...state[action.payload.space].twigIdToHeight,
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
        idToTwig[twig.id] = twig;
        twigIdToPos[twig.id] = {
          x: twig.x,
          y: twig.y,
        };
        twigIdToHeight[twig.id] = 0;

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
          idToTwig,
          twigIdToPos,
          twigIdToHeight,
          windowIdToTwigIdToTrue,
          groupIdToTwigIdToTrue,
          tabIdToTwigIdToTrue,
        }
      };
    },
    removeTwigs: (state, action: PayloadAction<{space: SpaceType, twigs: Twig[]}>) => {
      console.log(action);
      const idToTwig: IdToType<Twig> = {
        ...state[action.payload.space].idToTwig,
      };

      const twigIdToPos: IdToType<PosType> = {
        ...state[action.payload.space].twigIdToPos,
      };

      const twigIdToHeight: IdToType<number> = {
        ...state[action.payload.space].twigIdToHeight,
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
        delete idToTwig[twig.id];
        delete twigIdToPos[twig.id];
        delete twigIdToHeight[twig.id];

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
          idToTwig,
          twigIdToPos,
          twigIdToHeight,
          windowIdToTwigIdToTrue,
          groupIdToTwigIdToTrue,
          tabIdToTwigIdToTrue,
        }
      }
    },
    // setPos: (state, action: PayloadAction<{space: SpaceType, twigId: string, pos: PosType}>) => {
    //   const twigIdToPos: IdToType<PosType> = {
    //     ...state[action.payload.space].twigIdToPos,
    //     [action.payload.twigId]: action.payload.pos,
    //   };
    //   return {
    //     ...state,
    //     [action.payload.space]: {
    //       ...state[action.payload.space],
    //       twigIdToPos,
    //     },
    //   };
    // },
    // movePos: (state, action: PayloadAction<{space: SpaceType, twigIds: string[], dx: number, dy: number}>) => {
    //   const twigIdToPos: IdToType<PosType> = action.payload.twigIds.reduce((acc, twigId) => {
    //     acc[twigId] = {
    //       x: acc[twigId].x + action.payload.dx,
    //       y: acc[twigId].y + action.payload.dy,
    //     };
    //     return acc;
    //   }, {
    //     ...state[action.payload.space].twigIdToPos,
    //   })
    //   return {
    //     ...state,
    //     [action.payload.space]: {
    //       ...state[action.payload.space], 
    //       twigIdToPos,
    //     },
    //   };
    // },
    setHeight: (state, action: PayloadAction<{space: SpaceType, twigId: string, height: number}>) => {
      const twigIdToHeight: IdToType<number> = {
        ...state[action.payload.space].twigIdToHeight,
        [action.payload.twigId]: action.payload.height,
      };
      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          twigIdToHeight,
        },
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

          idToTwig: {},
          twigIdToPos: {},
          twigIdToHeight: {},

          idToDescIdToTrue: {},
          idToChildIdToTrue: {},
          
          windowIdToTwigIdToTrue: {},
          groupIdToTwigIdToTrue: {},
          tabIdToTwigIdToTrue: {},
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
  resetTwigs,
  setHeight,
} = twigSlice.actions;

export const selectNewTwigId = (space: SpaceType) => (state: RootState) => state.twig[space].newTwigId;

export const selectIdToTwig = (space: SpaceType) => (state: RootState) => state.twig[space].idToTwig;
export const selectTwigIdToPos = (space: SpaceType) => (state: RootState) => state.twig[space].twigIdToPos;
export const selectTwigIdToHeight = (space: SpaceType) => (state: RootState) => state.twig[space].twigIdToHeight;

export const selectWindowIdToTwigIdToTrue = (space: SpaceType) => (state: RootState) => state.twig[space].windowIdToTwigIdToTrue;
export const selectGroupIdToTwigIdToTrue = (space: SpaceType) => (state: RootState) => state.twig[space].groupIdToTwigIdToTrue;
export const selectTabIdToTwigIdToTrue = (space: SpaceType) => (state: RootState) => state.twig[space].tabIdToTwigIdToTrue;

export const selectHeight: any = createSelector(
  [
    (state, space, twigId) => selectTwigIdToHeight(space)(state),
    (state, space, twigId) => twigId,
  ],
  (twigIdToHeight, twigId) => {
    return twigIdToHeight[twigId];
  },
);

// export const selectPos: any = createSelector(
//   [
//     (state, space, twigId) => selectTwigIdToPos(space)(state),
//     (state, space, twigId) => twigId,
//   ],
//   (twigIdToPos, twigId) => {
//     return twigIdToPos[twigId];
//   }
// );


export default twigSlice.reducer