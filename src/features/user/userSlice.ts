import { createAction, createSelector, createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import type { Twig } from '~features/twigs/twig';
import type { RootState } from '~store';
import type { IdToType } from '~types';
import { SpaceType } from '../space/space';
import type { User } from './user';

const addTwigs = createAction<{space: SpaceType, twigs: Twig[]}>('twig/addTwigs')

export interface UserState {
  currentUser: User;
  [SpaceType.FRAME]: {
    idToUser: IdToType<User>;
  };
  [SpaceType.FOCUS]: {
    idToUser: IdToType<User>;
  };
}

const initialState: UserState = {
  currentUser: null,
  [SpaceType.FRAME]: {
    idToUser: {},
  },
  [SpaceType.FOCUS]: {
    idToUser: {},
  },
};

export const userSlice: Slice<UserState> = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      return {
        ...state,
        currentUser: action.payload,
      }
    },
    resetUsers: (state, action: PayloadAction<SpaceType>) => {
      return {
        ...state,
        [action.payload]: {
          idToUser: {},
        }
      };
    },
    addUsers: (state, action) => {
      const idToUser: IdToType<User> = action.payload.users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, { ...state[action.payload.space].idToUser });

      return {
        ...state,
        [action.payload.space]: {
          ...state[action.payload.space],
          idToUser,
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(addTwigs, (state, action) => {
        console.log(action);
        const idToUser: IdToType<User> = action.payload.twigs.reduce((acc, twig) => {
          acc[twig.userId] = twig.user;
          if (twig.detail) {
            acc[twig.detail.userId] = twig.detail.user;
          }
          return acc;
        }, { ...state[action.payload.space].idToUser });

        return {
          ...state,
          [action.payload.space]: {
            ...state[action.payload.space],
            idToUser,
          }
        };
      })
      .addDefaultCase(state => state)
  },
});

export const {
  setCurrentUser,
  addUsers,
  resetUsers,
} = userSlice.actions;

export const selectCurrentUser = (state: RootState) => state.user.currentUser;
export const selectIdToUser = (space: SpaceType) => (state: RootState) => state.user[space].idToUser;

export default userSlice.reducer