import type { NormalizedCacheObject } from "@apollo/client";
import type { ApolloClient } from "@apollo/client";
import { gql } from "@apollo/client";
import { AlarmType } from "~constants";
import { FULL_USER_FIELDS } from "~features/user/userFragments";
import { setUserId } from "~features/user/userSlice";
import { store } from "~store";
import { setTokenIsInit, setTokenIsValid } from "./authSlice";

const INIT_USER = gql`
  mutation InitUser {
    initUser {
      ...FullUserFields
    }
  }
  ${FULL_USER_FIELDS}
`;

const GET_CURRENT_USER = gql`
  mutation GetCurrentUser {
    getCurrentUser {
      ...FullUserFields
    }
  }
  ${FULL_USER_FIELDS}
`;

const REFRESH_TOKEN = gql`
  mutation RefreshToken {
    refreshToken {
      id
    }
  }
`;


export const refreshToken = async (client: ApolloClient<NormalizedCacheObject>) => {
  try {
    console.log('refreshToken')
    const { data } = await client.mutate({
      mutation: REFRESH_TOKEN,
    })
    console.log('refreshTokenSuccess')
    console.log(data)

    store.dispatch(setTokenIsInit(true))

    if (data.refreshToken.id) {
      store.dispatch(setTokenIsValid(true))
    }
    else {
      store.dispatch(setTokenIsValid(false))
    }
  } catch (err) {
    if (err.message === 'Unauthorized') {
      console.log('token invalid (refreshToken)')
      store.dispatch(setTokenIsInit(true));
      store.dispatch(setTokenIsValid(false));
    }
    else {
      console.error(err)
    }
  }
}

export const initUser = async (client: ApolloClient<NormalizedCacheObject>) => {
  await client.clearStore();
  try {
    const { data } = await client.mutate({
      mutation: INIT_USER,
    });
    console.log(data);
  
    store.dispatch(setUserId(data.initUser.id));
    store.dispatch(setTokenIsValid(true));

    chrome.alarms.create(AlarmType.REFRESH_TOKEN, {
      periodInMinutes: 5,
    });
    // load tabs
  } catch (err) {
    console.error(err);
  }

}

export const getCurrentUser = async (client: ApolloClient<NormalizedCacheObject>) => {
  try {
    const { data } = await client.mutate({
      mutation: GET_CURRENT_USER,
    });
    console.log(data);

    store.dispatch(setUserId(data.getCurrentUser.id));

    
    chrome.alarms.create(AlarmType.REFRESH_TOKEN, {
      periodInMinutes: 5,
    });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      console.log('token invalid (getCurrentUser)');
      store.dispatch(setTokenIsValid(false));
    }
    else {
      console.error(err);
    }
  }
}


