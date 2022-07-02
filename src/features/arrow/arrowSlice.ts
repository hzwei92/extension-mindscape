import { createAction, createSelector, createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import type { Twig } from '~features/twigs/twig';
import type { RootState } from '~store';
import type { IdToType } from '~types';
import type { SpaceType } from '../space/space';
import type { Arrow, CreateLinkType, IdToHeightType } from './arrow';


const addTwigs = createAction<{space: SpaceType, twigs: Twig[]}>('twig/addTwigs');

export interface ArrowState {
  createLink: CreateLinkType;
  commitArrowId: string;
  removeArrowId: string;
  idToArrow: IdToType<Arrow>;
}

const initialState: ArrowState = {
  createLink: {
    sourceId: '',
    targetId: '',
  },
  commitArrowId: '',
  removeArrowId: '',
  idToArrow: {},
};

export const arrowSlice: Slice = createSlice({
  name: 'arrow',
  initialState,
  reducers: {
    setCreateLink: (state, action: PayloadAction<CreateLinkType>) => {
      return {
        ...state,
        createLink: action.payload,
      };
    },
    setCommitArrowId: (state, action: PayloadAction<string>) => {
      return {
        ...state,
        commitArrowId: action.payload,
      }
    },
    setRemoveArrowId: (state, action: PayloadAction<string>) => {
      return {
        ...state,
        removeArrowId: action.payload,
      }
    },
    addArrows: (state, action: PayloadAction<Arrow[]>) => {
      const idToArrow: IdToType<Arrow> = action.payload.reduce((acc, arrow) => {
        acc[arrow.id] = arrow;
        return acc;
      }, {
        ...state.idToArrow,
      });

      return {
        ...state,
        idToArrow,
      };
    },
    removeArrows: (state, action) => {
      const idToArrow: IdToType<Arrow> = action.payload.reduce((acc, arrow) => {
        delete acc[arrow.id];
        return acc;
      }, {
        ...state.idToArrow,
      });

      return {
        ...state,
        idToArrow,
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(addTwigs, (state, action) => {
        const idToArrow: IdToType<Arrow> = action.payload.twigs.reduce((acc, twig) => {
          acc[twig.detailId] = twig.detail;
          return acc;
        }, {
          ...state.idToArrow,
        });

        return {
          ...state,
          idToArrow,
        };
      });
  }
});

export const {
  setCreateLink,
  setCommitArrowId,
  setRemoveArrowId,
  addArrows,
  removeArrows,
} = arrowSlice.actions;

export const selectCreateLink = (state: RootState) => state.arrow.createLink;
export const selectCommitArrowId = (state: RootState) => state.arrow.commitArrowId;
export const selectRemoveArrowId = (state: RootState) => state.arrow.removeArrowId;

export const selectIdToArrow = (state: RootState) => state.arrow.idToArrow;

export const selectArrow: any = createSelector(
  [
    (state, arrowId) => selectIdToArrow(state),
    (state, arrowId) => arrowId,
  ],
  (idToArrow, arrowId) => idToArrow[arrowId],
);

export default arrowSlice.reducer