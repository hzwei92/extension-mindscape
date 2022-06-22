import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import type { Twig } from '~features/twigs/twig';
import type { RootState } from '~store';
import type { IdToType } from '~types';
import type { SpaceType } from '../space/space';


export interface UserState {
  userId: string;
  FRAME: {
    userIdToTrue: IdToType<true>;
  };
  FOCUS: {
    userIdToTrue: IdToType<true>;
  };
}

const initialState: UserState = {
  userId: '',
  FRAME: {
    userIdToTrue: {},
  },
  FOCUS: {
    userIdToTrue: {},
  },
};

export const userSlice: Slice<UserState> = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      return {
        ...state,
        userId: action.payload,
      };
    },
    addTwigUsers: (state, action: PayloadAction<{space: SpaceType, twigs: Twig[]}>) => {
      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          userIdToTrue: action.payload.twigs.reduce((acc, twig) => {
            acc[twig.userId] = true;
            acc[twig.detail.userId] = true;
            return acc;
          }, { ...state[action.payload.space].userIdToTrue })
        }
      }
    },
    resetUsers: (state, action: PayloadAction<SpaceType>) => {
      return {
        ...state,
        [action.payload]: initialState[action.payload]
      };
    },
  },
});

export const {
  setUserId,
  addTwigUsers,
  resetUsers,
} = userSlice.actions;

export const selectUserId = (state: RootState) => state.user.userId;
export const selectUserIdToTrue = (space: SpaceType) => (state: RootState) => state.user[space].userIdToTrue;

export default userSlice.reducer