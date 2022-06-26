import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import type { RootState } from '~store';
import type { SpaceType } from '../space/space';
import type { Arrow, CreateLinkType, IdToHeightType } from './arrow';

export interface ArrowState {
  createLink: CreateLinkType;
  commitArrowId: string;
  removeArrowId: string;
}

const initialState: ArrowState = {
  createLink: {
    sourceId: '',
    targetId: '',
  },
  commitArrowId: '',
  removeArrowId: '',
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
        commitArrowId: '',
      }
    },
    setRemoveArrowId: (state, action: PayloadAction<string>) => {
      return {
        ...state,
        removeArrowId: '',
      }
    },
  },
});

export const {
  setCreateLink,
  setCommitArrowId,
  setRemoveArrowId,
} = arrowSlice.actions;

export const selectCreateLink = (state: RootState) => state.arrow.createLink;
export const selectCommitArrowId = (state: RootState) => state.arrow.commitArrowId;
export const selectRemoveArrowId = (state: RootState) => state.arrow.removeArrowId;
export default arrowSlice.reducer