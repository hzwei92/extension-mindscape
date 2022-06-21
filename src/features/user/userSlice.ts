import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
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
  },
});

export const { setUserId } = userSlice.actions;

export const selectUserId = (state: RootState) => state.user.userId;

export default userSlice.reducer